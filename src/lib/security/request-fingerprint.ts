/**
 * Request Fingerprinting Service
 * 
 * Creates unique fingerprints for requests to detect:
 * - Automated/bot traffic patterns
 * - Velocity attacks
 * - Anomalous behavior
 * - Session hijacking
 * 
 * Uses multiple signals:
 * - IP address + User-Agent hash
 * - TLS fingerprint
 * - HTTP header consistency
 * - Behavioral patterns (mouse/keyboard - client-side)
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { isRedisAvailable } from '@/lib/env';

// Configuration
const VELOCITY_WINDOW_MS = 60000; // 1 minute
const VELOCITY_THRESHOLD = 100; // Max 100 requests per minute
const SUSPICIOUS_VELOCITY = 60; // Flag above this

interface FingerprintComponents {
  ip: string;
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  accept: string;
  dnt: string;
  secFetch: {
    site: string;
    mode: string;
    dest: string;
  };
}

interface FingerprintResult {
  fingerprint: string;
  hash: string;
  components: {
    ip: string;
    userAgentShort: string;
    signals: number;
  };
}

interface VelocityRecord {
  count: number;
  firstSeen: number;
  lastSeen: number;
  urls: Set<string>;
}

interface AnomalyResult {
  isAnomalous: boolean;
  score: number;
  reasons: string[];
}

// In-memory velocity store (use Redis in production)
const velocityStore = new Map<string, VelocityRecord>();

/**
 * Extract fingerprint components from request
 */
function extractComponents(request: NextRequest): FingerprintComponents {
  return {
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent') || '',
    acceptLanguage: request.headers.get('accept-language') || '',
    acceptEncoding: request.headers.get('accept-encoding') || '',
    accept: request.headers.get('accept') || '',
    dnt: request.headers.get('dnt') || '',
    secFetch: {
      site: request.headers.get('sec-fetch-site') || '',
      mode: request.headers.get('sec-fetch-mode') || '',
      dest: request.headers.get('sec-fetch-dest') || '',
    },
  };
}

/**
 * Create a unique fingerprint hash from request components
 */
export function createFingerprint(request: NextRequest): FingerprintResult {
  const components = extractComponents(request);
  
  // Create composite string of identifying factors
  const fingerprintString = [
    components.ip.split(',')[0].trim(), // First IP only
    components.userAgent,
    components.acceptLanguage,
    components.secFetch.site,
    components.secFetch.mode,
  ].join('|');
  
  // Create hash
  const hash = crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex')
    .substring(0, 32);
  
  return {
    fingerprint: fingerprintString,
    hash,
    components: {
      ip: components.ip.substring(0, 50),
      userAgentShort: components.userAgent.substring(0, 50),
      signals: Object.values(components).filter(v => v && v !== 'unknown').length,
    },
  };
}

/**
 * Create a browser fingerprint based on headers
 * This identifies the browser type regardless of IP
 */
