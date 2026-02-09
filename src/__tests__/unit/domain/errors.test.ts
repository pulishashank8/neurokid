import { describe, it, expect } from 'vitest';
import {
  DomainError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  AuthenticationError,
  InternalError,
  ServiceUnavailableError,
  BusinessRuleError,
  isDomainError,
} from '@/domain/errors';

describe('Domain Errors', () => {
  describe('DomainError (base class)', () => {
    it('should create error with correct properties', () => {
      class TestError extends DomainError {
        readonly code = 'TEST_ERROR';
        readonly statusCode = 418;
      }

      const error = new TestError('Test message');
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(418);
      expect(error.name).toBe('TestError');
    });

    it('should serialize to JSON correctly', () => {
      class TestError extends DomainError {
        readonly code = 'TEST_ERROR';
        readonly statusCode = 400;
      }

      const error = new TestError('Test message');
      const json = error.toJSON();

      expect(json).toEqual({
        error: 'TEST_ERROR',
        message: 'Test message',
        statusCode: 400,
      });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with default message', () => {
      const error = new ValidationError('Invalid input');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.fieldErrors).toEqual({});
    });

    it('should include field errors when provided', () => {
      const fieldErrors = {
        email: 'Invalid email format',
        password: 'Password too short',
      };
      const error = new ValidationError('Validation failed', fieldErrors);

      expect(error.fieldErrors).toEqual(fieldErrors);
      expect(error.toJSON()).toEqual({
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        statusCode: 400,
        fieldErrors,
      });
    });

    it('should be instance of DomainError', () => {
      const error = new ValidationError('Test');
      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create with default message', () => {
      const error = new UnauthorizedError();

      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication required');
    });

    it('should create with custom message', () => {
      const error = new UnauthorizedError('Custom auth message');
      expect(error.message).toBe('Custom auth message');
    });
  });

  describe('ForbiddenError', () => {
    it('should create with default message', () => {
      const error = new ForbiddenError();

      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
    });

    it('should create with custom message', () => {
      const error = new ForbiddenError('Custom forbidden message');
      expect(error.message).toBe('Custom forbidden message');
    });
  });

  describe('NotFoundError', () => {
    it('should create with resource type only', () => {
      const error = new NotFoundError('User');

      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should create with resource type and ID', () => {
      const error = new NotFoundError('User', '123');
      expect(error.message).toBe('User with id 123 not found');
    });
  });

  describe('ConflictError', () => {
    it('should create with default message', () => {
      const error = new ConflictError();

      expect(error.code).toBe('CONFLICT');
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource conflict');
    });

    it('should create with custom message', () => {
      const error = new ConflictError('Email already exists');
      expect(error.message).toBe('Email already exists');
    });
  });

  describe('RateLimitError', () => {
    it('should create with default values', () => {
      const error = new RateLimitError();

      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.retryAfterSeconds).toBe(60);
    });

    it('should create with custom retry after', () => {
      const error = new RateLimitError('Too many requests', 300);
      expect(error.retryAfterSeconds).toBe(300);
      expect(error.toJSON()).toEqual({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        statusCode: 429,
        retryAfter: 300,
      });
    });
  });

  describe('AuthenticationError', () => {
    it('should create with default values', () => {
      const error = new AuthenticationError();

      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication failed');
    });

    it('should create with specific auth code', () => {
      const error = new AuthenticationError('Login failed', 'TooManyAttempts');
      expect(error.authCode).toBe('TooManyAttempts');
      expect(error.toJSON()).toEqual({
        error: 'AUTHENTICATION_ERROR',
        message: 'Login failed',
        statusCode: 401,
        authCode: 'TooManyAttempts',
      });
    });

    it('should support all auth codes', () => {
      const codes = [
        'TooManyAttempts',
        'EmailNotVerified',
        'InvalidCredentials',
        'AccountLocked',
        'SessionExpired',
      ] as const;

      codes.forEach((code) => {
        const error = new AuthenticationError('Test', code);
        expect(error.authCode).toBe(code);
      });
    });
  });

  describe('InternalError', () => {
    it('should create with default message', () => {
      const error = new InternalError();

      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('An unexpected error occurred');
      expect(error.originalError).toBeUndefined();
    });

    it('should preserve original error', () => {
      const original = new Error('Database connection failed');
      const error = new InternalError('Something went wrong', original);

      expect(error.originalError).toBe(original);
      expect(error.message).toBe('Something went wrong');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create with default message', () => {
      const error = new ServiceUnavailableError();

      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Service temporarily unavailable');
      expect(error.retryAfterSeconds).toBeUndefined();
    });

    it('should create with retry after', () => {
      const error = new ServiceUnavailableError('Maintenance mode', 3600);
      expect(error.retryAfterSeconds).toBe(3600);
    });
  });

  describe('BusinessRuleError', () => {
    it('should create with message and rule', () => {
      const error = new BusinessRuleError(
        'Cannot delete post with comments',
        'POST_HAS_COMMENTS'
      );

      expect(error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Cannot delete post with comments');
      expect(error.rule).toBe('POST_HAS_COMMENTS');
      expect(error.toJSON()).toEqual({
        error: 'BUSINESS_RULE_VIOLATION',
        message: 'Cannot delete post with comments',
        statusCode: 422,
        rule: 'POST_HAS_COMMENTS',
      });
    });
  });

  describe('isDomainError type guard', () => {
    it('should return true for domain errors', () => {
      expect(isDomainError(new ValidationError('Test'))).toBe(true);
      expect(isDomainError(new NotFoundError('User'))).toBe(true);
      expect(isDomainError(new ForbiddenError())).toBe(true);
    });

    it('should return false for regular errors', () => {
      expect(isDomainError(new Error('Regular error'))).toBe(false);
      expect(isDomainError(new TypeError('Type error'))).toBe(false);
      expect(isDomainError(null)).toBe(false);
      expect(isDomainError(undefined)).toBe(false);
      expect(isDomainError('string')).toBe(false);
      expect(isDomainError(123)).toBe(false);
      expect(isDomainError({})).toBe(false);
    });
  });
});
