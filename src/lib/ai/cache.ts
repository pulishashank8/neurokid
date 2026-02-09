/**
 * AI Response Cache
 * 
 * Caches AI responses to avoid redundant API calls for identical queries.
 * Uses Redis for distributed caching with TTL based on query type.
 * 
 * Cache keys are based on a hash of the normalized messages to ensure
 * semantically identical queries get cache hits.
 */

import { createHash } from 'crypto';
import { redis } from '@/lib/redis';
import { createLogger } from '@/lib/logger';
import { CacheAsideService } from '@/lib/cache-aside';

const logger = createLogger({ context: 'AIResponseCache' });

// Cache TTLs in seconds
const CACHE_TTLS = {
  // General questions - 1 hour
  general: 60 * 60,
  // Crisis/sensitive content - no caching
  crisis: 0,
  // FAQ/common questions - 24 hours
  faq: 24 * 60 * 60,
  // Personalized advice - 5 minutes (may change based on user context)
  personalized: 5 * 60,
};

// Common FAQ patterns that can be cached longer
const FAQ_PATTERNS = [
  /what is autism/i,
  /signs of autism/i,
  /autism diagnosis/i,
  /sensory issues/i,
  /meltdown/i,
  /stimming/i,
  /special education/i,
  /iep process/i,
  /therapies? for autism/i,
  /early intervention/i,
];

// Patterns that indicate personalized content (short cache)
const PERSONALIZED_PATTERNS = [
  /my child/i,
  /my son/i,
  /my daughter/i,
  /he is/i,
  /she is/i,
  /they are/i,
  /we have/i,
  /our family/i,
  /my situation/i,
];

// Crisis keywords - never cache
const CRISIS_KEYWORDS = [
  'suicide', 'self-harm', 'kill', 'hurt', 'harm',
  'crisis', 'emergency', 'urgent', '911',
];

export interface CachedResponse {
  response: string;
  provider: string;
  cachedAt: string;
  expiresAt: string;
  hitCount: number;
}

export interface CacheCheckResult {
  hit: boolean;
  response?: string;
  provider?: string;
  cachedAt?: string;
}

/**
 * Determine cache TTL based on message content
 */
function determineTTL(messages: Array<{ role: string; content: string }>): number {
  const content = messages.map(m => m.content).join(' ').toLowerCase();

  // Never cache crisis content
  if (CRISIS_KEYWORDS.some(kw => content.includes(kw))) {
    return CACHE_TTLS.crisis;
  }

  // Check for personalized content (short cache)
  if (PERSONALIZED_PATTERNS.some(p => p.test(content))) {
    return CACHE_TTLS.personalized;
  }

  // Check for FAQ patterns (long cache)
  if (FAQ_PATTERNS.some(p => p.test(content))) {
    return CACHE_TTLS.faq;
  }

  // Default cache
  return CACHE_TTLS.general;
}

/**
 * Normalize messages for cache key generation
 * Removes whitespace variations and normalizes case
 */
function normalizeMessages(messages: Array<{ role: string; content: string }>): string {
  const normalized = messages.map(m => ({
    role: m.role.toLowerCase(),
    content: m.content.toLowerCase().trim().replace(/\s+/g, ' '),
  }));

  return JSON.stringify(normalized);
}

/**
 * Generate cache key from messages
 */
function generateCacheKey(messages: Array<{ role: string; content: string }>): string {
  const normalized = normalizeMessages(messages);
  const hash = createHash('sha256').update(normalized).digest('hex');
  return `ai:response:${hash}`;
}

/**
 * Check if a cached response exists
 */
export async function checkCache(
  messages: Array<{ role: string; content: string }>
): Promise<CacheCheckResult> {
  try {
    // Check if we should cache this at all
    const ttl = determineTTL(messages);
    if (ttl === 0) {
      return { hit: false };
    }

    const key = generateCacheKey(messages);
    const cached = await redis.get(key);

    if (!cached) {
      return { hit: false };
    }

    const data: CachedResponse = JSON.parse(cached);

    // Update hit count in background
    redis.hincrby(`${key}:meta`, 'hits', 1).catch(() => {});

    logger.debug({ key }, 'AI cache hit');

    return {
      hit: true,
      response: data.response,
      provider: data.provider,
      cachedAt: data.cachedAt,
    };
  } catch (error) {
    logger.error({ error }, 'Error checking AI cache');
    return { hit: false };
  }
}

/**
 * Store a response in the cache
 */
export async function cacheResponse(
  messages: Array<{ role: string; content: string }>,
  response: string,
  provider: string
): Promise<void> {
  try {
    const ttl = determineTTL(messages);
    if (ttl === 0) {
      return; // Don't cache
    }

    const key = generateCacheKey(messages);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const data: CachedResponse = {
      response,
      provider,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hitCount: 0,
    };

    await redis.setex(key, ttl, JSON.stringify(data));

    logger.debug({ key, ttl, provider }, 'AI response cached');
  } catch (error) {
    // Don't fail the request if caching fails
    logger.error({ error }, 'Error caching AI response');
  }
}

/**
 * Invalidate cached responses matching a pattern
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(`ai:response:*${pattern}*`);
    if (keys.length === 0) return 0;

    await redis.del(...keys);
    logger.info({ count: keys.length, pattern }, 'AI cache invalidated');
    return keys.length;
  } catch (error) {
    logger.error({ error, pattern }, 'Error invalidating AI cache');
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  totalHits: number;
  hitRate: number;
  memoryUsage?: number;
}> {
  try {
    const keys = await redis.keys('ai:response:*');
    const totalKeys = keys.length;

    // Get hit counts from meta keys
    let totalHits = 0;
    for (const key of keys) {
      const hits = await redis.hget(`${key}:meta`, 'hits');
      totalHits += parseInt(hits || '0', 10);
    }

    // Estimate hit rate (hits / (hits + keys))
    const hitRate = totalHits > 0 ? totalHits / (totalHits + totalKeys) : 0;

    return {
      totalKeys,
      totalHits,
      hitRate,
    };
  } catch (error) {
    logger.error({ error }, 'Error getting AI cache stats');
    return {
      totalKeys: 0,
      totalHits: 0,
      hitRate: 0,
    };
  }
}

/**
 * Clear all AI response cache
 */
export async function clearCache(): Promise<number> {
  try {
    const keys = await redis.keys('ai:response:*');
    if (keys.length === 0) return 0;

    await redis.del(...keys);
    logger.info({ count: keys.length }, 'AI cache cleared');
    return keys.length;
  } catch (error) {
    logger.error({ error }, 'Error clearing AI cache');
    return 0;
  }
}
