/**
 * Suspicious Activity Detection
 * 
 * Detects unusual access patterns that may indicate account compromise
 * 
 * Detection Methods:
 * - Impossible travel (login from different countries too quickly)
 * - Off-hours access
 * - New device/browser detection
 * - Unusual API usage patterns
 * - Location anomalies
 */

import { isRedisAvailable } from '@/lib/env';
import { prisma } from '@/lib/prisma';

interface LoginEvent {
  userId: string;
  timestamp: Date;
  ipAddress: string;
  country?: string;
  city?: string;
  deviceFingerprint?: string;
  userAgent?: string;
}

interface SuspiciousActivityResult {
  isSuspicious: boolean;
  score: number; // 0-100
  alerts: string[];
  riskFactors: string[];
}

// Risk thresholds
const RISK_THRESHOLDS = {
  low: 30,
  medium: 60,
  high: 80,
} as const;

// In-memory store for recent logins
const recentLogins = new Map<string, LoginEvent[]>();

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
 * Record a login event for tracking
 */
export async function recordLoginEvent(event: LoginEvent): Promise<void> {
  const key = `logins:${event.userId}`;
  const redis = await getRedisClient();
  
  // Store in Redis with 24h expiration
  const eventData = JSON.stringify({
    ...event,
    timestamp: event.timestamp.toISOString(),
  });
  
  if (redis) {
    await redis.lpush(key, eventData);
    await redis.ltrim(key, 0, 99); // Keep last 100 logins
    await redis.expire(key, 86400);
  } else {
    // Memory fallback
    const events = recentLogins.get(key) || [];
    events.unshift(event);
    if (events.length > 100) events.pop();
    recentLogins.set(key, events);
  }
  
  // Also store in database for permanent record
  // Generate cryptographically secure session token
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const secureToken = `sess_${Date.now()}_${Buffer.from(randomBytes).toString('base64url').substring(0, 16)}`;

  await prisma.userSession.create({
    data: {
      userId: event.userId,
      sessionToken: secureToken,
      ipAddress: event.ipAddress.substring(0, 50),
      userAgent: event.userAgent?.substring(0, 255),
    },
  });
}

/**
 * Check for impossible travel (logins from different locations too quickly)
 */
async function checkImpossibleTravel(
  userId: string,
  currentLogin: LoginEvent
): Promise<{ isImpossible: boolean; reason?: string }> {
  const key = `logins:${userId}`;
  const redis = await getRedisClient();
  
  let events: LoginEvent[] = [];
  
  if (redis) {
    const data = await redis.lrange(key, 0, 10);
    events = data.map(d => {
      const parsed = JSON.parse(d);
      return { ...parsed, timestamp: new Date(parsed.timestamp) };
    });
  } else {
    events = recentLogins.get(key) || [];
  }
  
  if (events.length < 2) {
    return { isImpossible: false };
  }
  
  // Check last login
  const lastLogin = events[1]; // [0] is current login we just added
  
  if (!lastLogin || !currentLogin.country || !lastLogin.country) {
    return { isImpossible: false };
  }
  
  // Skip if same country
  if (currentLogin.country === lastLogin.country) {
    return { isImpossible: false };
  }
  
  // Calculate time difference
  const timeDiff = currentLogin.timestamp.getTime() - lastLogin.timestamp.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  // If less than 2 hours between logins from different countries, it's suspicious
  // (Unless VPN is commonly used - would need user preference)
  if (hoursDiff < 2) {
    return {
      isImpossible: true,
      reason: `Login from ${currentLogin.country} within ${Math.round(hoursDiff * 60)} minutes of login from ${lastLogin.country}`,
    };
  }
  
  return { isImpossible: false };
}

/**
 * Check for new device/browser
 */
async function checkNewDevice(
  userId: string,
  deviceFingerprint: string
): Promise<{ isNew: boolean; lastSeen?: Date }> {
  if (!deviceFingerprint) return { isNew: false };
  
  // Check against known devices in database
  const knownDevice = await prisma.userSession.findFirst({
    where: {
      userId,
      userAgent: { contains: deviceFingerprint.substring(0, 50) },
    },
    orderBy: { createdAt: 'desc' },
  });
  
  if (!knownDevice) {
    return { isNew: true };
  }
  
  // Check if it's been more than 30 days
  const daysSinceLastSeen = (Date.now() - knownDevice.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastSeen > 30) {
    return { isNew: true, lastSeen: knownDevice.createdAt };
  }
  
  return { isNew: false };
}

/**
 * Check for off-hours access
 */
