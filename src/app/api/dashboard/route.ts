import { NextResponse } from 'next/server';
import { userDb } from '@/lib/couchdb';
import { jwtVerify } from 'jose';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role?: string;
  status: string;
}

export async function GET(req: Request) {
  try {
    // FIXED: read from Authorization header, not cookie
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // FIXED: your login stores sub not userId in token payload
    const userId = (payload.sub ?? payload.userId) as string;

    const user = (await userDb.get(userId)) as unknown as UserProfile;

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        status: user.status,
        lastSync: new Date().toISOString(),
        system: "API-First V1"
      }
    });

  } catch (error: unknown) {
    const err = error as { statusCode?: number; code?: string };

    if (err.statusCode === 404) {
      return NextResponse.json({ message: "Identity not found" }, { status: 404 });
    }

    // FIXED: handle expired token specifically — tell frontend to refresh
    if (err.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json({ message: "Token expired" }, { status: 401 });
    }

    console.error("📊 DASHBOARD_API_ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}