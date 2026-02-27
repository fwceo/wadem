import { NextRequest, NextResponse } from 'next/server';

// Public page routes that never require auth
const PUBLIC_PAGES = new Set(['/login', '/onboarding', '/verify']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public pages
  if (PUBLIC_PAGES.has(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get('__session')?.value;

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// ONLY run middleware on these explicit page routes.
// This ensures _next/*, api/*, static assets are NEVER intercepted.
export const config = {
  matcher: [
    '/',
    '/search',
    '/orders',
    '/orders/:path*',
    '/profile',
    '/restaurant/:path*',
  ],
};
