/**
 * API Utilities Barrel Export
 */

export {
  withApiHandler,
  getRequestId,
  parseBody,
  getQueryParams,
  getPaginationParams,
  RateLimits,
} from './handler';

export type {
  ApiHandlerOptions,
  AuthenticatedRequest,
} from './handler';

// Re-export from rate-limit for convenience
export {
  RateLimiter,
  getClientIp,
  enforceRateLimit,
  rateLimitResponse,
} from '@/lib/rate-limit';

// Response builders
export {
  ApiResponse,
  ok,
  created,
  paginated,
  error,
  withTiming,
} from './response';

export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiListResponse,
  ResponseTimingOptions,
} from './response';
