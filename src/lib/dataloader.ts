/**
 * DataLoader Implementation
 * 
 * Batches and caches database queries to prevent N+1 problems.
 * While Prisma includes handle most cases, DataLoader is useful for
 * complex scenarios where manual batching is needed.
 * 
 * Usage:
 *   const userLoader = new DataLoader(async (ids: string[]) => {
 *     const users = await prisma.user.findMany({
 *       where: { id: { in: ids } }
 *     });
 *     return ids.map(id => users.find(u => u.id === id));
 *   });
 *   
 *   // In resolver
 *   const user = await userLoader.load(post.authorId);
 */

export type BatchLoadFn<K, V> = (keys: K[]) => Promise<Array<V | undefined>>;

export interface DataLoaderOptions {
  cache?: boolean;
  batchScheduleFn?: (callback: () => void) => void;
}

/**
 * DataLoader class for batching and caching
 */
export class DataLoader<K, V> {
  private batchLoadFn: BatchLoadFn<K, V>;
  private cache: Map<string, V>;
  private pendingKeys: K[] = [];
  private pendingResolves: Array<(value: V | undefined) => void> = [];
  private pendingRejects: Array<(reason: Error) => void> = [];
  private batchScheduled = false;
  private cacheEnabled: boolean;

  constructor(
    batchLoadFn: BatchLoadFn<K, V>,
    options: DataLoaderOptions = {}
  ) {
    this.batchLoadFn = batchLoadFn;
    this.cache = new Map();
    this.cacheEnabled = options.cache !== false;
  }

  /**
   * Load a single key
   */
  load(key: K): Promise<V | undefined> {
    const cacheKey = this.getCacheKey(key);

    // Check cache first
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      return Promise.resolve(this.cache.get(cacheKey));
    }

    // Add to pending batch
    return new Promise((resolve, reject) => {
      this.pendingKeys.push(key);
      this.pendingResolves.push(resolve);
      this.pendingRejects.push(reject);
      this.scheduleBatch();
    });
  }

  /**
   * Load multiple keys
   */
  async loadMany(keys: K[]): Promise<Array<V | undefined>> {
    return Promise.all(keys.map((key) => this.load(key)));
  }

  /**
   * Clear value for a key from cache
   */
  clear(key: K): this {
    if (this.cacheEnabled) {
      this.cache.delete(this.getCacheKey(key));
    }
    return this;
  }

  /**
   * Clear entire cache
   */
  clearAll(): this {
    if (this.cacheEnabled) {
      this.cache.clear();
    }
    return this;
  }

  /**
   * Prime the cache with a key-value pair
   */
  prime(key: K, value: V): this {
    if (this.cacheEnabled) {
      const cacheKey = this.getCacheKey(key);
      if (!this.cache.has(cacheKey)) {
        this.cache.set(cacheKey, value);
      }
    }
    return this;
  }

  /**
   * Schedule batch execution
   */
  private scheduleBatch(): void {
    if (this.batchScheduled) return;
    this.batchScheduled = true;

    // Use setImmediate if available, otherwise setTimeout
    if (typeof setImmediate !== "undefined") {
      setImmediate(() => this.dispatchBatch());
    } else {
      setTimeout(() => this.dispatchBatch(), 0);
    }
  }

  /**
   * Execute the batch
   */
  private async dispatchBatch(): Promise<void> {
    this.batchScheduled = false;

    const keys = this.pendingKeys;
    const resolves = this.pendingResolves;
    const rejects = this.pendingRejects;

    // Reset pending arrays
    this.pendingKeys = [];
    this.pendingResolves = [];
    this.pendingRejects = [];

    try {
      const values = await this.batchLoadFn(keys);

      // Resolve each pending promise
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = values[i];

        // Cache the result
        if (this.cacheEnabled && value !== undefined) {
          this.cache.set(this.getCacheKey(key), value);
        }

        resolves[i](value);
      }
    } catch (error) {
      // Reject all pending promises on batch error
      const err = error instanceof Error ? error : new Error(String(error));
      for (let i = 0; i < keys.length; i++) {
        rejects[i](err);
      }
    }
  }

  /**
   * Convert key to cache key string
   */
  private getCacheKey(key: K): string {
    return JSON.stringify(key);
  }
}

/**
 * Create a DataLoader factory for common entity types
 */
export function createPrismaLoader<T extends { id: string }>(
  findManyFn: (ids: string[]) => Promise<T[]>,
  options?: DataLoaderOptions
): DataLoader<string, T> {
  return new DataLoader(async (ids: string[]) => {
    const items = await findManyFn(ids);
    return ids.map((id) => items.find((item) => item.id === id));
  }, options);
}

// ===========================================
// Pre-configured loaders for common entities
// ===========================================

import { prisma } from "@/lib/prisma";

/**
 * User loader - batch load users by ID
 */
export const userLoader = createPrismaLoader((ids) =>
  prisma.user.findMany({
    where: { id: { in: ids } },
    include: { profile: true },
  })
);

/**
 * Post loader - batch load posts by ID
 */
export const postLoader = createPrismaLoader((ids) =>
  prisma.post.findMany({
    where: { id: { in: ids } },
    include: { author: { include: { profile: true } }, category: true },
  })
);

/**
 * Comment loader - batch load comments by ID
 */
export const commentLoader = createPrismaLoader((ids) =>
  prisma.comment.findMany({
    where: { id: { in: ids } },
    include: { author: { include: { profile: true } } },
  })
);

/**
 * Category loader - batch load categories by ID
 */
export const categoryLoader = createPrismaLoader((ids) =>
  prisma.category.findMany({
    where: { id: { in: ids } },
  })
);
