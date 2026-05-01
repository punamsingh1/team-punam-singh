import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const jwtSecret = process.env.JWT_ACCESS_SECRET;
  if (!jwtSecret) {
    console.error("❌ JWT_ACCESS_SECRET is missing!");
    return NextResponse.next();
  }
  const secret = new TextEncoder().encode(jwtSecret);

  // 1. Detect if this is an API call vs a Page navigation
  const isApi = pathname.startsWith('/api');
  const isPublic = pathname === '/login' || pathname === '/register' || pathname === '/';

  if (isPublic) return NextResponse.next();

  // 2. Protect Routes
  if (pathname.startsWith('/dashboard')) {
    const cookieToken = request.cookies.get('accessToken')?.value;

    if (!cookieToken) {
      return handleUnauthorized(request, isApi, "No cookie found");
    }

    try {
      await jwtVerify(cookieToken, secret);
      return NextResponse.next();
    } catch (err: unknown) {
      return handleAuthError(err, request, isApi);
    }
  }

  return NextResponse.next();
}

/**
 * Logic to decide whether to Redirect (for pages) or Return JSON (for APIs)
 */
function handleUnauthorized(req: NextRequest, isApi: boolean, reason: string) {
  if (isApi) {
    return NextResponse.json({ message: "Unauthorized", reason }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login?error=session_expired', req.url));
}

function handleAuthError(err: unknown, req: NextRequest, isApi: boolean) {
  // Check specifically for expired tokens without using 'any'
  if (err instanceof Error && 'code' in err && err.code === 'ERR_JWT_EXPIRED') {
    if (isApi) {
      return NextResponse.json(
        { message: "Token expired" }, 
        { status: 401, headers: { 'x-auth-status': 'expired' } }
      );
    }
    return NextResponse.redirect(new URL('/login?error=session_expired', req.url));
  }

  // Handle other errors (like invalid signature)
  return handleUnauthorized(req, isApi, "Invalid token");
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export default proxy;