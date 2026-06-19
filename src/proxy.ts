import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Ttteeee API-First Proxy Layer
 * Renamed from 'middleware' to 'proxy' to match your filename.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Get Secret safely
  const jwtSecret = process.env.JWT_ACCESS_SECRET;
  if (!jwtSecret) {
    console.error("❌ JWT_ACCESS_SECRET is missing from .env!");
    return NextResponse.next();
  }
  const secret = new TextEncoder().encode(jwtSecret);

  // 2. Define Public Routes
  const isPublicPage = pathname === '/login' || pathname === '/register' || pathname === '/';
  const isPublicApi = pathname.startsWith('/api/auth');

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  // 3. Protect Dashboard (Web/Cookie Flow)
  if (pathname.startsWith('/dashboard')) {
    const cookieToken = request.cookies.get('accessToken')?.value;

    if (!cookieToken) {
      console.log(`🛡️ Access Denied to ${pathname}: No Cookie Found`);
      return NextResponse.redirect(new URL('/login?error=session_expired', request.url));
    }

    try {
      // Verify with jose (Edge Runtime compatible)
      await jwtVerify(cookieToken, secret);
      console.log(`✅ Proxy Auth Success: ${pathname}`);
      return NextResponse.next();
    } catch (err) {
      console.error("❌ Proxy Auth Failed:", err);
      return NextResponse.redirect(new URL('/login?error=session_expired', request.url));
    }
  }

  return NextResponse.next();
}

// Ensure Next.js recognizes the function
export default proxy;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};