import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { createErrorResponse } from './apiError';

/**
 * Extract request ID from headers or generate new one
 */
export function getRequestId(request: NextRequest): string {
  return request.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Wrapper for API route handlers that adds:
 * - Request correlation ID
 * - Performance timing
 * - Structured error handling
 * - Automatic logging
 */
export function withApiHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options?: {
    method?: string;
    routeName?: string;
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = getRequestId(request);
    const method = options?.method || request.method;
    const pathname = request.nextUrl.pathname;
    const routeName = options?.routeName || pathname;

    // Create request-specific logger
    const logger = createLogger({ requestId, method, pathname });

    try {
      // Log incoming request
      logger.info({
        routeName,
        query: Object.fromEntries(request.nextUrl.searchParams),
      }, `API ${method} ${routeName} started`);

      // Execute handler
      const response = await handler(request, context);

      // Log successful completion
      const durationMs = Date.now() - startTime;
      logger.info({
        statusCode: response.status,
        durationMs,
      }, `API ${method} ${routeName} completed`);

      // Log API performance for /api routes (fire-and-forget)
      if (pathname.startsWith('/api/')) {
        import('@/lib/owner/api-performance')
          .then((m) => m.logApiPerformance({ method, routePath: pathname, statusCode: response.status, responseTime: durationMs }))
          .catch(() => {});
      }

      // Add request ID to response headers
      response.headers.set('x-request-id', requestId);

      return response;

    } catch (error) {
      // Log and format error
      const durationMs = Date.now() - startTime;

      return createErrorResponse(error, requestId, {
        method,
        pathname,
        routeName,
        durationMs,
      });
    }
  };
}
