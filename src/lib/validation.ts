/**
 * Shared ValidationService
 * 
 * Centralized validation logic using Zod schemas.
 * Provides consistent validation across all services and API routes.
 */

import { z, ZodSchema, ZodError, ZodTypeAny } from 'zod';
import { ValidationError } from '@/domain/errors';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
  message?: string;
}

export interface ValidationOptions {
  /** Strip unknown fields instead of failing (default: false) */
  stripUnknown?: boolean;
  /** Allow partial validation for updates (default: false) */
  partial?: boolean;
  /** Custom error message prefix */
  messagePrefix?: string;
}

/**
 * Common validation schemas for reuse across the application
 */
export const CommonSchemas = {
  /** UUID v4 format */
  uuid: z.string().uuid(),
  
  /** MongoDB/Prisma ObjectID (24 hex chars) */
  objectId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format'),
  
  /** Generic ID - accepts UUID or ObjectID */
  id: z.string().min(1, 'ID is required'),
  
  /** Non-empty string */
  nonEmptyString: z.string().min(1, 'This field is required'),
  
  /** Email address */
  email: z.string().email('Invalid email address'),
  
  /** URL */
  url: z.string().url('Invalid URL'),
  
  /** Username (3-30 chars, alphanumeric + underscore + hyphen) */
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  /** Safe password (min 8 chars, at least 1 uppercase, 1 lowercase, 1 number) */
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  /** Pagination limit (1-100, default 20) */
  limit: z.number().int().min(1).max(100).default(20),
  
  /** Page number (1+) */
  page: z.number().int().min(1).default(1),
  
  /** Cursor for cursor-based pagination */
  cursor: z.string().optional(),
  
  /** Positive integer */
  positiveInt: z.number().int().positive(),
  
  /** Non-negative integer */
  nonNegativeInt: z.number().int().nonnegative(),
  
  /** JSON object */
  json: z.record(z.unknown()),
  
  /** HTML content (sanitized) */
  html: z.string().max(50000),
  
  /** Phone number (E.164 format) */
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
  
  /** US ZIP code */
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  
  /** Hex color */
  hexColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
};

/**
 * Query limits to prevent runaway queries (Phase 7.2.5)
 */
export const QUERY_LIMITS = {
  MAX_LIMIT: 100,
  DEFAULT_LIMIT: 20,
  MIN_LIMIT: 1,
  /** Max items for message history */
  MAX_MESSAGES: 50,
  /** Max items for bulk operations */
  MAX_BULK_ITEMS: 1000,
} as const;

/**
 * Normalize pagination limit to stay within bounds
 * @param limit - Requested limit
 * @returns Normalized limit between MIN_LIMIT and MAX_LIMIT
 */
export function normalizeLimit(limit?: number | null): number {
  if (!limit || limit < QUERY_LIMITS.MIN_LIMIT) {
    return QUERY_LIMITS.DEFAULT_LIMIT;
  }
  return Math.min(limit, QUERY_LIMITS.MAX_LIMIT);
}

/**
 * Schema builders for common patterns
 */
export const SchemaBuilders = {
  /**
   * Create a paginated query schema
   */
  paginatedQuery: (options?: { maxLimit?: number; defaultLimit?: number }) => {
    const maxLimit = options?.maxLimit ?? 100;
    const defaultLimit = options?.defaultLimit ?? 20;
    return z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(maxLimit).default(defaultLimit),
      cursor: z.string().optional(),
      sort: z.string().optional(),
      sortDirection: z.enum(['asc', 'desc']).default('desc'),
    }).strict();
  },

  /**
   * Create a search query schema
   */
  searchQuery: (options?: { minLength?: number; maxLength?: number }) => {
    const minLength = options?.minLength ?? 1;
    const maxLength = options?.maxLength ?? 200;
    return z.object({
      q: z.string().min(minLength).max(maxLength).optional(),
      ...SchemaBuilders.paginatedQuery().shape,
    }).strict();
  },

  /**
   * Create an update schema (all fields optional)
   */
  update: <T extends z.ZodRawShape>(shape: T) => {
    const partialShape: Record<string, ZodTypeAny> = {};
    for (const [key, schema] of Object.entries(shape)) {
      partialShape[key] = schema instanceof z.ZodType ? schema.optional() : z.any().optional();
    }
    return z.object(partialShape as T).strict();
  },

  /**
   * Create a list of IDs schema
   */
  idList: (options?: { maxItems?: number }) => {
    const maxItems = options?.maxItems ?? 100;
    return z.object({
      ids: z.array(CommonSchemas.id).min(1).max(maxItems),
    }).strict();
  },
};

