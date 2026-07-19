import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

function customMiddleware(request) {
  const url = request.nextUrl;
  
  // 1. CSP Generation
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSrc = isDev 
    ? `'self' 'unsafe-eval' 'unsafe-inline'`
    : `'self' 'unsafe-inline'`;

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https://generativelanguage.googleapis.com;
  `.replace(/\s{2,}/g, ' ').trim();

  // Clone headers to inject CSP
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // 2. CSRF Protection (Double Submit Cookie)
  const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  let response;

  if (methods.includes(request.method) && url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth')) {
    const csrfCookie = request.cookies.get('csrf_token')?.value;
    const csrfHeader = request.headers.get('X-CSRF-Token');
    
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return new NextResponse(JSON.stringify({ error: 'CSRF token validation failed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Pass request headers downstream
  response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set CSP on the response
  response.headers.set('Content-Security-Policy', cspHeader);

  // For all GET requests, ensure a CSRF cookie exists for the client to read
  if (request.method === 'GET' && !request.cookies.has('csrf_token')) {
    const token = crypto.randomUUID();
    response.cookies.set('csrf_token', token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: false, // Must be readable by client JS for double submit
    });
  }

  return response;
}

export default withAuth(
  function middleware(request) {
    return customMiddleware(request);
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (req.nextUrl.pathname.startsWith('/organiser')) {
          return !!token;
        }
        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET || "f9h2nf93hf923hf9823hf98h23f89h23f98h",
  }
);

export const config = {
  matcher: [
    // Apply middleware to all routes except static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
