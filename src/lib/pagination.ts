/**
 * Shared PaginationService
 * 
 * Unified pagination logic for offset-based and cursor-based pagination.
 * Provides consistent pagination across all API endpoints and services.
 */

import { PaginatedResult, CursorPaginatedResult } from '@/domain/types';

export interface OffsetPaginationInput {
  /** Page number (1-based) */
  page?: number;
  /** Number of items per page (default: 20, max: 100) */
  limit?: number;
  /** Offset from start (alternative to page) */
  offset?: number;
}

export interface CursorPaginationInput {
  /** Number of items to fetch (default: 20, max: 100) */
  limit?: number;
  /** Cursor for fetching next page */
  cursor?: string | null;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Sort field (for cursor encoding) */
  sortField?: string;
}

export interface PaginationMetadata {
  total?: number;
  limit: number;
  offset?: number;
  page?: number;
  totalPages?: number;
  hasMore: boolean;
  cursor?: string;
  nextCursor?: string;
  prevCursor?: string;
}

export interface OffsetPaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

export class PaginationService {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;
  private static readonly DEFAULT_PAGE = 1;

  /**
   * Normalize limit value within bounds
   */
  static normalizeLimit(limit: number | undefined | null): number {
    const parsed = typeof limit === 'string' ? parseInt(limit, 10) : (limit ?? this.DEFAULT_LIMIT);
    const normalized = Number.isNaN(parsed) ? this.DEFAULT_LIMIT : parsed;
    return Math.min(Math.max(normalized, 1), this.MAX_LIMIT);
  }

  /**
   * Normalize offset value
   */
  static normalizeOffset(offset: number | undefined | null): number {
    const parsed = typeof offset === 'string' ? parseInt(offset, 10) : (offset ?? 0);
    const normalized = Number.isNaN(parsed) ? 0 : parsed;
    return Math.max(normalized, 0);
  }

  /**
   * Normalize page value
   */
  static normalizePage(page: number | undefined | null): number {
    const parsed = typeof page === 'string' ? parseInt(page, 10) : (page ?? this.DEFAULT_PAGE);
    const normalized = Number.isNaN(parsed) ? this.DEFAULT_PAGE : parsed;
    return Math.max(normalized, 1);
  }

  /**
   * Calculate offset from page and limit
   */
  static pageToOffset(page: number, limit: number): number {
    return (this.normalizePage(page) - 1) * this.normalizeLimit(limit);
  }

  /**
   * Calculate page from offset and limit
   */
  static offsetToPage(offset: number, limit: number): number {
    return Math.floor(this.normalizeOffset(offset) / this.normalizeLimit(limit)) + 1;
  }

  /**
   * Parse pagination parameters from request query
   */
  static parseParams(params: {
    page?: string | null;
    limit?: string | null;
    offset?: string | null;
    cursor?: string | null;
  }): {
    limit: number;
    offset: number;
    page: number;
    cursor?: string;
  } {
    const limit = this.normalizeLimit(params.limit ? parseInt(params.limit, 10) : undefined);
    const page = this.normalizePage(params.page ? parseInt(params.page, 10) : undefined);
    const offset = params.offset !== undefined
      ? this.normalizeOffset(params.offset ? parseInt(params.offset, 10) : undefined)
      : this.pageToOffset(page, limit);
    const cursor = params.cursor || undefined;

    return { limit, offset, page, cursor };
  }

