import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Security & Auth middleware
 * - Implements OWASP-recommended security headers
 * - Enforces authentication on protected routes
 */

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/owner/dashboard',
  '/api/owner',
  '/api/governance',
  '/dashboard',
  '/settings',
  '/messages',
  '/bookmarks',
];

// Routes that require admin role
const ADMIN_ROUTES = [
  '/owner/dashboard',
  '/api/owner',
  '/api/governance',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Get the session token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // No token = not authenticated
    if (!token) {
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // For page routes, redirect to login
      const loginUrl = isAdminRoute
        ? new URL('/owner/login', request.url)
        : new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check for admin role on admin routes
    if (isAdminRoute && pathname.startsWith('/owner')) {
      const roles = (token.roles as string[]) || [];
      if (!roles.includes('ADMIN') && !roles.includes('OWNER')) {
        // Not an admin, redirect to home
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  const response = NextResponse.next();

  // Prevent clickjacking attacks
  response.headers.set("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // HTTPS enforcement (1 year, include subdomains)
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  
  // Permissions policy - disable unnecessary browser features
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  
  // Content Security Policy - protect against XSS and injection
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co https://vercel.live https://*.vercel.app wss://*.supabase.co",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

// Apply middleware to all routes except static files, images, etc.
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/data (data files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|_next/data|favicon.ico|public).*)",
  ],
};
