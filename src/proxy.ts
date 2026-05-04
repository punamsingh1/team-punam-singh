import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle the Root Redirect first
  // If the user visits the home page, send them to Register immediately
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/register', request.url));
  }

  // 2. Define Public Routes (Note: '/' is removed from here)
  const isPublic =
    pathname === '/login' ||
    pathname === '/login/' ||
    pathname === '/register' ||
    pathname === '/register/' ||
    pathname.startsWith('/api/auth/');

  // 3. Allow Public Routes
  if (isPublic) {
    return NextResponse.next();
  }

  // 4. Protect Dashboard Routes
  if (pathname.startsWith('/dashboard')) {
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (!refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};