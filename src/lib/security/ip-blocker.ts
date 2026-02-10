/**
 * IP Blocker Service
 * 
 * Temporary IP blocking for suspicious/malicious activity
 * 
 * Features:
 * - Automatic blocking based on threat score
 * - Configurable block durations
 * - Escalating penalties for repeat offenders
 * - Integration with scraper detection and rate limiting
 */

import { isRedisAvailable } from '@/lib/env';

// Block durations (escalating)
const BLOCK_DURATIONS = {
  first: 900,      // 15 minutes
  second: 3600,    // 1 hour
  third: 86400,    // 24 hours
  permanent: 0,    // Indefinite (manual unban required)
} as const;

// Threat score thresholds
const THREAT_THRESHOLDS = {
  block: 100,      // Auto-block at this score
  warn: 70,        // Warning level
  monitor: 50,     // Start monitoring
} as const;

interface BlockRecord {
  ip: string;
  reason: string;
  blockedAt: number;
  expiresAt: number;
  threatScore: number;
  incidentCount: number;
  metadata?: Record<string, unknown>;
}

interface BlockStatus {
  blocked: boolean;
  expiresAt?: number;
  reason?: string;
  incidentCount?: number;
}

// Memory fallback for development
const memoryBlocks = new Map<string, BlockRecord>();

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
 * Get block key for Redis
 */
function getBlockKey(ip: string): string {
  return `ip:block:${ip}`;
}

function getHistoryKey(ip: string): string {
  return `ip:history:${ip}`;
}

/**
 * Check if an IP is currently blocked
 */
export async function isBlocked(ip: string): Promise<BlockStatus> {
  const redis = await getRedisClient();
  
  if (redis) {
    const data = await redis.get(getBlockKey(ip));
    if (!data) return { blocked: false };
    
    const record: BlockRecord = JSON.parse(data);
    const now = Date.now();
    
    // Check if block expired
    if (record.expiresAt > 0 && record.expiresAt < now) {
      await redis.del(getBlockKey(ip));
      return { blocked: false };
    }
    
    return {
      blocked: true,
      expiresAt: record.expiresAt,
      reason: record.reason,
      incidentCount: record.incidentCount,
    };
  }
  
  // Memory fallback
  const record = memoryBlocks.get(ip);
  if (!record) return { blocked: false };
  
  const now = Date.now();
  if (record.expiresAt > 0 && record.expiresAt < now) {
    memoryBlocks.delete(ip);
    return { blocked: false };
  }
  
  return {
    blocked: true,
    expiresAt: record.expiresAt,
    reason: record.reason,
    incidentCount: record.incidentCount,
  };
}

/**
 * Block an IP address
 */
