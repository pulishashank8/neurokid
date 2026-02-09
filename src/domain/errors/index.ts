/**
 * Base class for all domain errors.
 * All domain-specific errors should extend this class.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DomainError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Validation error with optional field-level errors.
 * Use for input validation failures.
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string> = {}
  ) {
    super(message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      fieldErrors: this.fieldErrors,
    };
  }
}

/**
 * Authentication required error.
 * Use when user is not authenticated.
 */
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message: string = 'Authentication required') {
    super(message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Permission denied error.
 * Use when user lacks required permissions.
 */
export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(message: string = 'Access denied') {
    super(message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Resource not found error.
 * Use when a requested resource doesn't exist.
 */
export class NotFoundError extends DomainError {
  readonly code = 'RESOURCE_NOT_FOUND';
  readonly statusCode = 404;

  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error.
 * Use when an operation conflicts with existing state.
 */
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;

  constructor(message: string = 'Resource conflict') {
    super(message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate limit exceeded error.
 * Use when a user exceeds rate limits.
 */
export class RateLimitError extends DomainError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;

  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfterSeconds: number = 60
  ) {
    super(message);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfterSeconds,
    };
  }
}

/**
 * Authentication error with specific error code.
 * Use for login/authentication failures that need specific handling.
 */
export class AuthenticationError extends DomainError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;

  constructor(
    message: string = 'Authentication failed',
    public readonly authCode: 
      | 'TooManyAttempts' 
      | 'EmailNotVerified' 
      | 'InvalidCredentials' 
      | 'AccountLocked' 
      | 'SessionExpired'
      | string
  ) {
    super(message);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      authCode: this.authCode,
    };
  }
}

/**
 * Internal server error.
 * Use for unexpected errors that shouldn't be exposed to clients.
 */
export class InternalError extends DomainError {
  readonly code = 'INTERNAL_ERROR';
  readonly statusCode = 500;

  constructor(
    message: string = 'An unexpected error occurred',
    public readonly originalError?: Error
  ) {
    super(message);
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}

/**
 * Service unavailable error.
 * Use when a dependent service is unavailable.
 */
export class ServiceUnavailableError extends DomainError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly statusCode = 503;

  constructor(
    message: string = 'Service temporarily unavailable',
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Business rule violation error.
 * Use when a business rule is violated.
 */
export class BusinessRuleError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
  readonly statusCode = 422;

  constructor(
    message: string,
    public readonly rule: string
  ) {
    super(message);
    Object.setPrototypeOf(this, BusinessRuleError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      rule: this.rule,
    };
  }
}

/**
 * Type guard to check if an error is a DomainError
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
