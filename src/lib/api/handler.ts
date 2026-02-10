/**
 * Consolidated API Handler
 * 
 * Unified handler that combines:
 * - Request ID generation and tracing
 * - Authentication and authorization
 * - Rate limiting
 * - Structured error handling
 * - Performance logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { createLogger } from '@/lib/logger';
import { RateLimiter, RateLimits, getClientIp, enforceRateLimit, isAdminBypassAllowed } from '@/lib/rate-limit';
import {
  DomainError,
  UnauthorizedError,
  ValidationError,
  RateLimitError,
} from '@/domain/errors';
import { registerDependencies } from '@/lib/container-registrations';
import { RequestContext, RequestContextData } from '@/lib/request-context';

// Ensure dependencies are registered
registerDependencies();

export interface ApiHandlerOptions {
  method: string;
  routeName: string;
  requireAuth?: boolean;
  roles?: string[];
  rateLimit?: keyof typeof RateLimits;
}

export interface AuthenticatedRequest extends NextRequest {
  session: {
    user: {
      id: string;
      email: string;
      username?: string;
      roles: string[];
    };
  };
}

// Re-export rate limiters for convenience
export { RateLimits } from '@/lib/rate-limit';

export function getRequestId(request: NextRequest): string {
  return (
    request.headers.get('x-request-id') ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  );
}

export function withApiHandler<T = unknown>(
  handler: (request: AuthenticatedRequest, context: T) => Promise<NextResponse>,
  options: ApiHandlerOptions
) {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = getRequestId(request);
    const logger = createLogger({ requestId, route: options.routeName });

    try {
      // Log incoming request
      logger.info(
        {
          method: options.method,
          url: request.url,
          ip: getClientIp(request),
          query: Object.fromEntries(request.nextUrl.searchParams),
        },
        `API ${options.routeName} started`
      );

      // Rate limiting (if configured)
      if (options.rateLimit) {
        const { RateLimits } = await import('@/lib/rate-limit');
        const limiter = RateLimits[options.rateLimit];
        const identifier = getClientIp(request);

        // Check for admin bypass (only for authenticated requests with admin roles)
        let shouldSkipRateLimit = false;
        if (options.requireAuth) {
          const session = await getServerSession(authOptions);
          if (session?.user) {
            const userRoles = (session.user as { roles?: string[] }).roles || [];
            shouldSkipRateLimit = isAdminBypassAllowed(session.user.id, userRoles);
          }
        }

        if (!shouldSkipRateLimit) {
          const rateLimitResponse = await enforceRateLimit(limiter, identifier);
          if (rateLimitResponse) {
            logger.warn({ identifier }, 'Rate limit exceeded');
            return rateLimitResponse;
          }
        } else {
          logger.debug({ identifier }, 'Rate limit bypassed for admin');
        }
      }

      // Check auth if required
      if (options.requireAuth) {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          throw new UnauthorizedError('Authentication required');
        }

        // Check roles if specified
        if (options.roles && options.roles.length > 0) {
          const userRoles = (session.user as { roles?: string[] }).roles || [];
          const hasRole = options.roles.some((role) =>
            userRoles.includes(role)
          );
          if (!hasRole) {
            throw new UnauthorizedError(
              `Required role: ${options.roles.join(' or ')}`
            );
          }
        }

        // Attach session to request
        (request as AuthenticatedRequest).session = {
          user: {
            id: session.user.id,
            email: session.user.email || '',
            username: (session.user as { username?: string }).username,
            roles: (session.user as { roles?: string[] }).roles || [],
          },
        };
      }

      // Build request context data
      const contextData: RequestContextData = {
        requestId,
        startTime,
        ip: getClientIp(request),
        userId: (request as AuthenticatedRequest).session?.user?.id,
        userEmail: (request as AuthenticatedRequest).session?.user?.email,
        userRoles: (request as AuthenticatedRequest).session?.user?.roles,
      };

      // Execute handler within request context
      const response = await RequestContext.run(contextData, async () => {
        return handler(request as AuthenticatedRequest, context);
      });

      // Log successful completion
      const duration = Date.now() - startTime;
      logger.info(
        {
          statusCode: response.status,
          durationMs: duration,
        },
        `API ${options.routeName} completed`
      );

      // Add request ID header
      response.headers.set('x-request-id', requestId);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof DomainError) {
        logger.warn(
          {
            errorCode: error.code,
            message: error.message,
            durationMs: duration,
          },
          `API ${options.routeName} domain error`
        );

        const responseBody: Record<string, unknown> = {
          error: error.code,
          message: error.message,
          requestId,
        };

        if (error instanceof ValidationError) {
          responseBody.fieldErrors = error.fieldErrors;
        }

        if (error instanceof RateLimitError) {
          responseBody.retryAfter = error.retryAfterSeconds;
        }

        return NextResponse.json(responseBody, {
          status: error.statusCode,
          headers: { 'x-request-id': requestId },
        });
      }

      // Unknown error
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          durationMs: duration,
        },
        `API ${options.routeName} unhandled error`
      );

      // Don't expose internal errors in production
      const isDev = process.env.NODE_ENV === 'development';

      return NextResponse.json(
        {
          error: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          requestId,
          ...(isDev && error instanceof Error
            ? { debug: error.message }
            : {}),
        },
        {
          status: 500,
          headers: { 'x-request-id': requestId },
        }
      );
    }
  };
}

// Helper to parse JSON body safely
export async function parseBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError('Invalid JSON body');
  }
}

// Helper to get query params with defaults
export function getQueryParams(request: NextRequest): URLSearchParams {
  return request.nextUrl.searchParams;
}

// Helper to parse pagination params
export function getPaginationParams(request: NextRequest): {
  limit: number;
  offset: number;
  cursor?: string;
} {
  const params = request.nextUrl.searchParams;
  const limit = Math.min(
    Math.max(parseInt(params.get('limit') || '20'), 1),
    100
  );
  const offset = Math.max(parseInt(params.get('offset') || '0'), 0);
  const cursor = params.get('cursor') || undefined;

  return { limit, offset, cursor };
}