/**
 * Centralized validation service
 */
export class ValidationService {
  /**
   * Validate data against a Zod schema
   */
  static validate<T>(schema: ZodSchema<T>, data: unknown, options?: ValidationOptions): ValidationResult<T> {
    try {
      let schemaToUse = schema;
      
      // Handle partial validation for updates
      if (options?.partial && schema instanceof z.ZodObject) {
        schemaToUse = schema.partial() as unknown as ZodSchema<T>;
      }
      
      // Handle strip unknown fields
      if (options?.stripUnknown && schemaToUse instanceof z.ZodObject) {
        schemaToUse = schemaToUse.strip() as unknown as ZodSchema<T>;
      }

      const result = schemaToUse.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = this.formatZodErrors(error);
        const message = options?.messagePrefix 
          ? `${options.messagePrefix}: ${Object.values(errors)[0]}`
          : Object.values(errors)[0];
        
        return {
          success: false,
          errors,
          message,
        };
      }
      
      throw error;
    }
  }

  /**
   * Validate data and throw ValidationError on failure
   */
  static validateOrThrow<T>(schema: ZodSchema<T>, data: unknown, options?: ValidationOptions): T {
    const result = this.validate(schema, data, options);
    
    if (!result.success) {
      throw new ValidationError(
        result.message || 'Validation failed',
        result.errors || {}
      );
    }
    
    return result.data as T;
  }

  /**
   * Async validate (for async refinements)
   */
  static async validateAsync<T>(
    schema: ZodSchema<T>, 
    data: unknown, 
    options?: ValidationOptions
  ): Promise<ValidationResult<T>> {
    try {
      let schemaToUse = schema;
      
      if (options?.partial && schema instanceof z.ZodObject) {
        schemaToUse = schema.partial() as unknown as ZodSchema<T>;
      }
      
      if (options?.stripUnknown && schemaToUse instanceof z.ZodObject) {
        schemaToUse = schemaToUse.strip() as unknown as ZodSchema<T>;
      }

      const result = await schemaToUse.parseAsync(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = this.formatZodErrors(error);
        return {
          success: false,
          errors,
          message: Object.values(errors)[0],
        };
      }
      
      throw error;
    }
  }

  /**
   * Async validate and throw on failure
   */
  static async validateOrThrowAsync<T>(
    schema: ZodSchema<T>, 
    data: unknown, 
    options?: ValidationOptions
  ): Promise<T> {
    const result = await this.validateAsync(schema, data, options);
    
    if (!result.success) {
      throw new ValidationError(
        result.message || 'Validation failed',
        result.errors || {}
      );
    }
    
    return result.data as T;
  }

  /**
   * Safe parse - returns null on failure instead of throwing
   */
  static safeParse<T>(schema: ZodSchema<T>, data: unknown): T | null {
    const result = schema.safeParse(data);
    return result.success ? result.data : null;
  }

  /**
   * Check if data is valid without returning details
   */
  static isValid<T>(schema: ZodSchema<T>, data: unknown): boolean {
    return schema.safeParse(data).success;
  }

  /**
   * Format ZodError into a simple field -> message map
   */
  static formatZodErrors(error: ZodError): Record<string, string> {
    const errors: Record<string, string> = {};
    
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    }
    
    return errors;
  }

  /**
   * Get first error message from ZodError
   */
  static getFirstErrorMessage(error: ZodError): string {
    return error.issues[0]?.message || 'Validation failed';
  }

  /**
   * Merge multiple validation results
   */
  static mergeResults<T>(...results: ValidationResult<T>[]): ValidationResult<T> {
    const allErrors: Record<string, string> = {};
    let hasError = false;
    
    for (const result of results) {
      if (!result.success) {
        hasError = true;
        Object.assign(allErrors, result.errors);
      }
    }
    
    if (hasError) {
      return {
        success: false,
        errors: allErrors,
        message: Object.values(allErrors)[0],
      };
    }
    
    return { success: true };
  }

  /**
   * Validate request query parameters from URL
   */
  static validateQuery<T>(
    schema: ZodSchema<T>,
    searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
    options?: ValidationOptions
  ): ValidationResult<T> {
    // Convert URLSearchParams or object to plain object
    const data: Record<string, unknown> = {};
    
    if (searchParams instanceof URLSearchParams) {
      for (const [key, value] of searchParams.entries()) {
        // Handle array values (e.g., ?tag=a&tag=b)
        if (key in data) {
          const existing = data[key];
          if (Array.isArray(existing)) {
            existing.push(value);
          } else {
            data[key] = [existing, value];
          }
        } else {
          data[key] = value;
        }
      }
    } else {
      Object.assign(data, searchParams);
    }
    
    return this.validate(schema, data, options);
  }

  /**
   * Validate request body (JSON)
   */
  static validateBody<T>(
    schema: ZodSchema<T>,
    body: unknown,
    options?: ValidationOptions
  ): ValidationResult<T> {
    return this.validate(schema, body, { stripUnknown: true, ...options });
  }

  /**
   * Create a validator function for a specific schema
   */
  static createValidator<T>(schema: ZodSchema<T>, options?: ValidationOptions) {
    return (data: unknown) => this.validateOrThrow(schema, data, options);
  }

  /**
   * Create an async validator function for a specific schema
   */
  static createAsyncValidator<T>(schema: ZodSchema<T>, options?: ValidationOptions) {
    return (data: unknown) => this.validateOrThrowAsync(schema, data, options);
  }
}