function checkOffHoursAccess(timestamp: Date): boolean {
  const hour = timestamp.getHours();
  const day = timestamp.getDay(); // 0 = Sunday
  
  // Weekend access is not suspicious for healthcare (parents check on weekends)
  // But very late night access (2am - 5am) might be
  const isLateNight = hour >= 2 && hour <= 5;
  
  return isLateNight;
}

/**
 * Check for IP reputation
 */
async function checkIpReputation(ipAddress: string): Promise<{
  isKnownBad: boolean;
  riskScore: number;
}> {
  // Check against known bad IPs (could integrate with threat intelligence)
  const redis = await getRedisClient();
  
  if (redis) {
    const isBlocked = await redis.get(`ip:block:${ipAddress}`);
    if (isBlocked) {
      return { isKnownBad: true, riskScore: 100 };
    }
  }
  
  // Check for Tor exit nodes (simplified - would use a real list)
  const torExitNodes: string[] = []; // Would populate from database
  if (torExitNodes.includes(ipAddress)) {
    return { isKnownBad: false, riskScore: 50 };
  }
  
  return { isKnownBad: false, riskScore: 0 };
}

/**
 * Main suspicious activity detection
 */
export async function detectSuspiciousActivity(
  userId: string,
  loginData: {
    ipAddress: string;
    country?: string;
    city?: string;
    deviceFingerprint?: string;
    userAgent?: string;
  }
): Promise<SuspiciousActivityResult> {
  const alerts: string[] = [];
  const riskFactors: string[] = [];
  let score = 0;
  
  const currentLogin: LoginEvent = {
    userId,
    timestamp: new Date(),
    ...loginData,
  };
  
  // Record this login
  await recordLoginEvent(currentLogin);
  
  // Check 1: Impossible travel
  const travelCheck = await checkImpossibleTravel(userId, currentLogin);
  if (travelCheck.isImpossible) {
    score += 40;
    alerts.push('IMPOSSIBLE_TRAVEL');
    riskFactors.push(travelCheck.reason!);
  }
  
  // Check 2: New device
  if (loginData.deviceFingerprint) {
    const deviceCheck = await checkNewDevice(userId, loginData.deviceFingerprint);
    if (deviceCheck.isNew) {
      score += 20;
      alerts.push('NEW_DEVICE');
      riskFactors.push(deviceCheck.lastSeen 
        ? `Login from previously unseen device (last seen ${Math.round((Date.now() - deviceCheck.lastSeen.getTime()) / (1000 * 60 * 60 * 24))} days ago)`
        : 'Login from new device'
      );
    }
  }
  
  // Check 3: Off-hours access
  if (checkOffHoursAccess(currentLogin.timestamp)) {
    score += 15;
    alerts.push('OFF_HOURS');
    riskFactors.push('Login during unusual hours (2am-5am)');
  }
  
  // Check 4: IP reputation
  const ipCheck = await checkIpReputation(loginData.ipAddress);
  if (ipCheck.isKnownBad) {
    score += 50;
    alerts.push('KNOWN_BAD_IP');
    riskFactors.push('Login from blocked/reputation IP');
  } else {
    score += ipCheck.riskScore * 0.3;
  }
  
  // Check 5: Rapid successive logins (could be credential stuffing)
  const redis = await getRedisClient();
  if (redis) {
    const recentAttempts = await redis.llen(`logins:${userId}`);
    if (recentAttempts > 10) {
      const recentEvents = await redis.lrange(`logins:${userId}`, 0, 10);
      const timestamps = recentEvents.map(e => new Date(JSON.parse(e).timestamp).getTime());
      const timeSpan = timestamps[0] - timestamps[timestamps.length - 1];
      
      if (timeSpan < 60000) { // 10+ logins in 1 minute
        score += 30;
        alerts.push('RAPID_LOGINS');
        riskFactors.push('Multiple rapid login attempts');
      }
    }
  }
  
  // Cap score at 100
  score = Math.min(score, 100);
  
  return {
    isSuspicious: score >= RISK_THRESHOLDS.medium,
    score,
    alerts,
    riskFactors,
  };
}

/**
 * Log security alert to database
 */
export async function logSecurityAlert(
  userId: string,
  alert: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: Record<string, unknown>;
  }
): Promise<void> {
  await prisma.securityAlert.create({
    data: {
      userId,
      alertType: alert.type,
      severity: alert.severity,
      details: alert.details as any,
      acknowledged: false,
    },
  });
  
  console.warn('[SECURITY-ALERT]', {
    userId,
    type: alert.type,
    severity: alert.severity,
    timestamp: new Date().toISOString(),
  });
}

export { RISK_THRESHOLDS };
export type { LoginEvent, SuspiciousActivityResult };
