import { NextResponse } from 'next/server';
import { userDb } from '@/lib/couchdb';
import { jwtVerify } from 'jose';

// Define the User Document Interface (No 'any' keywords)
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

export async function GET(req: Request) {
  try {
    // 1. Extract Token from Cookie (API-First for Web)
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader
      ?.split(';')
      .find((c) => c.trim().startsWith('accessToken='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ message: "Not Authorized" }, { status: 401 });
    }

    // 2. Verify Token using jose (Edge Runtime compatible)
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // The payload contains the userId we stored during login
    const userId = payload.userId as string;

    // 3. Fetch User Data from CouchDB
    const user = (await userDb.get(userId)) as unknown as UserProfile;

    // 4. Return Ttteeee Telemetry Data
    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        status: "Active",
        lastSync: new Date().toISOString(),
        system: "API-First V1"
      }
    }, { status: 200 });

  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    
    if (err.statusCode === 404) {
      return NextResponse.json({ message: "Identity not found" }, { status: 404 });
    }

    console.error("📊 DASHBOARD_API_ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}