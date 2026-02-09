/**
 * Scraper Detection & Prevention
 * 
 * Advanced detection for content scraping and automated data extraction
 * 
 * Detection Methods:
 * - Request pattern analysis (sequential ID access)
 * - Timing analysis (too-fast requests)
 * - Header consistency checks
 * - Session behavior analysis
 * - Content access patterns
 */

import { NextRequest } from 'next/server';
import { isRedisAvailable } from '@/lib/env';

// Detection thresholds
const SCRAPER_THRESHOLDS = {
  // Sequential access detection
  sequentialIdThreshold: 5,       // 5+ sequential IDs = suspicious
  sequentialWindowMs: 60000,      // Within 1 minute
  
  // Timing analysis
  minHumanIntervalMs: 500,        // Min 500ms between clicks
  burstThreshold: 10,             // 10+ rapid requests
  burstWindowMs: 5000,            // Within 5 seconds
  
  // Content access
  paginationSpeedThreshold: 5,    // 5+ pages too fast
  deepPaginationThreshold: 20,    // 20+ pages deep
  uniqueContentRatio: 0.1,        // Less than 10% unique content
  
  // Session behavior
  sessionPagesThreshold: 100,     // 100+ pages in session
  noInteractionThreshold: 50,     // 50+ pages without interaction
} as const;

interface ScraperSignals {
  sequentialAccess: boolean;
  sequentialCount: number;
  rapidRequests: boolean;
  rapidCount: number;
  paginationAbuse: boolean;
  deepPagination: boolean;
  lowInteraction: boolean;
  sessionScore: number;
}

interface ScraperResult {
  isScraper: boolean;
  confidence: number; // 0-100
  signals: ScraperSignals;
  action: 'allow' | 'challenge' | 'block';
}

// Redis client helper
async function getRedisClient() {
  if (!isRedisAvailable()) return null;
  try {
    const { Redis } = await import('ioredis');
    const client = new Redis(process.env.REDIS_URL!, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    await client.connect().catch(() => null);
    return client.status === 'ready' ? client : null;
  } catch {
    return null;
  }
}

/**
 * Track sequential ID access pattern
 * Scrapers often access /resource/1, /resource/2, /resource/3, etc.
 */
export async function trackSequentialAccess(
  identifier: string,
  resourceId: string | number
): Promise<{ isSequential: boolean; sequentialCount: number }> {
  const redis = await getRedisClient();
  const key = `scraper:seq:${identifier}`;
  
  if (redis) {
    // Get recent access history
    const now = Date.now();
    const windowStart = now - SCRAPER_THRESHOLDS.sequentialWindowMs;
    
    // Add current access
    await redis.zadd(key, now, `${resourceId}:${now}`);
    
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // Set expiration
    await redis.expire(key, 300);
    
    // Get recent entries
    const entries = await redis.zrange(key, 0, -1);
    
    // Check for sequential pattern
    const ids = entries
      .map(e => parseInt(e.split(':')[0]))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);
    
    let sequentialCount = 1;
    for (let i = 1; i < ids.length; i++) {
      if (ids[i] === ids[i - 1] + 1) {
        sequentialCount++;
      } else {
        sequentialCount = 1;
      }
    }
    
    return {
      isSequential: sequentialCount >= SCRAPER_THRESHOLDS.sequentialIdThreshold,
      sequentialCount,
    };
  }
  
  // Memory fallback - simplified
  return { isSequential: false, sequentialCount: 0 };
}

/**
 * Analyze request timing patterns
 * Detects inhumanly fast navigation
 */
export async function analyzeTiming(
  identifier: string,
  timestamp: number = Date.now()
): Promise<{ isSuspicious: boolean; burstCount: number; avgInterval: number }> {
  const redis = await getRedisClient();
  const key = `scraper:timing:${identifier}`;
  
  if (redis) {
    // Add timestamp
    await redis.zadd(key, timestamp, timestamp.toString());
    
    // Clean old entries (keep last minute)
    const windowStart = timestamp - 60000;
    await redis.zremrangebyscore(key, 0, windowStart);
    await redis.expire(key, 120);
    
    // Get recent timestamps
    const timestamps = await redis.zrange(key, 0, -1);
    const times = timestamps.map(t => parseInt(t)).sort((a, b) => a - b);
    
    if (times.length < 2) {
      return { isSuspicious: false, burstCount: 1, avgInterval: 0 };
    }
    
    // Calculate intervals
    const intervals: number[] = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i - 1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Count bursts (requests faster than human threshold)
    const burstCount = intervals.filter(i => i < SCRAPER_THRESHOLDS.minHumanIntervalMs).length + 1;
    
    // Check for burst within short window
    const recentBurst = times.filter(t => timestamp - t < SCRAPER_THRESHOLDS.burstWindowMs).length;
    
    return {
      isSuspicious: recentBurst >= SCRAPER_THRESHOLDS.burstThreshold || avgInterval < 200,
      burstCount: Math.max(burstCount, recentBurst),
      avgInterval,
    };
  }
  
  return { isSuspicious: false, burstCount: 1, avgInterval: 0 };
}

/**
 * Track pagination depth and speed
 * Detects deep scraping of paginated content
 */
