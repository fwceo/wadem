import { NextRequest, NextResponse } from 'next/server';

// Public pages — accessible without auth
const PUBLIC_PAGES = new Set(['/login', '/onboarding', '/verify']);

// Browsable pages — accessible after "Skip" (no session needed)
const BROWSABLE_PAGES = new Set(['/', '/search']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public pages
  if (PUBLIC_PAGES.has(pathname)) {
    return NextResponse.next();
  }

  // Allow browsable pages (home, search) — users who skipped can see these
  if (BROWSABLE_PAGES.has(pathname)) {
    return NextResponse.next();
  }

  // Allow restaurant detail pages for browsing
  if (pathname.startsWith('/restaurant/')) {
    return NextResponse.next();
  }

  // Protected pages (orders, profile) require session
  const session = request.cookies.get('__session')?.value;

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

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
