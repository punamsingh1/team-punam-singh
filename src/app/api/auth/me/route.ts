import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth-utils';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    // FIXED: read from Authorization header, not cookie
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json({ message: "No token found" }, { status: 401 });
    }

    const decoded = verifyJWT(token, 'access');

    if (!decoded || !decoded.userId) {
      console.warn("❌ Auth Me: Token verification returned null");
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        session: decoded.sessionId
      }
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Auth Me System Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 401 });
  }
}