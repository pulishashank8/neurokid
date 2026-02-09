/**
 * Shared ApiResponse Builder
 * 
 * Consistent API response format across all endpoints.
 * Provides standardized success and error responses with metadata.
 */

import { NextResponse } from 'next/server';
import { DomainError, ValidationError, RateLimitError } from '@/domain/errors';
import { PaginationMetadata } from '@/lib/pagination';
import { getRequestId } from './handler';

// ============================================================================
// Response Types
// ============================================================================

export interface ApiSuccessResponse<T> {
  /** Response data */
  data: T;
  /** Response metadata */
  meta?: {
    /** Request ID for tracing */
    requestId?: string;
    /** Response timestamp */
    timestamp?: string;
    /** Response time in milliseconds */
    durationMs?: number;
  };
  /** Pagination information */
  pagination?: PaginationMetadata;
  /** Related links (HATEOAS) */
  links?: {
    self?: string;
    next?: string | null;
    prev?: string | null;
    first?: string;
    last?: string;
  };
}

export interface ApiErrorResponse {
  /** Error code */
  error: string;
  /** Human-readable error message */
  message: string;
  /** Request ID for tracing */
  requestId: string;
  /** Field-level validation errors */
  fieldErrors?: Record<string, string>;
  /** Retry after seconds (for rate limits) */
  retryAfter?: number;
  /** Additional error details (dev only) */
  details?: unknown;
  /** Stack trace (dev only) */
  stack?: string;
}

export interface ApiListResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: PaginationMetadata;
}

// ============================================================================
// Success Response Builders
// ============================================================================

export class ApiResponse {
  /**
   * Create a success response
   */
  static success<T>(
    data: T,
    options?: {
      status?: number;
      requestId?: string;
      durationMs?: number;
      headers?: Record<string, string>;
    }
  ): NextResponse<ApiSuccessResponse<T>> {
    const body: ApiSuccessResponse<T> = {
      data,
      meta: {
        requestId: options?.requestId,
        timestamp: new Date().toISOString(),
        durationMs: options?.durationMs,
      },
    };

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...options?.headers,
    };

    if (options?.requestId) {
      headers['x-request-id'] = options.requestId;
    }

