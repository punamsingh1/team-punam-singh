import { NextResponse, NextRequest } from 'next/server'; // 1. Update this import
import { jwtVerify, SignJWT } from 'jose';
import { env } from '@/config/env';

// 2. Change 'req: Request' to 'req: NextRequest'
export async function POST(req: NextRequest) {
  
  // Now 'req.cookies' will work perfectly because 'req' is a NextRequest
  const refreshToken = req.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token provided" }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
    
    // Verify token
    const { payload } = await jwtVerify(refreshToken, secret);
    
    // Ensure userId exists in payload
    const userId = typeof payload.userId === 'string' ? payload.userId : '';
    if (!userId) throw new Error("Invalid token payload");

    // Issue new Access Token
    const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
    const newAccessToken = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(accessSecret);

    // Return success with Secure Cookie
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 900 // 15 minutes
    });
    
    return response;
    
  } catch (err: unknown) {
    console.error("Refresh Token Error:", err);
    return NextResponse.json({ message: "Refresh token invalid or expired" }, { status: 401 });
  }
}