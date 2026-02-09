/**
 * CSRF Protection
 * 
 * Cross-Site Request Forgery protection using Double Submit Cookie pattern
 * 
 * Features:
 * - CSRF token generation
 * - Token validation
 * - Secure cookie configuration
 * - Stateless validation
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_CONFIG = {
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  tokenLength: 32,
  cookieMaxAge: 86400, // 24 hours
} as const;

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_CONFIG.tokenLength).toString('hex');
}

/**
 * Set CSRF token cookie
 */
export function setCsrfCookie(response: NextResponse): string {
  const token = generateCsrfToken();
  
  response.cookies.set(CSRF_CONFIG.cookieName, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_CONFIG.cookieMaxAge,
    path: '/',
  });
  
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }
  
  const cookieToken = request.cookies.get(CSRF_CONFIG.cookieName)?.value;
  const headerToken = request.headers.get(CSRF_CONFIG.headerName);
  
  // Both must exist and match
  if (!cookieToken || !headerToken) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

/**
 * CSRF protection middleware
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null;
  }
  
  if (!validateCsrfToken(request)) {
    console.warn('[CSRF] Invalid or missing token:', {
      path: request.nextUrl.pathname,
      method: request.method,
      ip: request.headers.get('x-forwarded-for'),
    });
    
    return new NextResponse(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  return null;
}

/**
 * Get CSRF token for client-side
 */
export function getCsrfToken(request: NextRequest): string | undefined {
  return request.cookies.get(CSRF_CONFIG.cookieName)?.value;
}

export { CSRF_CONFIG };
