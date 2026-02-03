/**
 * Domain-level error types
 * Use these for typed error handling across the application
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, identifier?: string) {
    super(
      `${resource}${identifier ? ` (${identifier})` : ""} not found`,
      "NOT_FOUND",
      404
    );
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Access denied") {
    super(message, "FORBIDDEN", 403);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

export class RateLimitError extends DomainError {
  constructor(retryAfter: number) {
    super("Rate limit exceeded", "RATE_LIMIT", 429);
    this.retryAfter = retryAfter;
  }
  retryAfter: number;
}

export class ServiceUnavailableError extends DomainError {
  constructor(message = "Service temporarily unavailable") {
    super(message, "SERVICE_UNAVAILABLE", 503);
  }
}
