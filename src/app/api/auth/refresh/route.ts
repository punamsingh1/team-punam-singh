import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateTokens, verifyJWT } from '@/lib/auth-utils';
import { sessionDb } from '@/lib/couchdb';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: "No refresh token" }, { status: 401 });
    }

    // FIXED: use your existing verifyJWT, not jwtVerify from jose
    const payload = verifyJWT(refreshToken, 'refresh');

    if (!payload) {
      return NextResponse.json({ message: "Invalid or expired refresh token" }, { status: 401 });
    }

    // FIXED: read userId not sub — matches generateTokens
    const { userId, sessionId } = payload;

    // Check session still exists
    const session = await sessionDb.get(`session:${sessionId}`).catch(() => null);
    if (!session) {
      return NextResponse.json({ message: "Session not found" }, { status: 401 });
    }

    // Issue new accessToken
    const { accessToken } = generateTokens(userId, sessionId);

    return NextResponse.json({ accessToken });

  } catch {
    return NextResponse.json({ message: "Refresh failed" }, { status: 401 });
  }
}