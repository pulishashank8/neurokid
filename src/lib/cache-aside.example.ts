// @ts-nocheck
/**
 * Cache-Aside Pattern Usage Examples
 * 
 * This file demonstrates how to use the CacheAsideService in your services.
 * These are examples only - do not import this file in production code.
 */

import { CacheAsideService } from "@/lib/cache-aside";

// ============================================================================
// Example 1: Basic Usage
// ============================================================================

async function getUserExample(userId: string) {
  // Simple cache-aside pattern
  const user = await CacheAsideService.get(
    "user",
    userId,
    () => prisma.user.findUnique({ where: { id: userId } })
  );
  
  return user;
}

// ============================================================================
// Example 2: Complex Key
// ============================================================================

async function getUserFeedExample(userId: string, page: number, limit: number) {
  // Use object for complex keys
  const posts = await CacheAsideService.get(
    "posts",
    { userId, page, limit }, // Automatically serialized consistently
    () => prisma.post.findMany({
      where: { authorId: userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    { ttl: 30 } // Custom TTL for this call
  );
  
  return posts;
}

// ============================================================================
// Example 3: Cache Invalidation on Mutation
// ============================================================================

async function updateUserExample(userId: string, data: { name: string }) {
  // Update in database
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
  });
  
  // Invalidate cache so next read gets fresh data
  await CacheAsideService.invalidate("user", userId);
  
  // Also invalidate related caches
  await CacheAsideService.invalidatePattern("posts", "*");
  
  return updated;
}

// ============================================================================
// Example 4: Batch Operations with Cache Warming
// ============================================================================

async function warmUserCachesExample(userIds: string[]) {
  // Pre-fetch and cache multiple users
  await Promise.all(
    userIds.map(async (userId) => {
      await CacheAsideService.warm(
        "user",
        userId,
        () => prisma.user.findUnique({ where: { id: userId } })
      );
    })
  );
}

// ============================================================================
// Example 5: Service Integration Pattern
// ============================================================================

class PostServiceExample {
  private readonly CACHE_TTL = 45;
  
  async getPost(id: string) {
    return CacheAsideService.get(
      "post",
      id,
      () => prisma.post.findUnique({
        where: { id },
        include: { author: true, comments: true },
      }),
      { ttl: this.CACHE_TTL }
    );
  }
  
  async getFeed(page: number = 1, limit: number = 20) {
    return CacheAsideService.get(
      "posts",
      { type: "feed", page, limit },
      () => prisma.post.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { author: true },
      }),
      { ttl: this.CACHE_TTL }
    );
  }
  
  async createPost(data: { title: string; content: string; authorId: string }) {
    const post = await prisma.post.create({ data });
    
    // Invalidate feed caches since new post was added
    await CacheAsideService.invalidatePattern("posts", '{"type":"feed",*');
    
    return post;
  }
  
  async updatePost(id: string, data: { title?: string; content?: string }) {
    const post = await prisma.post.update({
      where: { id },
      data,
    });
    
    // Invalidate specific post cache
    await CacheAsideService.invalidate("post", id);
    
    // Invalidate feed caches
    await CacheAsideService.invalidatePattern("posts", '{"type":"feed",*');
    
    return post;
  }
  
  async deletePost(id: string) {
    await prisma.post.delete({ where: { id } });
    
    // Invalidate all related caches
    await CacheAsideService.invalidate("post", id);
    await CacheAsideService.invalidatePattern("posts", "*");
  }
}

// ============================================================================
// Example 6: Raw Cache Access (for special cases)
// ============================================================================

async function rawCacheExample(userId: string) {
  // Check cache without triggering fetch
  const cached = await CacheAsideService.getRaw("user", userId);
  
  if (cached) {
    console.log("Cache hit!");
    return cached;
  }
  
  console.log("Cache miss - would fetch from database");
  return null;
}

// ============================================================================
// Example 7: Direct Cache Write (for warming)
// ============================================================================

async function directWriteExample(userId: string, userData: unknown) {
  // Write directly to cache without database fetch
  await CacheAsideService.set("user", userId, userData);
}

// ============================================================================
// Mock prisma for examples (don't use in real code)
// ============================================================================
const prisma = {
  user: {
    findUnique: async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      name: "Example User",
    }),
    update: async ({ where, data }: { where: { id: string }; data: unknown }) => ({
      id: where.id,
      ...data,
    }),
  },
  post: {
    findUnique: async () => ({ id: "1", title: "Example" }),
    findMany: async () => [{ id: "1", title: "Example" }],
    create: async ({ data }: { data: unknown }) => ({ id: "new", ...data }),
    update: async ({ data }: { data: unknown }) => ({ id: "updated", ...data }),
    delete: async () => {},
  },
};
