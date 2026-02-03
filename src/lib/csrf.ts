/**
 * CSRF Protection Utilities
 * 
 * Implements Double Submit Cookie pattern for CSRF protection.
 * This is required for HIPAA compliance and general security.
 * 
 * For NextAuth.js apps: CSRF is handled automatically for sign-in/sign-out,
 * but we need additional protection for API mutations.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CSRF_COOKIE_NAME = "__Host-csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Set CSRF token cookie and return the token
 * Should be called on page load for authenticated pages
 */
export function setCsrfCookie(response: NextResponse): string {
  const token = generateCsrfToken();
  
  // __Host- prefix ensures cookie is secure and not domain-writable
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript for double-submit
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return token;
}

/**
 * Validate CSRF token from request
 * Checks both cookie and header (double submit pattern)
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Skip CSRF check for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return true;
  }
  
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  if (!cookieToken || !headerToken) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken, "hex"),
      Buffer.from(headerToken, "hex")
    );
  } catch {
    // Buffer length mismatch or other error
    return false;
  }
}

/**
 * Middleware to enforce CSRF protection
 * Returns 403 Forbidden if CSRF token is invalid
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Get CSRF token for client-side use
 * Client should read this from the cookie and send in header
 */
export function getCsrfToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}