    return NextResponse.json(body, {
      status: options?.status ?? 200,
      headers,
    });
  }

  /**
   * Create a created (201) response
   */
  static created<T>(
    data: T,
    options?: {
      requestId?: string;
      durationMs?: number;
      location?: string;
    }
  ): NextResponse<ApiSuccessResponse<T>> {
    const headers: Record<string, string> = {};
    if (options?.location) {
      headers.location = options.location;
    }

    return this.success(data, {
      status: 201,
      requestId: options?.requestId,
      durationMs: options?.durationMs,
      headers,
    });
  }

  /**
   * Create an accepted (202) response for async processing
   */
  static accepted<T>(
    data: T,
    options?: {
      requestId?: string;
      durationMs?: number;
    }
  ): NextResponse<ApiSuccessResponse<T>> {
    return this.success(data, {
      status: 202,
      requestId: options?.requestId,
      durationMs: options?.durationMs,
    });
  }

  /**
   * Create a no content (204) response
   */
  static noContent(options?: { requestId?: string }): NextResponse {
    const headers: Record<string, string> = {};
    if (options?.requestId) {
      headers['x-request-id'] = options.requestId;
    }

    return new NextResponse(null, {
      status: 204,
      headers,
    });
  }

  /**
   * Create a paginated list response
   */
  static list<T>(
    data: T[],
    pagination: PaginationMetadata,
    options?: {
      requestId?: string;
      durationMs?: number;
      baseUrl?: string;
    }
  ): NextResponse<ApiListResponse<T>> {
    const body: ApiListResponse<T> = {
      data,
      meta: {
        requestId: options?.requestId,
        timestamp: new Date().toISOString(),
        durationMs: options?.durationMs,
      },
      pagination,
    };

    // Add HATEOAS links if baseUrl provided
    if (options?.baseUrl) {
      body.links = this.buildPaginationLinks(options.baseUrl, pagination);
    }

    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (options?.requestId) {
      headers['x-request-id'] = options.requestId;
    }

    return NextResponse.json(body, { headers });
  }

  /**
   * Build HATEOAS pagination links
   */
  private static buildPaginationLinks(
    baseUrl: string,
    pagination: PaginationMetadata
  ): ApiListResponse<unknown>['links'] {
    const url = new URL(baseUrl);
    const limit = pagination.limit;

    const links: ApiListResponse<unknown>['links'] = {
      self: baseUrl,
      first: this.buildUrl(url, { limit, offset: 0 }),
    };

    if (pagination.offset !== undefined) {
      // Offset-based pagination
      const offset = pagination.offset;
      
      if (offset > 0) {
        links.prev = this.buildUrl(url, { 
          limit, 
          offset: Math.max(0, offset - limit) 
        });
      }

      if (pagination.hasMore) {
        links.next = this.buildUrl(url, { 
          limit, 
          offset: offset + limit 
        });
      }

      if (pagination.total !== undefined) {
        const lastOffset = Math.max(0, Math.ceil(pagination.total / limit) - 1) * limit;
        links.last = this.buildUrl(url, { limit, offset: lastOffset });
      }
    } else if (pagination.cursor !== undefined || pagination.nextCursor !== undefined) {
      // Cursor-based pagination
      if (pagination.nextCursor) {
        links.next = this.buildUrl(url, { limit, cursor: pagination.nextCursor });
      }
      if (pagination.prevCursor) {
        links.prev = this.buildUrl(url, { limit, cursor: pagination.prevCursor });
      }
    }

    return links;
  }

  /**
   * Build URL with query parameters
   */
  private static buildUrl(
    baseUrl: URL,
    params: Record<string, string | number | undefined>
  ): string {
    const url = new URL(baseUrl.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  // ============================================================================
  // Error Response Builders
  // ============================================================================

  /**
   * Create an error response
   */
  static error(
    error: string,
    message: string,
    status: number,
    options?: {
      requestId?: string;
      fieldErrors?: Record<string, string>;
      retryAfter?: number;
      originalError?: Error;
    }
  ): NextResponse<ApiErrorResponse> {
    const isDev = process.env.NODE_ENV === 'development';

    const body: ApiErrorResponse = {
      error,
      message,
      requestId: options?.requestId ?? 'unknown',
    };

    if (options?.fieldErrors) {
      body.fieldErrors = options.fieldErrors;
    }

    if (options?.retryAfter) {
      body.retryAfter = options.retryAfter;
    }

    // Only include debug info in development
    if (isDev && options?.originalError) {
      body.details = options.originalError.message;
      body.stack = options.originalError.stack;
    }

    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (options?.requestId) {
      headers['x-request-id'] = options.requestId;
    }

    if (options?.retryAfter) {
      headers['retry-after'] = String(options.retryAfter);
    }

    return NextResponse.json(body, { status, headers });
  }

  /**
   * Create a bad request (400) response
   */
  static badRequest(
    message: string,
    options?: {
      requestId?: string;
      fieldErrors?: Record<string, string>;
      error?: string;
    }
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      options?.error ?? 'BAD_REQUEST',
      message,
      400,
      { requestId: options?.requestId, fieldErrors: options?.fieldErrors }
    );
  }

  /**
   * Create an unauthorized (401) response
   */
  static unauthorized(
    message: string = 'Authentication required',
    options?: { requestId?: string }
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      'UNAUTHORIZED',
      message,
      401,
      { requestId: options?.requestId }
    );
  }

  /**
   * Create a forbidden (403) response
   */
  static forbidden(
    message: string = 'Access denied',
    options?: { requestId?: string }
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      'FORBIDDEN',
      message,
      403,
      { requestId: options?.requestId }
    );
  }

  /**
   * Create a not found (404) response
   */
  static notFound(
    resource: string,
    id?: string,
    options?: { requestId?: string }
  ): NextResponse<ApiErrorResponse> {
    const message = id 
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    
    return this.error(
      'RESOURCE_NOT_FOUND',
      message,
      404,
      { requestId: options?.requestId }
    );
  }

  /**
   * Create a conflict (409) response
   */
  static conflict(
    message: string,
    options?: { requestId?: string }
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      'CONFLICT',
      message,
      409,
      { requestId: options?.requestId }
    );
  }

  /**
   * Create a validation error (422) response
   */
  static validationError(
    message: string,
    fieldErrors: Record<string, string>,
    options?: { requestId?: string }
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      'VALIDATION_ERROR',
      message,
      422,
      { requestId: options?.requestId, fieldErrors }
    );
  }

  /**
   * Create a rate limit (429) response
   */
  static rateLimit(
    retryAfter: number,
    options?: { requestId?: string }
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      'RATE_LIMIT_EXCEEDED',
      'Rate limit exceeded. Please try again later.',
      429,
      { requestId: options?.requestId, retryAfter }
    );
  }

  /**
   * Create an internal server error (500) response
   */
  static internalError(
    options?: {
      requestId?: string;
      message?: string;
      originalError?: Error;
    }
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      'INTERNAL_ERROR',
      options?.message ?? 'An unexpected error occurred',
      500,
      {
        requestId: options?.requestId,
        originalError: options?.originalError,
      }
    );
  }

  /**
   * Create a service unavailable (503) response
   */
  static serviceUnavailable(
    message: string = 'Service temporarily unavailable',
    options?: { requestId?: string; retryAfter?: number }
  ): NextResponse<ApiErrorResponse> {
    return this.error(
      'SERVICE_UNAVAILABLE',
      message,
      503,
      { requestId: options?.requestId, retryAfter: options?.retryAfter }
    );
  }

  /**
   * Create error response from a DomainError
   */
  static fromDomainError(
    error: DomainError,
    options?: { requestId?: string }
  ): NextResponse<ApiErrorResponse> {
    const body: ApiErrorResponse = {
      error: error.code,
      message: error.message,
      requestId: options?.requestId ?? 'unknown',
    };

    if (error instanceof ValidationError) {
      body.fieldErrors = error.fieldErrors;
    }

    if (error instanceof RateLimitError) {
      body.retryAfter = error.retryAfterSeconds;
    }

    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (options?.requestId) {
      headers['x-request-id'] = options.requestId;
    }

    if (body.retryAfter) {
      headers['retry-after'] = String(body.retryAfter);
    }

    return NextResponse.json(body, { status: error.statusCode, headers });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a success response (shorthand)
 */
export function ok<T>(
  data: T,
  options?: Parameters<typeof ApiResponse.success>[1]
): NextResponse<ApiSuccessResponse<T>> {
  return ApiResponse.success(data, options);
}

/**
 * Create a created response (shorthand)
 */
export function created<T>(
  data: T,
  options?: Parameters<typeof ApiResponse.created>[1]
): NextResponse<ApiSuccessResponse<T>> {
  return ApiResponse.created(data, options);
}

/**
 * Create a paginated list response (shorthand)
 */
export function paginated<T>(
  data: T[],
  pagination: PaginationMetadata,
  options?: Parameters<typeof ApiResponse.list>[2]
): NextResponse<ApiListResponse<T>> {
  return ApiResponse.list(data, pagination, options);
}

/**
 * Create an error response (shorthand)
 */
export function error(
  errorCode: string,
  message: string,
  status: number,
  options?: Parameters<typeof ApiResponse.error>[3]
): NextResponse<ApiErrorResponse> {
  return ApiResponse.error(errorCode, message, status, options);
}

// ============================================================================
// Middleware Helpers
// ============================================================================

export interface ResponseTimingOptions {
  /** Include X-Response-Time header */
  includeHeader?: boolean;
  /** Log slow responses (ms threshold) */
  slowThresholdMs?: number;
}

/**
 * Wrap a response with timing headers
 */
export function withTiming<T>(
  response: NextResponse<T>,
  startTime: number,
  options?: ResponseTimingOptions
): NextResponse<T> {
  const duration = Date.now() - startTime;

  if (options?.includeHeader !== false) {
    response.headers.set('x-response-time', `${duration}ms`);
  }

  return response;
}