export function createBrowserFingerprint(request: NextRequest): string {
  const components = extractComponents(request);
  
  // Browser characteristics that persist across sessions
  const browserString = [
    components.userAgent,
    components.acceptLanguage,
    components.acceptEncoding,
    components.dnt,
  ].join('|');
  
  return crypto
    .createHash('sha256')
    .update(browserString)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Track request velocity for a fingerprint
 */
export async function trackVelocity(
  fingerprint: string,
  url: string
): Promise<VelocityRecord> {
  const now = Date.now();
  const key = `velocity:${fingerprint}`;
  
  // Try Redis first
  const redis = await getRedisClient();
  
  if (redis) {
    const data = await redis.get(key);
    let record: VelocityRecord;
    
    if (data) {
      const parsed = JSON.parse(data);
      record = {
        count: parsed.count + 1,
        firstSeen: parsed.firstSeen,
        lastSeen: now,
        urls: new Set([...parsed.urls, url]),
      };
    } else {
      record = {
        count: 1,
        firstSeen: now,
        lastSeen: now,
        urls: new Set([url]),
      };
    }
    
    // Store with expiration
    await redis.setex(
      key,
      Math.ceil(VELOCITY_WINDOW_MS / 1000),
      JSON.stringify({
        ...record,
        urls: Array.from(record.urls),
      })
    );
    
    return record;
  }
  
  // Fallback to memory
  const existing = velocityStore.get(key);
  let record: VelocityRecord;
  
  if (existing && (now - existing.firstSeen) < VELOCITY_WINDOW_MS) {
    record = {
      count: existing.count + 1,
      firstSeen: existing.firstSeen,
      lastSeen: now,
      urls: existing.urls.add(url),
    };
  } else {
    record = {
      count: 1,
      firstSeen: now,
      lastSeen: now,
      urls: new Set([url]),
    };
  }
  
  velocityStore.set(key, record);
  
  // Cleanup old entries periodically
  if (velocityStore.size > 10000) {
    for (const [k, v] of velocityStore.entries()) {
      if (now - v.firstSeen > VELOCITY_WINDOW_MS) {
        velocityStore.delete(k);
      }
    }
  }
  
  return record;
}

/**
 * Check if velocity is suspicious
 */
export function checkVelocity(velocity: VelocityRecord): {
  allowed: boolean;
  suspicious: boolean;
  remaining: number;
} {
  const uniqueUrlRatio = velocity.urls.size / velocity.count;
  
  // Many requests to same URL = potential attack
  // Many requests to different URLs = scraping
  const allowed = velocity.count <= VELOCITY_THRESHOLD;
  const suspicious = velocity.count > SUSPICIOUS_VELOCITY || uniqueUrlRatio > 0.8;
  
  return {
    allowed,
    suspicious,
    remaining: Math.max(0, VELOCITY_THRESHOLD - velocity.count),
  };
}

/**
 * Detect anomalous request patterns
 */
export function detectAnomalies(
  request: NextRequest,
  velocity: VelocityRecord
): AnomalyResult {
  const reasons: string[] = [];
  let score = 0;
  
  // Check 1: Missing standard headers (bots often miss these)
  const requiredHeaders = ['user-agent', 'accept'];
  for (const header of requiredHeaders) {
    if (!request.headers.get(header)) {
      reasons.push(`Missing ${header} header`);
      score += 20;
    }
  }
  
  // Check 2: Suspicious sec-fetch headers
  const secFetchSite = request.headers.get('sec-fetch-site');
  const secFetchMode = request.headers.get('sec-fetch-mode');
  
  if (secFetchSite === 'none' && secFetchMode === 'navigate') {
    // Direct navigation - normal
  } else if (!secFetchSite && !secFetchMode) {
    // Missing sec-fetch headers - suspicious for modern browsers
    const ua = request.headers.get('user-agent') || '';
    if (ua.includes('Chrome/') || ua.includes('Firefox/') || ua.includes('Safari/')) {
      reasons.push('Modern browser missing sec-fetch headers');
      score += 15;
    }
  }
  
  // Check 3: High velocity
  if (velocity.count > SUSPICIOUS_VELOCITY) {
    reasons.push(`High velocity: ${velocity.count} requests/min`);
    score += Math.min(velocity.count - SUSPICIOUS_VELOCITY, 40);
  }
  
  // Check 4: Many unique URLs (scraping behavior)
  const uniqueUrlRatio = velocity.urls.size / velocity.count;
  if (uniqueUrlRatio > 0.9 && velocity.count > 20) {
    reasons.push('High unique URL ratio (possible scraping)');
    score += 25;
  }
  
  // Check 5: Accept header anomalies
  const accept = request.headers.get('accept');
  if (!accept || accept === '*/*') {
    reasons.push('Generic accept header');
    score += 10;
  }
  
  return {
    isAnomalous: score >= 50,
    score: Math.min(score, 100),
    reasons,
  };
}

/**
 * Full request analysis
 */
export async function analyzeRequest(request: NextRequest): Promise<{
  fingerprint: FingerprintResult;
  velocity: VelocityRecord;
  velocityCheck: ReturnType<typeof checkVelocity>;
  anomaly: AnomalyResult;
  riskScore: number;
  allowed: boolean;
}> {
  const fingerprint = createFingerprint(request);
  const velocity = await trackVelocity(fingerprint.hash, request.nextUrl.pathname);
  const velocityCheck = checkVelocity(velocity);
  const anomaly = detectAnomalies(request, velocity);
  
  // Calculate overall risk score
  const riskScore = Math.min(
    anomaly.score + (velocityCheck.suspicious ? 20 : 0),
    100
  );
  
  return {
    fingerprint,
    velocity,
    velocityCheck,
    anomaly,
    riskScore,
    allowed: velocityCheck.allowed && riskScore < 80,
  };
}

/**
 * Redis client helper
 */
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
 * Client-side fingerprinting data
 * Call this from client components to add behavioral signals
 */
export interface ClientFingerprint {
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  timezoneOffset: number;
  language: string;
  languages: string[];
  platform: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  touchSupport: boolean;
  canvas?: string; // Canvas fingerprint hash
  webgl?: string; // WebGL fingerprint hash
  fonts?: string[]; // Detected fonts
}

/**
 * Generate client fingerprint (run this in browser)
 */
export function generateClientFingerprint(): ClientFingerprint {
  const screen = window.screen;
  const navigator = window.navigator;
  
  return {
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    language: navigator.language,
    languages: Array.from(navigator.languages || []),
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,
    touchSupport: 'ontouchstart' in window,
  };
}

export { VELOCITY_THRESHOLD, SUSPICIOUS_VELOCITY, VELOCITY_WINDOW_MS };
