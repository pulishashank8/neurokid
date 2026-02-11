import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(
  data: T,
  status = 200,
  meta?: ApiSuccessResponse['meta']
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const errorObj: ApiErrorResponse['error'] = {
    code,
    message,
  };

  if (details !== undefined) {
    errorObj.details = details;
  }

  return NextResponse.json(
    {
      success: false as const,
      error: errorObj,
    },
    { status }
  );
}

export function paginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): NextResponse<ApiSuccessResponse<T[]>> {
  return successResponse(data, 200, {
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  });
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_INPUT: 'INVALID_INPUT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export function validationError(message: string, details?: unknown) {
  return errorResponse(ErrorCodes.VALIDATION_ERROR, message, 400, details);
}

export function notFoundError(resource: string) {
  return errorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`, 404);
}

export function unauthorizedError(message = 'Authentication required') {
  return errorResponse(ErrorCodes.UNAUTHORIZED, message, 401);
}

export function forbiddenError(message = 'Access denied') {
  return errorResponse(ErrorCodes.FORBIDDEN, message, 403);
}

export function rateLimitedError(retryAfterSeconds: number) {
  const response = errorResponse(
    ErrorCodes.RATE_LIMITED,
    'Too many requests. Please try again later.',
    429
  );
  response.headers.set('Retry-After', String(retryAfterSeconds));
  return response;
}

export function internalError(message = 'An unexpected error occurred') {
  return errorResponse(ErrorCodes.INTERNAL_ERROR, message, 500);
}
