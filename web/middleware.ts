import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProduction } from "./src/lib/env";
import { getToken } from "next-auth/jwt";
import { logger } from "./src/lib/logger";

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Security headers and authentication middleware
 * Adds HSTS, CSP, X-Frame-Options, X-Content-Type-Options, etc.
 * Also adds request correlation IDs and timing logs
 * Applied to all routes except static assets
 */

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  
  // Generate or use existing request ID
  const requestId = request.headers.get('x-request-id') || generateRequestId();
  
  // Create request-specific logger
  const requestLogger = logger.child({ requestId });
  
  // Log incoming request
  requestLogger.info({
    method: request.method,
    pathname,
    userAgent: request.headers.get('user-agent'),
  }, 'Incoming request');
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/about',
  ];
  
  // Public API routes (only auth-related)
  const publicApiRoutes = [
    '/api/auth',
    '/api/health',
  ];
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  
  // Check if it's a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Authentication check temporarily disabled for debugging
  // TODO: Re-enable after fixing getToken timeout issue
  /*
  if (!isPublicRoute && !isPublicApiRoute) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    requestLogger.debug({ hasToken: !!token }, 'Auth check');
    
    if (!token) {
      requestLogger.warn('Unauthorized access attempt');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      
      const response = NextResponse.redirect(loginUrl);
      response.headers.set('x-request-id', requestId);
      
      const durationMs = Date.now() - startTime;
      requestLogger.info({
        statusCode: 302,
        durationMs,
      }, 'Request completed (redirect)');
      
      return response;
    }
  }
  */
  
  const response = NextResponse.next();

  // Add request ID to response headers
  response.headers.set('x-request-id', requestId);

  // X-Frame-Options: Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options: Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer-Policy: Control referrer leaking
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions-Policy: Restrict browser APIs
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  // Content Security Policy
  // - Allow Same Origin
  // - Allow Next.js internal scripts
  // - Allow vercel analytics if used
  // - Disallow unsafe-inline except for Next.js data script
  // NOTE: Do NOT set unsafe-inline for scripts; breaks CSP but Next.js has workarounds
  const csp = `
    default-src 'self';
    script-src 'self' 'wasm-unsafe-eval' https://vercel.live;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\n/g, "")
    .replace(/  +/g, " ")
    .trim();

  response.headers.set("Content-Security-Policy", csp);

  // HSTS: Enforce HTTPS (production only)
  if (isProduction()) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Log request completion
  const durationMs = Date.now() - startTime;
  requestLogger.info({
    statusCode: response.status,
    durationMs,
  }, 'Request completed');

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