/**
 * Validation decorators for class-based validation
 */
export function Validate<T>(schema: ZodSchema<T>, options?: ValidationOptions) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      // Validate the first argument
      const result = ValidationService.validate(schema, args[0], options);
      
      if (!result.success) {
        throw new ValidationError(
          result.message || `Validation failed for ${propertyKey}`,
          result.errors
        );
      }

      // Replace the first argument with validated data
      const newArgs = [...args];
      newArgs[0] = result.data;
      
      return originalMethod.apply(this, newArgs);
    };

    return descriptor;
  };
}

/**
 * Validate query parameters decorator
 */
export function ValidateQuery<T>(schema: ZodSchema<T>, options?: ValidationOptions) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (request: Request, ...args: unknown[]) {
      const url = new URL(request.url);
      const result = ValidationService.validateQuery(schema, url.searchParams, options);
      
      if (!result.success) {
        throw new ValidationError(
          result.message || `Query validation failed for ${propertyKey}`,
          result.errors
        );
      }

      return originalMethod.call(this, request, result.data, ...args);
    };

    return descriptor;
  };
}

/**
 * Validate request body decorator
 */
export function ValidateBody<T>(schema: ZodSchema<T>, options?: ValidationOptions) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: Request, ...args: unknown[]) {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        throw new ValidationError('Invalid JSON body');
      }

      const result = ValidationService.validateBody(schema, body, options);
      
      if (!result.success) {
        throw new ValidationError(
          result.message || `Body validation failed for ${propertyKey}`,
          result.errors
        );
      }

      return originalMethod.call(this, request, result.data, ...args);
    };

    return descriptor;
  };
}

// Export singleton instance for convenience
export const validationService = new ValidationService();

// Re-export Zod for convenience
export { z, ZodSchema, ZodError };
