/**
 * Keyset Pagination Implementation (Phase 7.2.4)
 *
 * Keyset pagination uses WHERE clauses instead of OFFSET, making deep pagination
 * O(log n) instead of O(n). This is ideal for infinite scroll and large datasets.
 *
 * Benefits:
 * - Consistent performance regardless of page depth
 * - No offset scan (OFFSET 10000 becomes just a cursor lookup)
 * - Prevents issues with page drift (new items inserted while paginating)
 */

import { Prisma } from '@prisma/client';

export interface KeysetCursor {
  id: string;
  createdAt: Date;
  voteScore?: number;
}

/**
 * Encode cursor to base64url string
 */
export function encodeKeysetCursor(cursor: KeysetCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

/**
 * Decode base64url cursor string
 */
export function decodeKeysetCursor(encoded: string): KeysetCursor {
  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    return {
      ...decoded,
      createdAt: new Date(decoded.createdAt),
    };
  } catch {
    throw new Error('Invalid cursor format');
  }
}

/**
 * Build WHERE clause for keyset pagination
 * This creates a WHERE condition that finds records after the cursor
 */
export function buildKeysetWhere(
  cursor: KeysetCursor | null,
  direction: 'forward' | 'backward' = 'forward'
): Prisma.PostWhereInput {
  if (!cursor) return {};

  if (direction === 'forward') {
    if (cursor.voteScore !== undefined) {
      // For hot/top sorting (voteScore DESC, createdAt DESC, id DESC)
      return {
        OR: [
          { voteScore: { lt: cursor.voteScore } },
          {
            voteScore: cursor.voteScore,
            createdAt: { lt: cursor.createdAt },
          },
          {
            voteScore: cursor.voteScore,
            createdAt: cursor.createdAt,
            id: { lt: cursor.id },
          },
        ],
      };
    } else {
      // For new sorting (createdAt DESC, id DESC)
      return {
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          {
            createdAt: cursor.createdAt,
            id: { lt: cursor.id },
          },
        ],
      };
    }
  } else {
    // Backward pagination (previous page)
    if (cursor.voteScore !== undefined) {
      return {
        OR: [
          { voteScore: { gt: cursor.voteScore } },
          {
            voteScore: cursor.voteScore,
            createdAt: { gt: cursor.createdAt },
          },
          {
            voteScore: cursor.voteScore,
            createdAt: cursor.createdAt,
            id: { gt: cursor.id },
          },
        ],
      };
    } else {
      return {
        OR: [
          { createdAt: { gt: cursor.createdAt } },
          {
            createdAt: cursor.createdAt,
            id: { gt: cursor.id },
          },
        ],
      };
    }
  }
}

/**
 * Result type for keyset pagination
 */
export interface KeysetPaginationResult<T> {
  items: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}

/**
 * Execute keyset pagination query
 *
 * @param query - Function that returns items
 * @param limit - Number of items per page
 * @param currentCursor - Current cursor position
 * @returns Paginated result with cursors
 */
export async function paginateWithKeyset<T extends KeysetCursor>(
  query: () => Promise<T[]>,
  limit: number,
  currentCursor?: string
): Promise<KeysetPaginationResult<T>> {
  const items = await query();

  const hasMore = items.length > limit;
  const result = hasMore ? items.slice(0, limit) : items;

  return {
    items: result,
    nextCursor: hasMore && result.length > 0
      ? encodeKeysetCursor(result[result.length - 1])
      : undefined,
    prevCursor: currentCursor && result.length > 0
      ? encodeKeysetCursor(result[0])
      : undefined,
    hasMore,
  };
}

/**
 * Example usage in PostRepository:
 *
 * ```typescript
 * async listWithKeyset(query: ListPostsQuery): Promise<KeysetPaginationResult<Post>> {
 *   const cursor = query.cursor ? decodeKeysetCursor(query.cursor) : null;
 *
 *   const where: Prisma.PostWhereInput = {
 *     status: 'ACTIVE',
 *     ...buildKeysetWhere(cursor, 'forward'),
 *   };
 *
 *   const items = await this.prisma.post.findMany({
 *     where,
 *     orderBy: query.sort === 'hot'
 *       ? [{ voteScore: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]
 *       : [{ createdAt: 'desc' }, { id: 'desc' }],
 *     take: query.limit + 1,
 *   });
 *
 *   return paginateWithKeyset(() => Promise.resolve(items), query.limit, query.cursor);
 * }
 * ```
 */
