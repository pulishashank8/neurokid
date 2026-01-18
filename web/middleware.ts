import { NextResponse } from "next/server";
import { isProduction } from "./src/lib/env";

/**
 * Security headers middleware
 * Adds HSTS, CSP, X-Frame-Options, X-Content-Type-Options, etc.
 * Applied to all routes except static assets
 */

export function middleware() {
  const response = NextResponse.next();

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

  return response;
}

// Apply middleware to all routes except static files, images, etc.
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
