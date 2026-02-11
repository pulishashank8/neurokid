import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  requestId?: string;
  details?: any;
}

/**
 * Create a standardized error response
 * Logs full error server-side but returns safe message to client
 */
export function createErrorResponse(
  error: unknown,
  requestId?: string,
  context?: Record<string, any>
): NextResponse<ApiErrorResponse> {
  // Default error response
  let statusCode = 500;
  let message = 'An unexpected error occurred';
  let errorType = 'InternalServerError';
  let logDetails: any = {};

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    errorType = 'ValidationError';
    message = 'Invalid request data';
    logDetails = {
      validationErrors: error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    };
  }
  // Handle Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    errorType = 'DatabaseError';

    // Handle specific Prisma error codes
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this data already exists';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference to related record';
        break;
      default:
        message = 'Database operation failed';
    }

    logDetails = {
      code: error.code,
      meta: error.meta,
    };
  }
  // Handle Prisma validation errors
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorType = 'ValidationError';
    message = 'Invalid data provided';
  }
  // Handle standard Error objects
  else if (error instanceof Error) {
    errorType = error.name;

    // Check for common HTTP error patterns
    if (error.message.toLowerCase().includes('unauthorized')) {
      statusCode = 401;
      message = 'Unauthorized';
    } else if (error.message.toLowerCase().includes('forbidden')) {
      statusCode = 403;
      message = 'Forbidden';
    } else if (error.message.toLowerCase().includes('not found')) {
      statusCode = 404;
      message = 'Resource not found';
    } else if (error.message.toLowerCase().includes('rate limit')) {
      statusCode = 429;
      message = 'Too many requests';
    } else {
      message = error.message;
    }

    logDetails = {
      message: error.message,
      stack: error.stack,
    };
  }
  // Handle unknown error types
  else {
    logDetails = { raw: String(error) };
  }

  // Log the full error server-side
  const logContext = {
    requestId,
    errorType,
    statusCode,
    ...context,
    ...logDetails,
  };

  if (statusCode >= 500) {
    logger.error(logContext, `API Error: ${message}`);
  } else if (statusCode >= 400) {
    logger.warn(logContext, `API Warning: ${message}`);
  } else {
    logger.info(logContext, `API Info: ${message}`);
  }

  // Return safe error response to client
  const response: ApiErrorResponse = {
    error: errorType,
    message,
    statusCode,
    requestId,
  };

  // Only include details in development
  if (process.env.NODE_ENV !== 'production' && logDetails) {
    response.details = logDetails;
  }

  return NextResponse.json(response, {
    status: statusCode,
    headers: requestId ? { 'x-request-id': requestId } : undefined,
  });
}

/**
 * Custom API Error class for throwing typed errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Helper functions for common error types
 */
export const apiErrors = {
  badRequest: (message: string, details?: any) =>
    new ApiError(400, message, details),

  unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(401, message),

  forbidden: (message: string = 'Forbidden') =>
    new ApiError(403, message),

  notFound: (message: string = 'Resource not found') =>
    new ApiError(404, message),

  conflict: (message: string, details?: any) =>
    new ApiError(409, message, details),

  rateLimit: (message: string = 'Too many requests') =>
    new ApiError(429, message),

  internal: (message: string = 'Internal server error', details?: any) =>
    new ApiError(500, message, details),
};
