import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(async ({ req }) => {
    // If the cookie is missing, simulate no token
    if (!req.cookies.get('next-auth.session-token')) {
      return null;
    }
    // Return standard token by default
    return { name: 'Test User', role: req.cookies.get('role')?.value || 'fan' };
  }),
}));

describe('Security Middleware', () => {
  it('redirects unauthenticated users to the login page', async () => {
    const req = new NextRequest('http://localhost:3000/organiser');
    
    // Simulate no session token
    req.cookies.delete('next-auth.session-token'); 
    
    const response = await middleware(req);
    
    expect(response.status).toBe(307); // Temporary Redirect
    expect(response.headers.get('Location')).toContain('/api/auth/signin');
  });

  it('redirects standard users from the organiser dashboard to fan dashboard', async () => {
    const req = new NextRequest('http://localhost:3000/organiser');
    
    // Simulate valid session token but fan role
    req.cookies.set('next-auth.session-token', 'valid-token');
    req.cookies.set('role', 'fan');
    
    const response = await middleware(req);
    
    expect(response.status).toBe(307); // Temporary Redirect
    expect(response.headers.get('Location')).toContain('/fan');
  });

  it('allows organiser to access the organiser dashboard', async () => {
    const req = new NextRequest('http://localhost:3000/organiser');
    
    // Simulate valid session token and organiser role
    req.cookies.set('next-auth.session-token', 'valid-token');
    req.cookies.set('role', 'organiser');
    
    const response = await middleware(req);
    
    // Should not redirect, so it returns next() 
    expect(response.status).toBe(200); 
    expect(response.headers.get('Location')).toBeNull();
  });
  
  it('allows authenticated users to access the fan dashboard', async () => {
    const req = new NextRequest('http://localhost:3000/fan');
    
    // Simulate valid session token and fan role
    req.cookies.set('next-auth.session-token', 'valid-token');
    
    const response = await middleware(req);
    
    expect(response.status).toBe(200); 
    expect(response.headers.get('Location')).toBeNull();
  });
});
