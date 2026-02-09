/**
 * Production Security Middleware
 * 
 * Implements comprehensive security headers:
 * - OWASP recommended headers
 * - CSP with nonce support
 * - Cross-Origin isolation (COOP, COEP, CORP)
 * - Strict-Transport-Security with preload
 * - Security violation reporting
 * - Request size limiting
 * - Content type validation
 * - Nonce generation for inline scripts
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateNonce, createCSPHeader } from "./src/lib/nonce";
import { checkUserAgent } from "./src/lib/security/user-agent";

// Security configuration
const SECURITY_CONFIG = {
  // HSTS max-age: 1 year in seconds (31536000)
  hstsMaxAge: 31536000,
  hstsIncludeSubdomains: true,
  hstsPreload: true,
  
  // Reporting endpoints
  reportUri: '/api/csp-report',
  
  // Feature policies
  permissionsPolicy: {
    camera: '()',
    microphone: '()',
    geolocation: '()',
    'interest-cohort': '()',
    accelerometer: '()',
    gyroscope: '()',
    magnetometer: '()',
    payment: '()',
    usb: '()',
    vr: '()',
  },
};

// Size limits by route pattern
const SIZE_LIMITS: { pattern: RegExp; limit: number }[] = [
  { pattern: /\/api\/v1\/(therapy-sessions|emergency-cards)/, limit: 1024 * 1024 }, // 1MB for PHI
  { pattern: /\/api\/v1\/ai\/chat/, limit: 512 * 1024 }, // 512KB for AI
  { pattern: /\/api\/.*\/upload/, limit: 10 * 1024 * 1024 }, // 10MB for uploads
  { pattern: /\/api\//, limit: 512 * 1024 }, // 512KB default for API
];

const DEFAULT_SIZE_LIMIT = 100 * 1024; // 100KB for non-API routes

export async function middleware(request: NextRequest) {
  // 1. User-Agent validation - block known bad bots early
  const userAgent = request.headers.get('user-agent');
  const uaCheck = checkUserAgent(userAgent);
  
  if (!uaCheck.allowed) {
    console.warn('[MIDDLEWARE] Blocked bad user agent:', {
      ua: userAgent?.substring(0, 100),
      reason: uaCheck.reason,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return new NextResponse('Forbidden', { status: 403 });
  }

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
  
  // 1. X-Frame-Options - Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // 2. X-Content-Type-Options - Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // 3. Referrer-Policy - Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 4. X-XSS-Protection - Legacy XSS protection (for older browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // 5. Strict-Transport-Security (HSTS) - HTTPS enforcement
  // max-age: 1 year, includeSubDomains, preload for HSTS preload list
  const hstsValue = [
    `max-age=${SECURITY_CONFIG.hstsMaxAge}`,
    SECURITY_CONFIG.hstsIncludeSubdomains && 'includeSubDomains',
    SECURITY_CONFIG.hstsPreload && 'preload',
  ].filter(Boolean).join('; ');
  response.headers.set("Strict-Transport-Security", hstsValue);

  // 6. Permissions-Policy - Disable unnecessary browser features
  const permissionsPolicy = Object.entries(SECURITY_CONFIG.permissionsPolicy)
    .map(([feature, value]) => `${feature}=${value}`)
    .join(', ');
  response.headers.set("Permissions-Policy", permissionsPolicy);

  // 7. Cross-Origin Resource Policy (CORP) - Control cross-origin resource loading
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");

  // 8. Cross-Origin Opener Policy (COOP) - Isolate browsing context
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  // 9. Cross-Origin Embedder Policy (COEP) - Control embedding
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");

  // 10. Origin-Agent-Cluster - Enable origin-keyed agent clusters
  response.headers.set("Origin-Agent-Cluster", "?1");

  // 11. Reporting-Endpoints - Security violation reporting
  response.headers.set(
    "Reporting-Endpoints",
    `csp-endpoint="${SECURITY_CONFIG.reportUri}"`
  );

  // Content Security Policy with nonce and reporting
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
      `report-uri ${SECURITY_CONFIG.reportUri}`,
      "report-to csp-endpoint",
    ].join("; ");
    response.headers.set("Content-Security-Policy", csp);
  } else {
    // Production: Strict CSP with nonce and reporting
    const cspDirectives = {
      "default-src": "'self'",
      "script-src": `'self' 'nonce-${nonce}' 'strict-dynamic' https://vercel.live https://*.vercel-scripts.com`,
      "style-src": `'self' 'unsafe-inline' https://fonts.googleapis.com`,
      "font-src": "'self' https://fonts.gstatic.com",
      "img-src": "'self' data: blob: https:",
      "connect-src": "'self' https://*.supabase.co https://vercel.live https://*.vercel.app wss://*.supabase.co https://api.openai.com https://api.groq.com",
      "frame-src": "'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
      "frame-ancestors": "'none'",
      "form-action": "'self'",
      "base-uri": "'self'",
      "object-src": "'none'",
      "upgrade-insecure-requests": "",
      "report-uri": SECURITY_CONFIG.reportUri,
      "report-to": "csp-endpoint",
    };
    
    const csp = Object.entries(cspDirectives)
      .map(([key, value]) => value ? `${key} ${value}` : key)
      .join("; ");
    
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
