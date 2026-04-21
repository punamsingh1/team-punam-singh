import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth-utils'; // 👈 Use your centralized utility

export const runtime = 'nodejs'; 

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json({ message: "No token found" }, { status: 401 });
    }

    // 🛡️ Use your utility instead of 'jose'
    // This ensures we use 'jsonwebtoken' logic consistent with your Login
    const decoded = verifyJWT(token, 'access');

    if (!decoded || !decoded.userId) {
      console.warn("❌ Auth Me: Token verification returned null");
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    // Return the user data (TTTEEEE API-First style)
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