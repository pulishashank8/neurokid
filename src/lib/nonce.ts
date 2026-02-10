/**
 * Content Security Policy (CSP) Nonce Utilities
 * 
 * Generates cryptographically secure nonces for inline scripts and styles
 * Helps prevent XSS attacks by ensuring only approved inline code executes
 * 
 * Usage:
 *   1. Generate nonce in middleware
 *   2. Add to CSP header
 *   3. Pass to _document.tsx or layout
 *   4. Apply to inline scripts: <script nonce={nonce}>
 */

import { NextRequest, NextResponse } from "next/server";

const NONCE_COOKIE = "__Host-csp-nonce";

/**
 * Generate a cryptographically secure nonce using Web Crypto API (Edge Runtime compatible)
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // CRITICAL: Web Crypto MUST be available for security
    // Do not fall back to Math.random() as it's not cryptographically secure
    throw new Error('Web Crypto API is not available - cannot generate secure nonce');
  }
  return btoa(String.fromCharCode(...array));
}

/**
 * Store nonce in cookie for verification across requests
 */
export function setNonceCookie(response: NextResponse, nonce: string): void {
  response.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    // Short-lived - only needed for initial page load
    maxAge: 60,
  });
}

/**
 * Get nonce from request cookie
 */
export function getNonceFromCookie(request: NextRequest): string | null {
  return request.cookies.get(NONCE_COOKIE)?.value || null;
}

/**
 * Create CSP header with nonce
 * 
 * @param nonce - The generated nonce
 * @param additionalDirectives - Additional CSP directives
 */
export function createCSPHeader(
  nonce: string,
  additionalDirectives: Record<string, string> = {}
): string {
  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": `'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    "style-src": `'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src": "'self' https://fonts.gstatic.com",
    "img-src": "'self' data: blob: https: http:",
    "connect-src": "'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src": "'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
    "frame-ancestors": "'none'",
    "form-action": "'self'",
    "base-uri": "'self'",
    "object-src": "'none'",
    "upgrade-insecure-requests": "",
    ...additionalDirectives,
  };

  return Object.entries(directives)
    .map(([key, value]) => (value ? `${key} ${value}` : key))
    .join("; ");
}

/**
 * Generate CSP nonce and add to response
 * Call this in middleware or API routes
 */
export function addCSPNonce(
  request: NextRequest,
  response: NextResponse
): { response: NextResponse; nonce: string } {
  const nonce = generateNonce();
  
  // Store nonce in cookie for page components to access
  setNonceCookie(response, nonce);
  
  // Update CSP header with nonce
  const csp = createCSPHeader(nonce);
  response.headers.set("Content-Security-Policy", csp);
  
  // Expose nonce to client via header (for scripts to read)
  response.headers.set("X-CSP-Nonce", nonce);
  
  return { response, nonce };
}

/**
 * Validate that a script/style nonce matches the expected value
 * Use this when rendering to ensure nonce hasn't been tampered with
 */
export function validateNonce(
  request: NextRequest,
  providedNonce: string
): boolean {
  const expectedNonce = getNonceFromCookie(request);
  if (!expectedNonce) return false;
  
  try {
    // Simple string comparison (Edge Runtime compatible)
    // In production, consider using a constant-time comparison library
    return providedNonce === expectedNonce;
  } catch {
    return false;
  }
}

/**
 * React component props with nonce
 * Use this type for components that need to pass nonce to scripts/styles
 */
export interface WithNonce {
  nonce: string;
}

/**
 * Get CSP meta tag content (for HTML meta tag)
 * Note: script-src in meta tags doesn't support 'nonce', use HTTP header instead
 */
export function getCSPMetaContent(): string {
  // Simplified policy for meta tag (nonces not supported in meta CSP)
  return [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
  ].join("; ");
}
