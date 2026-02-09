import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  CommonSchemas,
  SchemaBuilders,
  ValidationService,
  normalizeLimit,
  QUERY_LIMITS,
} from '@/lib/validation';
import { ValidationError } from '@/domain/errors';

describe('Validation Utilities', () => {
  describe('QUERY_LIMITS', () => {
    it('should have correct limit constants', () => {
      expect(QUERY_LIMITS.MAX_LIMIT).toBe(100);
      expect(QUERY_LIMITS.DEFAULT_LIMIT).toBe(20);
      expect(QUERY_LIMITS.MIN_LIMIT).toBe(1);
      expect(QUERY_LIMITS.MAX_MESSAGES).toBe(50);
      expect(QUERY_LIMITS.MAX_BULK_ITEMS).toBe(1000);
    });
  });

  describe('normalizeLimit', () => {
    it('should return default for undefined/null', () => {
      expect(normalizeLimit(undefined)).toBe(20);
      expect(normalizeLimit(null)).toBe(20);
    });

    it('should return default for values below MIN_LIMIT', () => {
      expect(normalizeLimit(0)).toBe(20);
      expect(normalizeLimit(-1)).toBe(20);
    });

    it('should return value for valid limits', () => {
      expect(normalizeLimit(1)).toBe(1);
      expect(normalizeLimit(20)).toBe(20);
      expect(normalizeLimit(50)).toBe(50);
      expect(normalizeLimit(100)).toBe(100);
    });

    it('should cap at MAX_LIMIT', () => {
      expect(normalizeLimit(101)).toBe(100);
      expect(normalizeLimit(1000)).toBe(100);
    });
  });

  describe('CommonSchemas', () => {
    describe('uuid', () => {
      it('should validate valid UUID', () => {
        expect(CommonSchemas.uuid.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
      });

      it('should reject invalid UUID', () => {
        expect(CommonSchemas.uuid.safeParse('not-a-uuid').success).toBe(false);
        expect(CommonSchemas.uuid.safeParse('').success).toBe(false);
      });
    });

    describe('email', () => {
      it('should validate valid emails', () => {
        expect(CommonSchemas.email.safeParse('test@example.com').success).toBe(true);
        expect(CommonSchemas.email.safeParse('user.name@domain.co.uk').success).toBe(true);
      });

      it('should reject invalid emails', () => {
        expect(CommonSchemas.email.safeParse('not-an-email').success).toBe(false);
        expect(CommonSchemas.email.safeParse('@example.com').success).toBe(false);
        expect(CommonSchemas.email.safeParse('test@').success).toBe(false);
      });
    });

    describe('username', () => {
      it('should validate valid usernames', () => {
        expect(CommonSchemas.username.safeParse('john_doe').success).toBe(true);
        expect(CommonSchemas.username.safeParse('user-123').success).toBe(true);
        expect(CommonSchemas.username.safeParse('abc').success).toBe(true);
      });

      it('should reject invalid usernames', () => {
        expect(CommonSchemas.username.safeParse('ab').success).toBe(false);
        expect(CommonSchemas.username.safeParse('a'.repeat(31)).success).toBe(false);
        expect(CommonSchemas.username.safeParse('user@name').success).toBe(false);
        expect(CommonSchemas.username.safeParse('user name').success).toBe(false);
      });
    });

    describe('password', () => {
      it('should validate valid passwords', () => {
        expect(CommonSchemas.password.safeParse('Password1').success).toBe(true);
        expect(CommonSchemas.password.safeParse('Secure123').success).toBe(true);
      });

      it('should reject weak passwords', () => {
        expect(CommonSchemas.password.safeParse('short1').success).toBe(false);
        expect(CommonSchemas.password.safeParse('password').success).toBe(false);
        expect(CommonSchemas.password.safeParse('PASSWORD').success).toBe(false);
        expect(CommonSchemas.password.safeParse('Password').success).toBe(false);
      });
    });

    describe('limit', () => {
      it('should default to 20', () => {
        expect(CommonSchemas.limit.parse(undefined)).toBe(20);
      });

      it('should respect valid limits', () => {
        expect(CommonSchemas.limit.parse(50)).toBe(50);
      });

      it('should reject limits outside range', () => {
        expect(CommonSchemas.limit.safeParse(0).success).toBe(false);
        expect(CommonSchemas.limit.safeParse(101).success).toBe(false);
      });
    });

    describe('phone', () => {
      it('should validate E.164 format', () => {
        expect(CommonSchemas.phone.safeParse('+1234567890').success).toBe(true);
        expect(CommonSchemas.phone.safeParse('+441234567890').success).toBe(true);
      });

      it('should reject invalid formats', () => {
        expect(CommonSchemas.phone.safeParse('1234567890').success).toBe(false);
        expect(CommonSchemas.phone.safeParse('+').success).toBe(false);
      });
    });

    describe('zipCode', () => {
      it('should validate 5-digit ZIP', () => {
        expect(CommonSchemas.zipCode.safeParse('12345').success).toBe(true);
      });

      it('should validate ZIP+4', () => {
        expect(CommonSchemas.zipCode.safeParse('12345-6789').success).toBe(true);
      });

      it('should reject invalid ZIPs', () => {
        expect(CommonSchemas.zipCode.safeParse('1234').success).toBe(false);
        expect(CommonSchemas.zipCode.safeParse('abcde').success).toBe(false);
      });
    });

    describe('hexColor', () => {
      it('should validate hex colors', () => {
        expect(CommonSchemas.hexColor.safeParse('#FF0000').success).toBe(true);
        expect(CommonSchemas.hexColor.safeParse('#ff0000').success).toBe(true);
      });

      it('should reject invalid colors', () => {
        expect(CommonSchemas.hexColor.safeParse('FF0000').success).toBe(false);
        expect(CommonSchemas.hexColor.safeParse('#FF00').success).toBe(false);
      });
    });
  });

  describe('SchemaBuilders', () => {
    describe('paginatedQuery', () => {
      it('should create valid pagination schema', () => {
        const schema = SchemaBuilders.paginatedQuery();
        const result = schema.parse({ page: 2, limit: 50 });
        expect(result.page).toBe(2);
        expect(result.limit).toBe(50);
      });

      it('should use defaults', () => {
        const schema = SchemaBuilders.paginatedQuery();
        const result = schema.parse({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.sortDirection).toBe('desc');
      });
    });

    describe('searchQuery', () => {
      it('should create valid search schema', () => {
        const schema = SchemaBuilders.searchQuery();
        const result = schema.parse({ q: 'search term', page: 1, limit: 20 });
        expect(result.q).toBe('search term');
      });
    });
  });

  describe('ValidationService', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });

    describe('validate', () => {
      it('should return success for valid data', () => {
        const result = ValidationService.validate(testSchema, { name: 'John', age: 30 });
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ name: 'John', age: 30 });
      });

      it('should return errors for invalid data', () => {
        const result = ValidationService.validate(testSchema, { name: '', age: -1 });
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    describe('validateOrThrow', () => {
      it('should return data for valid input', () => {
        const result = ValidationService.validateOrThrow(testSchema, { name: 'John', age: 30 });
        expect(result).toEqual({ name: 'John', age: 30 });
      });

      it('should throw ValidationError for invalid input', () => {
        expect(() => {
          ValidationService.validateOrThrow(testSchema, { name: '', age: -1 });
        }).toThrow(ValidationError);
      });
    });

    describe('safeParse', () => {
      it('should return data for valid input', () => {
        const result = ValidationService.safeParse(testSchema, { name: 'John', age: 30 });
        expect(result).toEqual({ name: 'John', age: 30 });
      });

      it('should return null for invalid input', () => {
        const result = ValidationService.safeParse(testSchema, { name: '' });
        expect(result).toBeNull();
      });
    });

    describe('isValid', () => {
      it('should return true for valid input', () => {
        expect(ValidationService.isValid(testSchema, { name: 'John', age: 30 })).toBe(true);
      });

      it('should return false for invalid input', () => {
        expect(ValidationService.isValid(testSchema, { name: '' })).toBe(false);
      });
    });
  });
});