export async function blockIp(
  ip: string,
  reason: string,
  options: {
    duration?: number; // 0 = permanent
    threatScore?: number;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  const { duration = BLOCK_DURATIONS.first, threatScore = 100, metadata } = options;
  
  // Get incident history
  const history = await getIncidentHistory(ip);
  const incidentCount = history + 1;
  
  // Calculate actual duration based on incident count
  let actualDuration = duration;
  if (duration > 0) {
    if (incidentCount === 2) actualDuration = BLOCK_DURATIONS.second;
    else if (incidentCount >= 3) actualDuration = BLOCK_DURATIONS.third;
  }
  
  const now = Date.now();
  const record: BlockRecord = {
    ip,
    reason,
    blockedAt: now,
    expiresAt: actualDuration > 0 ? now + (actualDuration * 1000) : 0,
    threatScore,
    incidentCount,
    metadata,
  };
  
  const redis = await getRedisClient();
  
  if (redis) {
    const key = getBlockKey(ip);
    if (actualDuration > 0) {
      await redis.setex(key, actualDuration, JSON.stringify(record));
    } else {
      await redis.set(key, JSON.stringify(record));
    }
    
    // Update incident history
    await redis.incr(getHistoryKey(ip));
    await redis.expire(getHistoryKey(ip), 86400 * 30); // Keep history for 30 days
  } else {
    memoryBlocks.set(ip, record);
  }
  
  // Log the block
  console.warn('[IP-BLOCKER] IP blocked:', {
    ip: ip.substring(0, 20) + '...',
    reason,
    duration: actualDuration,
    incidentCount,
    threatScore,
  });
}

/**
 * Unblock an IP address
 */
export async function unblockIp(ip: string): Promise<boolean> {
  const redis = await getRedisClient();
  
  if (redis) {
    const result = await redis.del(getBlockKey(ip));
    return result > 0;
  }
  
  return memoryBlocks.delete(ip);
}

/**
 * Get incident count for an IP
 */
export async function getIncidentHistory(ip: string): Promise<number> {
  const redis = await getRedisClient();
  
  if (redis) {
    const count = await redis.get(getHistoryKey(ip));
    return parseInt(count || '0');
  }
  
  const record = memoryBlocks.get(ip);
  return record?.incidentCount || 0;
}

/**
 * Record a security incident for an IP
 * Auto-blocks if threat score exceeds threshold
 */
export async function recordIncident(
  ip: string,
  incident: {
    type: string;
    score: number;
    details?: Record<string, unknown>;
  }
): Promise<{ blocked: boolean; threatScore: number }> {
  const { type, score, details } = incident;
  
  // Get current threat score
  const currentScore = await getThreatScore(ip);
  const newScore = Math.min(currentScore + score, 200);
  
  // Update threat score
  await updateThreatScore(ip, newScore);
  
  // Auto-block if threshold exceeded
  let blocked = false;
  if (newScore >= THREAT_THRESHOLDS.block) {
    await blockIp(ip, `Auto-blocked: ${type}`, {
      threatScore: newScore,
      metadata: { incidentType: type, ...details },
    });
    blocked = true;
  }
  
  return { blocked, threatScore: newScore };
}

/**
 * Get current threat score for an IP
 */
export async function getThreatScore(ip: string): Promise<number> {
  const redis = await getRedisClient();
  
  if (redis) {
    const score = await redis.get(`ip:threat:${ip}`);
    return parseInt(score || '0');
  }
  
  return 0;
}

/**
 * Update threat score for an IP
 */
export async function updateThreatScore(ip: string, score: number): Promise<void> {
  const redis = await getRedisClient();
  
  if (redis) {
    // Decay score over time (1 hour TTL)
    await redis.setex(`ip:threat:${ip}`, 3600, score.toString());
  }
}

/**
 * Get all blocked IPs (for admin dashboard)
 */
export async function getBlockedIps(): Promise<BlockRecord[]> {
  const redis = await getRedisClient();
  const results: BlockRecord[] = [];
  
  if (redis) {
    // Scan for block keys
    let cursor = '0';
    do {
      const reply = await redis.scan(cursor, 'MATCH', 'ip:block:*', 'COUNT', 100);
      cursor = reply[0];
      const keys = reply[1];
      
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const record: BlockRecord = JSON.parse(data);
          // Only include active blocks
          if (record.expiresAt === 0 || record.expiresAt > Date.now()) {
            results.push(record);
          }
        }
      }
    } while (cursor !== '0');
  } else {
    // Memory fallback
    const now = Date.now();
    for (const record of memoryBlocks.values()) {
      if (record.expiresAt === 0 || record.expiresAt > now) {
        results.push(record);
      }
    }
  }
  
  return results.sort((a, b) => b.blockedAt - a.blockedAt);
}

/**
 * Middleware helper to check IP block
 */
export async function checkIpBlock(ip: string): Promise<{
  allowed: boolean;
  response?: Response;
}> {
  const status = await isBlocked(ip);
  
  if (status.blocked) {
    const retryAfter = status.expiresAt 
      ? Math.ceil((status.expiresAt - Date.now()) / 1000)
      : 86400;
    
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Access temporarily restricted',
          retryAfter: Math.max(retryAfter, 60),
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.max(retryAfter, 60)),
          },
        }
      ),
    };
  }
  
  return { allowed: true };
}

export {
  BLOCK_DURATIONS,
  THREAT_THRESHOLDS,
  type BlockRecord,
  type BlockStatus,
};