  /**
   * Create offset-based pagination result
   */
  static createOffsetResult<T>(
    data: T[],
    total: number,
    input: OffsetPaginationInput
  ): OffsetPaginationResult<T> {
    const limit = this.normalizeLimit(input.limit);
    const offset = input.offset !== undefined
      ? this.normalizeOffset(input.offset)
      : this.pageToOffset(this.normalizePage(input.page), limit);
    const page = this.offsetToPage(offset, limit);
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + data.length < total;

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        page,
        totalPages,
        hasMore,
      },
    };
  }

  /**
   * Create cursor-based pagination result
   * 
   * @param data - Items for current page (should include 1 extra item to determine hasMore)
   * @param limit - Requested limit
   * @param getCursor - Function to extract cursor value from an item
   */
  static createCursorResult<T>(
    data: T[],
    limit: number,
    getCursor: (item: T) => string
  ): CursorPaginationResult<T> {
    const normalizedLimit = this.normalizeLimit(limit);
    const hasMore = data.length > normalizedLimit;
    const slicedData = hasMore ? data.slice(0, normalizedLimit) : data;
    
    const nextCursor = hasMore && slicedData.length > 0
      ? getCursor(slicedData[slicedData.length - 1])
      : undefined;

    return {
      data: slicedData,
      pagination: {
        limit: normalizedLimit,
        hasMore,
        nextCursor,
      },
    };
  }

  /**
   * Create cursor-based pagination result with previous cursor support
   */
  static createCursorResultBidirectional<T>(
    data: T[],
    limit: number,
    getCursor: (item: T) => string,
    currentCursor?: string,
    sortDirection: 'asc' | 'desc' = 'desc'
  ): CursorPaginationResult<T> {
    const normalizedLimit = this.normalizeLimit(limit);
    const hasMore = data.length > normalizedLimit;
    const slicedData = hasMore ? data.slice(0, normalizedLimit) : data;
    
    // Determine next/previous cursors based on sort direction
    let nextCursor: string | undefined;
    let prevCursor: string | undefined;

    if (slicedData.length > 0) {
      if (sortDirection === 'desc') {
        // For desc order: next = last item, prev = first item
        nextCursor = hasMore ? getCursor(slicedData[slicedData.length - 1]) : undefined;
        prevCursor = currentCursor ? getCursor(slicedData[0]) : undefined;
      } else {
        // For asc order: next = last item, prev = first item
        nextCursor = hasMore ? getCursor(slicedData[slicedData.length - 1]) : undefined;
        prevCursor = currentCursor ? getCursor(slicedData[0]) : undefined;
      }
    }

    return {
      data: slicedData,
      pagination: {
        limit: normalizedLimit,
        hasMore,
        nextCursor,
        prevCursor,
      },
    };
  }

  /**
   * Encode cursor for use in URLs
   */
  static encodeCursor(cursor: string | object): string {
    if (typeof cursor === 'string') {
      return Buffer.from(cursor).toString('base64url');
    }
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  /**
   * Decode cursor from URL parameter
   */
  static decodeCursor<T = string>(cursor: string): T {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    try {
      return JSON.parse(decoded) as T;
    } catch {
      return decoded as unknown as T;
    }
  }

  /**
   * Create Prisma pagination arguments for offset-based pagination
   */
  static toPrismaOffsetArgs(input: OffsetPaginationInput): {
    skip: number;
    take: number;
  } {
    const limit = this.normalizeLimit(input.limit);
    const offset = input.offset !== undefined
      ? this.normalizeOffset(input.offset)
      : this.pageToOffset(this.normalizePage(input.page), limit);

    return {
      skip: offset,
      take: limit,
    };
  }

  /**
   * Create Prisma pagination arguments for cursor-based pagination
   */
  static toPrismaCursorArgs(input: CursorPaginationInput): {
    take: number;
    skip?: number;
    cursor?: { id: string };
  } {
    const limit = this.normalizeLimit(input.limit);
    const args: {
      take: number;
      skip?: number;
      cursor?: { id: string };
    } = {
      take: limit + 1, // Take one extra to determine hasMore
    };

    if (input.cursor) {
      args.cursor = { id: input.cursor };
      args.skip = 1; // Skip the cursor item itself
    }

    return args;
  }

  /**
   * Transform raw data into domain PaginatedResult format
   */
  static toDomainPaginatedResult<T>(
    result: OffsetPaginationResult<T>
  ): PaginatedResult<T> {
    return {
      data: result.data,
      pagination: {
        total: result.pagination.total,
        limit: result.pagination.limit,
        offset: result.pagination.offset,
        hasMore: result.pagination.hasMore,
      },
    };
  }

  /**
   * Transform raw data into domain CursorPaginatedResult format
   */
  static toDomainCursorResult<T>(
    result: CursorPaginationResult<T>
  ): CursorPaginatedResult<T> {
    return {
      data: result.data,
      pagination: {
        limit: result.pagination.limit,
        hasMore: result.pagination.hasMore,
        nextCursor: result.pagination.nextCursor,
      },
    };
  }
}

/**
 * Convenience function to parse pagination from NextRequest
 */
export function getPaginationFromRequest(request: Request | { url: string }): {
  limit: number;
  offset: number;
  page: number;
  cursor?: string;
} {
  const url = new URL(request.url);
  return PaginationService.parseParams({
    page: url.searchParams.get('page'),
    limit: url.searchParams.get('limit'),
    offset: url.searchParams.get('offset'),
    cursor: url.searchParams.get('cursor'),
  });
}

/**
 * Hook-style helper for frontend pagination state
 */
export function createPaginationState(
  initialLimit: number = 20
): {
  limit: number;
  page: number;
  offset: number;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setLimit: (limit: number) => void;
  reset: () => void;
} {
  let limit = PaginationService.normalizeLimit(initialLimit);
  let page = 1;

  return {
    get limit() { return limit; },
    get page() { return page; },
    get offset() { return PaginationService.pageToOffset(page, limit); },
    nextPage: () => { page++; },
    prevPage: () => { page = Math.max(1, page - 1); },
    goToPage: (p: number) => { page = Math.max(1, p); },
    setLimit: (l: number) => { 
      limit = PaginationService.normalizeLimit(l);
      page = 1; // Reset to first page when changing limit
    },
    reset: () => { page = 1; },
  };
}

// Export singleton instance for convenience
export const paginationService = new PaginationService();
