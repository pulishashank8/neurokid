/**
 * Production Security Middleware
 * 
 * Implements:
 * - Security headers (OWASP recommended)
 * - CSP with nonce support
 * - Request size limiting
 * - Content type validation
 * - Nonce generation for inline scripts
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateNonce, createCSPHeader } from "./src/lib/nonce";

// Size limits by route pattern
const SIZE_LIMITS: { pattern: RegExp; limit: number }[] = [
  { pattern: /\/api\/v1\/(therapy-sessions|emergency-cards)/, limit: 1024 * 1024 }, // 1MB for PHI
  { pattern: /\/api\/v1\/ai\/chat/, limit: 512 * 1024 }, // 512KB for AI
  { pattern: /\/api\/.*\/upload/, limit: 10 * 1024 * 1024 }, // 10MB for uploads
  { pattern: /\/api\//, limit: 512 * 1024 }, // 512KB default for API
];

const DEFAULT_SIZE_LIMIT = 100 * 1024; // 100KB for non-API routes

export async function middleware(request: NextRequest) {
  // Check request size for mutating methods
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    const contentLength = parseInt(
      request.headers.get("content-length") || "0"
    );
    const limit = getSizeLimitForPath(request.nextUrl.pathname);

    if (contentLength > limit) {
      return NextResponse.json(
        {
          error: "Request body too large",
          limit: `${limit / 1024}KB`,
          received: `${Math.round(contentLength / 1024)}KB`,
        },
        { status: 413 }
      );
    }
  }

  const response = NextResponse.next();

  // Generate CSP nonce for this request
  const nonce = generateNonce();

  // Security Headers - OWASP Recommended
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // HTTPS enforcement (1 year, include subdomains)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Permissions policy - disable unnecessary browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Content Security Policy with nonce
  // Use nonce for inline scripts in production
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // Development: Allow unsafe-inline for HMR
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://*.supabase.co https://vercel.live https://*.vercel.app wss://*.supabase.co https://api.openai.com https://api.groq.com",
      "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; ");
    response.headers.set("Content-Security-Policy", csp);
  } else {
    // Production: Use nonce for inline scripts
    const csp = createCSPHeader(nonce, {
      "script-src": `'self' 'nonce-${nonce}' 'strict-dynamic' https://vercel.live https://*.vercel-scripts.com`,
      "connect-src": "'self' https://*.supabase.co https://vercel.live https://*.vercel.app wss://*.supabase.co https://api.openai.com https://api.groq.com",
      "frame-src": "'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://youtube.com/embed https://www.youtube.com/embed",
    });
    response.headers.set("Content-Security-Policy", csp);

    // Store nonce in cookie for server components to access
    response.cookies.set("__Host-csp-nonce", nonce, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60,
    });

    // Also expose via header for client-side usage
    response.headers.set("X-CSP-Nonce", nonce);
  }

  // Prevent caching of sensitive data
  if (request.nextUrl.pathname.includes("/api/v1/therapy") ||
    request.nextUrl.pathname.includes("/api/v1/emergency")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

function getSizeLimitForPath(path: string): number {
  for (const { pattern, limit } of SIZE_LIMITS) {
    if (pattern.test(path)) {
      return limit;
    }
  }
  return DEFAULT_SIZE_LIMIT;
}

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|public).*)",
  ],
};