export async function trackPagination(
  identifier: string,
  pageNumber: number
): Promise<{ isDeep: boolean; isFast: boolean; pagesInSession: number }> {
  const redis = await getRedisClient();
  const key = `scraper:pages:${identifier}`;
  
  if (redis) {
    const now = Date.now();
    
    // Add page access
    await redis.hset(key, {
      [`page_${pageNumber}`]: now,
      lastAccess: now,
    });
    await redis.expire(key, 1800); // 30 min session
    
    // Count unique pages accessed
    const data = await redis.hgetall(key);
    const pageKeys = Object.keys(data).filter(k => k.startsWith('page_'));
    const pagesInSession = pageKeys.length;
    
    // Check if accessing pages too fast
    const timestamps = pageKeys
      .map(k => parseInt(data[k]))
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b);
    
    let fastPages = 0;
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] - timestamps[i - 1] < 1000) {
        fastPages++;
      }
    }
    
    return {
      isDeep: pagesInSession >= SCRAPER_THRESHOLDS.deepPaginationThreshold,
      isFast: fastPages >= SCRAPER_THRESHOLDS.paginationSpeedThreshold,
      pagesInSession,
    };
  }
  
  return { isDeep: false, isFast: false, pagesInSession: 1 };
}

/**
 * Detect scraping behavior from request headers
 */
export function detectHeaderAnomalies(request: NextRequest): {
  score: number;
  anomalies: string[];
} {
  const anomalies: string[] = [];
  let score = 0;
  
  // Check for common scraper headers
  const userAgent = request.headers.get('user-agent') || '';
  
  // Missing accept headers (common in basic scrapers)
  if (!request.headers.get('accept')) {
    anomalies.push('Missing accept header');
    score += 15;
  }
  
  // Missing accept-language
  if (!request.headers.get('accept-language')) {
    anomalies.push('Missing accept-language');
    score += 10;
  }
  
  // Generic user agent
  if (userAgent === 'Mozilla/5.0' || userAgent.includes('compatible;')) {
    anomalies.push('Generic user agent');
    score += 20;
  }
  
  // Check for headless browser indicators
  if (userAgent.includes('HeadlessChrome') || userAgent.includes('PhantomJS')) {
    anomalies.push('Headless browser detected');
    score += 25;
  }
  
  // Missing or wrong sec-fetch headers
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (!secFetchSite && (userAgent.includes('Chrome/') || userAgent.includes('Edge/'))) {
    anomalies.push('Missing sec-fetch headers in modern browser');
    score += 20;
  }
  
  return { score, anomalies };
}

/**
 * Main scraper detection function
 */
export async function detectScraper(
  request: NextRequest,
  identifier: string
): Promise<ScraperResult> {
  const url = request.nextUrl.pathname;
  
  // Extract resource ID if present (e.g., /posts/123 -> 123)
  const resourceIdMatch = url.match(/\/(\d+)(?:\/|$)/);
  const resourceId = resourceIdMatch ? parseInt(resourceIdMatch[1]) : null;
  
  // Extract page number if present
  const pageMatch = url.match(/[?&]page=(\d+)/);
  const pageNumber = pageMatch ? parseInt(pageMatch[1]) : 1;
  
  // Run all detection methods
  const [sequential, timing, pagination, headers] = await Promise.all([
    resourceId ? trackSequentialAccess(identifier, resourceId) : Promise.resolve({ isSequential: false, sequentialCount: 0 }),
    analyzeTiming(identifier),
    trackPagination(identifier, pageNumber),
    Promise.resolve(detectHeaderAnomalies(request)),
  ]);
  
  // Calculate confidence score
  let confidence = 0;
  const signals: ScraperSignals = {
    sequentialAccess: sequential.isSequential,
    sequentialCount: sequential.sequentialCount,
    rapidRequests: timing.isSuspicious,
    rapidCount: timing.burstCount,
    paginationAbuse: pagination.isFast,
    deepPagination: pagination.isDeep,
    lowInteraction: pagination.pagesInSession > SCRAPER_THRESHOLDS.noInteractionThreshold,
    sessionScore: 0,
  };
  
  // Weighted scoring
  if (sequential.isSequential) confidence += 25;
  if (timing.isSuspicious) confidence += 25;
  if (pagination.isFast) confidence += 20;
  if (pagination.isDeep) confidence += 15;
  confidence += Math.min(headers.score, 30);
  
  // Adjust for session size
  if (pagination.pagesInSession > SCRAPER_THRESHOLDS.sessionPagesThreshold) {
    confidence += 15;
    signals.lowInteraction = true;
  }
  
  signals.sessionScore = pagination.pagesInSession;
  
  // Determine action
  let action: 'allow' | 'challenge' | 'block' = 'allow';
  if (confidence >= 80) {
    action = 'block';
  } else if (confidence >= 50) {
    action = 'challenge'; // CAPTCHA required
  }
  
  return {
    isScraper: confidence >= 50,
    confidence: Math.min(confidence, 100),
    signals,
    action,
  };
}

/**
 * Get aggressive rate limit for suspected scrapers
 * Returns much stricter limits for scrapers
 */
export function getScraperRateLimit(isSuspectedScraper: boolean): {
  maxRequests: number;
  windowSeconds: number;
} {
  if (isSuspectedScraper) {
    return {
      maxRequests: 5,      // Only 5 requests
      windowSeconds: 300,  // Per 5 minutes
    };
  }
  
  // Normal rate limits
  return {
    maxRequests: 100,
    windowSeconds: 60,
  };
}

/**
 * Create API response for blocked scrapers
 * Returns vague error to not reveal detection methods
 */
export function createScraperBlockResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Service temporarily unavailable',
      retryAfter: 3600,
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '3600',
      },
    }
  );
}

export { SCRAPER_THRESHOLDS };
export type { ScraperSignals, ScraperResult };
