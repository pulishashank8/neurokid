/**
 * Production API Handler Wrapper
 * 
 * Provides consistent error handling, logging, and rate limiting
 */

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { RateLimiter, enforceRateLimit } from "@/lib/rate-limit";
import {
  DomainError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
} from "@/domain/errors";

interface ApiHandlerOptions {
  routeName: string;
  rateLimit?: keyof typeof import("@/lib/rate-limit").RateLimits;
  requireAuth?: boolean;
}

/**
 * Extract request ID for tracing
 */
export function getRequestId(request: NextRequest): string {
  return (
    request.headers.get("x-request-id") ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  );
}

/**
 * Get client IP for rate limiting
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Wrap API route handlers with production-grade error handling
 */
export function withApiHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: ApiHandlerOptions
) {
  return async (
    request: NextRequest,
    context?: any
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = getRequestId(request);
    const logger = createLogger({ requestId, route: options.routeName });

    try {
      // Log incoming request
      logger.info({
        method: request.method,
        url: request.url,
        ip: getClientIp(request),
      }, `API ${options.routeName} started`);

      // Rate limiting
      if (options.rateLimit) {
        const { RateLimits } = await import("@/lib/rate-limit");
        const limiter = RateLimits[options.rateLimit];
        const identifier = getClientIp(request);
        
        const rateLimitResponse = await enforceRateLimit(limiter, identifier);
        if (rateLimitResponse) {
          logger.warn({ identifier }, "Rate limit exceeded");
          return rateLimitResponse;
        }
      }

      // Execute handler
      const response = await handler(request, context);

      // Log successful completion
      const duration = Date.now() - startTime;
      logger.info(
        {
          statusCode: response.status,
          durationMs: duration,
        },
        `API ${options.routeName} completed`
      );

      // Add request ID to response headers
      response.headers.set("x-request-id", requestId);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Handle domain errors
      if (error instanceof DomainError) {
        logger.warn(
          {
            errorCode: error.code,
            errorMessage: error.message,
            durationMs: duration,
          },
          `API ${options.routeName} domain error`
        );

        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            requestId,
          },
          {
            status: error.statusCode,
            headers: { "x-request-id": requestId },
          }
        );
      }

      // Handle unknown errors
      logger.error(
        {
          error:
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : error,
          durationMs: duration,
        },
        `API ${options.routeName} unhandled error`
      );

      // Don't expose internal errors in production
      const isDev = process.env.NODE_ENV === "development";
      
      return NextResponse.json(
        {
          error: "Internal server error",
          code: "INTERNAL_ERROR",
          requestId,
          ...(isDev && error instanceof Error
            ? { debug: error.message }
            : {}),
        },
        {
          status: 500,
          headers: { "x-request-id": requestId },
        }
      );
    }
  };
}

/**
 * Sanitize error for client response
 */
export function sanitizeError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
} {
  if (error instanceof DomainError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // Log full error internally
    console.error("Internal error:", error);
    
    return {
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
      code: "INTERNAL_ERROR",
      statusCode: 500,
    };
  }

  return {
    message: "Unknown error",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}
