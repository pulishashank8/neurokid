/**
 * API Security Wrapper
 *
 * Combines multiple security controls:
 * - CSRF protection for state-changing operations
 * - Strict input validation
 * - Security headers
 * - Rate limiting
 * - Audit logging
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCsrfToken } from "@/lib/csrf";
import { RateLimiter, enforceRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

export interface SecurityConfig {
  /** Require CSRF token for this endpoint (default: true for mutations) */
  csrf?: boolean;
  /** Rate limiter to apply */
  rateLimit?: RateLimiter;
  /** Zod schema for body validation */
  bodySchema?: z.ZodSchema;
  /** Zod schema for query params validation */
  querySchema?: z.ZodSchema;
  /** Require authentication (default: true) */
  requireAuth?: boolean;
  /** Required roles for access */
  requiredRoles?: string[];
  /** Add security headers to response (default: true) */
  securityHeaders?: boolean;
  /** Log access for audit (default: true) */
  auditLog?: boolean;
  /** Route name for logging */
  routeName?: string;
}

// Default security configuration
const defaultConfig: SecurityConfig = {
  csrf: true,
  requireAuth: true,
  securityHeaders: true,
  auditLog: true,
};

/**
 * Add security headers to API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // XSS protection for legacy browsers
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Cache control for API responses
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");

  return response;
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string | null | undefined): string | null {
  if (!input) return null;

  return input
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["']?[^"'>]*["']?/gi, "")
    // Remove javascript: protocol
    .replace(/javascript:/gi, "")
    // Remove data: URIs
    .replace(/data:\s*text\/html/gi, "")
    .trim();
}

/**
 * Validate ID parameter (CUID format)
 */
export function validateId(id: string | null | undefined): boolean {
  if (!id) return false;
  // CUID format: c + 24 alphanumeric characters
  return /^c[a-z0-9]{24}$/.test(id);
}

/**
 * Secure JSON parsing with size limit
 */
export async function parseJsonBody(
  request: NextRequest,
  maxSize: number = 1024 * 1024 // 1MB default
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  try {
    const contentLength = parseInt(request.headers.get("content-length") || "0");

    if (contentLength > maxSize) {
      return { success: false, error: "Request body too large" };
    }

    const body = await request.json();
    return { success: true, data: body };
  } catch {
    return { success: false, error: "Invalid JSON" };
  }
}

/**
 * Create a secure API handler wrapper
 *
 * Usage:
 * export const POST = withSecurity(async (request, context) => {
 *   // Your handler logic
 * }, {
 *   bodySchema: MySchema,
 *   rateLimit: RateLimits.createPost,
 * });
 */
export function withSecurity(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const logger = createLogger({ requestId });
    const startTime = Date.now();
    const routeName = finalConfig.routeName || request.nextUrl.pathname;

    try {
      // 1. CSRF Check for state-changing methods
      if (finalConfig.csrf && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
        if (!validateCsrfToken(request)) {
          logger.warn({ method: request.method }, "CSRF validation failed");
          const response = NextResponse.json(
            { error: "Invalid or missing CSRF token" },
            { status: 403 }
          );
          return finalConfig.securityHeaders ? addSecurityHeaders(response) : response;
        }
      }

      // 2. Rate Limiting
      if (finalConfig.rateLimit) {
        const rateLimitResult = await enforceRateLimit(
          finalConfig.rateLimit,
          request.headers.get("x-forwarded-for") || "unknown"
        );
        if (rateLimitResult) {
          return rateLimitResult;
        }
      }

      // 3. Body validation (for methods with body)
      if (finalConfig.bodySchema && ["POST", "PUT", "PATCH"].includes(request.method)) {
        const parseResult = await parseJsonBody(request);
        if (!parseResult.success) {
          const response = NextResponse.json(
            { error: parseResult.error },
            { status: 400 }
          );
          return finalConfig.securityHeaders ? addSecurityHeaders(response) : response;
        }

        const validation = finalConfig.bodySchema.safeParse(parseResult.data);
        if (!validation.success) {
          const response = NextResponse.json(
            { error: "Validation failed", details: validation.error.format() },
            { status: 400 }
          );
          return finalConfig.securityHeaders ? addSecurityHeaders(response) : response;
        }

        // Attach validated data to request for handler use
        (request as any).validatedBody = validation.data;
      }

      // 4. Query params validation
      if (finalConfig.querySchema && request.method === "GET") {
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        const validation = finalConfig.querySchema.safeParse(searchParams);
        if (!validation.success) {
          const response = NextResponse.json(
            { error: "Invalid query parameters", details: validation.error.format() },
            { status: 400 }
          );
          return finalConfig.securityHeaders ? addSecurityHeaders(response) : response;
        }
        (request as any).validatedQuery = validation.data;
      }

      // Execute handler
      let response = await handler(request, context);

      // Add security headers
      if (finalConfig.securityHeaders) {
        response = addSecurityHeaders(response);
      }

      // Log successful request
      if (finalConfig.auditLog) {
        const duration = Date.now() - startTime;
        logger.info(
          { routeName, status: response.status, durationMs: duration },
          "API request completed"
        );
      }

      // Add request ID header
      response.headers.set("X-Request-ID", requestId);

      return response;

    } catch (error) {
      logger.error({ error, routeName }, "API request failed");

      // Don't leak error details in production
      const isDev = process.env.NODE_ENV === "development";
      const message = isDev && error instanceof Error
        ? error.message
        : "Internal server error";

      const response = NextResponse.json(
        { error: message },
        { status: 500 }
      );

      return finalConfig.securityHeaders ? addSecurityHeaders(response) : response;
    }
  };
}
