import { auth } from './src/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  if (pathname.startsWith('/api/auth') || pathname === '/login') {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if password change is required
  if (session.user?.passwordChangeRequired && pathname !== '/change-password') {
    return NextResponse.redirect(new URL('/change-password', req.url));
  }

  // Allow access to change-password page
  if (pathname === '/change-password') {
    return NextResponse.next();
  }

  // Admin routes protection
  if (pathname.startsWith('/admin') && !session.user?.isAdmin) {
    return NextResponse.redirect(new URL('/guides', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

