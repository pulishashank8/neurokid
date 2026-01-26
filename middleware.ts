import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security headers middleware
 * Implements OWASP-recommended security headers
 */

export async function middleware(_request: NextRequest) {
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
