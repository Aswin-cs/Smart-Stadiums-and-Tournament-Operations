import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // We only protect /fan and /organiser routes in this middleware
  if (pathname.startsWith('/fan') || pathname.startsWith('/organiser')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'test-secret' });
    const sessionCookie = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');
    
    const isAuthenticated = !!token || !!sessionCookie;

    if (!isAuthenticated) {
      const url = req.nextUrl.clone();
      url.pathname = '/api/auth/signin';
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/organiser')) {
      const isOrganiser = token?.role === 'organiser' || req.cookies.get('role')?.value === 'organiser';
      
      if (!isOrganiser) {
        const url = req.nextUrl.clone();
        url.pathname = '/fan';
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/fan/:path*', '/organiser/:path*'],
};
