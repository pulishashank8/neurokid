/**
 * User-Agent Validation
 * 
 * Detects and blocks requests from known malicious bots and scrapers.
 * Also identifies legitimate search engine crawlers.
 * 
 * Features:
 *   - Blocked user agent patterns (known bad bots)
 *   - Legitimate crawler detection (Google, Bing, etc.)
 *   - Custom rules support
 *   - Logging for security monitoring
 */

import { NextRequest, NextResponse } from 'next/server';

// Known bad bot patterns (case-insensitive)
const BLOCKED_USER_AGENTS = [
  // Common scrapers and downloaders
  /scrapy/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /java\//i,
  /httpclient/i,
  /http_request/i,
  /okhttp/i,
  /axios/i,
  /node-fetch/i,
  /undici/i,
  /got\(/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /headlesschrome/i,
  /headlessfirefox/i,
  /phantomjs/i,
  /casperjs/i,
  /slimerjs/i,
  
  // SEO/Marketing tools that ignore robots.txt
  /semrush/i,
  /ahrefs/i,
  /majestic/i,
  /screaming\s*frog/i,
  /deepcrawl/i,
  /botify/i,
  /on\s*crawl/i,
  /sitebulb/i,
  
  // Known malicious bots
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /zgrab/i,
  /gobuster/i,
  /dirbuster/i,
  /wfuzz/i,
  /burp/i,
  /nessus/i,
  /acunetix/i,
  /netsparker/i,
  /appscan/i,
  /openvas/i,
  /metasploit/i,
  /beef/i,
  /commix/i,
  /wpscan/i,
  /joomscan/i,
  /droopescan/i,
  
  // Spam bots
  /spambot/i,
  /email\s*harvester/i,
  /email\s*extractor/i,
  /contact\s*harvester/i,
  
  // Data scrapers
  /data\s*miner/i,
  /content\s*scraper/i,
  /web\s*scraper/i,
  /page\s*scraper/i,
  
  // Generic bot keywords
  /bot\s*spider/i,
  /crawler\s*spider/i,
  / Harvester/i,
  / Extractor/i,
  / Siphon/i,
  /Stealer/i,
] as const;

// Legitimate search engine crawlers
const LEGITIMATE_CRAWLERS = [
  { pattern: /googlebot/i, name: 'Googlebot' },
  { pattern: /bingbot/i, name: 'Bingbot' },
  { pattern: /slurp/i, name: 'Yahoo Slurp' },
  { pattern: /duckduckbot/i, name: 'DuckDuckBot' },
  { pattern: /baiduspider/i, name: 'Baiduspider' },
  { pattern: /yandexbot/i, name: 'YandexBot' },
  { pattern: /facebookexternalhit/i, name: 'Facebook Crawler' },
  { pattern: /twitterbot/i, name: 'Twitterbot' },
  { pattern: /linkedinbot/i, name: 'LinkedIn Bot' },
  { pattern: /slackbot/i, name: 'Slackbot' },
  { pattern: /discordbot/i, name: 'Discord Bot' },
  { pattern: /applebot/i, name: 'Apple Bot' },
  { pattern: /whatsapp/i, name: 'WhatsApp' },
  { pattern: /telegrambot/i, name: 'Telegram Bot' },
  { pattern: /bot.*\.google\.com/i, name: 'Google Bot' },
  { pattern: /google.*preview/i, name: 'Google Web Preview' },
] as const;

// Suspicious patterns that aren't automatic blocks but raise score
const SUSPICIOUS_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scrape/i,
  /scan/i,
  /check/i,
  /test/i,
  /probe/i,
  /attack/i,
  /hack/i,
  /exploit/i,
  /inject/i,
  /union\s*select/i,
  /sleep\s*\(/i,
] as const;

export interface UserAgentCheckResult {
  allowed: boolean;
  reason?: string;
  isCrawler: boolean;
  crawlerName?: string;
  riskScore: number; // 0-100, higher = more suspicious
}

/**
 * Check if a user agent is allowed
 */
export function checkUserAgent(userAgent: string | null): UserAgentCheckResult {
  // No user agent is suspicious but not blocked
  if (!userAgent || userAgent === '') {
    return {
      allowed: true,
      reason: 'Missing User-Agent',
      isCrawler: false,
      riskScore: 30,
    };
  }

  const ua = userAgent.toLowerCase();

  // Check for blocked patterns first
  for (const pattern of BLOCKED_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      return {
        allowed: false,
        reason: `Blocked user agent pattern: ${pattern.source}`,
        isCrawler: false,
        riskScore: 100,
      };
    }
  }

  // Check for legitimate crawlers
  for (const crawler of LEGITIMATE_CRAWLERS) {
    if (crawler.pattern.test(userAgent)) {
      return {
        allowed: true,
        isCrawler: true,
        crawlerName: crawler.name,
        riskScore: 0,
      };
    }
  }

  // Calculate risk score based on suspicious patterns
  let riskScore = 0;
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(userAgent)) {
      riskScore += 10;
    }
  }

  // Check for very old browsers (potential security risk)
  const oldBrowsers = [
    /msie\s*[1-8]/i,
    /internet\s*explorer\s*[1-8]/i,
    /firefox\/[1-9]\./i,
    /chrome\/[1-9]\./i,
    /safari\/[1-4]\./i,
  ];
  for (const pattern of oldBrowsers) {
    if (pattern.test(userAgent)) {
      riskScore += 20;
      break;
    }
  }

  // Cap at 100
  riskScore = Math.min(riskScore, 100);

  return {
    allowed: riskScore < 70,
    reason: riskScore >= 70 ? 'High risk user agent' : undefined,
    isCrawler: false,
    riskScore,
  };
}

/**
 * Middleware to block bad user agents
 */
export function userAgentMiddleware(
  request: NextRequest
): NextResponse | null {
  const userAgent = request.headers.get('user-agent');
  const result = checkUserAgent(userAgent);

  if (!result.allowed) {
    console.warn('[USER-AGENT] Blocked:', {
      ua: userAgent?.substring(0, 100),
      reason: result.reason,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return new NextResponse('Forbidden', {
      status: 403,
      statusText: 'Forbidden',
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  return null;
}

/**
 * Check if request is from a legitimate search engine crawler
 * Useful for allowing crawlers past certain restrictions
 */
export function isSearchEngineCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;

  for (const crawler of LEGITIMATE_CRAWLERS) {
    if (crawler.pattern.test(userAgent)) {
      return true;
    }
  }

  return false;
}

/**
 * Get detailed crawler information
 */
export function getCrawlerInfo(userAgent: string | null): {
  isCrawler: boolean;
  name?: string;
  type: 'search' | 'social' | 'messaging' | 'other' | 'unknown';
} {
  if (!userAgent) {
    return { isCrawler: false, type: 'unknown' };
  }

  const searchPatterns = [
    { pattern: /googlebot/i, name: 'Googlebot' },
    { pattern: /bingbot/i, name: 'Bingbot' },
    { pattern: /slurp/i, name: 'Yahoo Slurp' },
    { pattern: /duckduckbot/i, name: 'DuckDuckBot' },
    { pattern: /baiduspider/i, name: 'Baiduspider' },
    { pattern: /yandexbot/i, name: 'YandexBot' },
    { pattern: /applebot/i, name: 'Apple Bot' },
  ];

  const socialPatterns = [
    { pattern: /facebookexternalhit/i, name: 'Facebook' },
    { pattern: /twitterbot/i, name: 'Twitter' },
    { pattern: /linkedinbot/i, name: 'LinkedIn' },
  ];

  const messagingPatterns = [
    { pattern: /slackbot/i, name: 'Slack' },
    { pattern: /discordbot/i, name: 'Discord' },
    { pattern: /whatsapp/i, name: 'WhatsApp' },
    { pattern: /telegrambot/i, name: 'Telegram' },
  ];

  for (const { pattern, name } of searchPatterns) {
    if (pattern.test(userAgent)) {
      return { isCrawler: true, name, type: 'search' };
    }
  }

  for (const { pattern, name } of socialPatterns) {
    if (pattern.test(userAgent)) {
      return { isCrawler: true, name, type: 'social' };
    }
  }

  for (const { pattern, name } of messagingPatterns) {
    if (pattern.test(userAgent)) {
      return { isCrawler: true, name, type: 'messaging' };
    }
  }

  return { isCrawler: false, type: 'unknown' };
}

/**
 * Validate user agent and return appropriate error response
 */
export function validateUserAgent(
  userAgent: string | null,
  options: { 
    allowMissing?: boolean;
    blockThreshold?: number;
  } = {}
): { valid: boolean; error?: string; statusCode?: number } {
  const { allowMissing = false, blockThreshold = 70 } = options;

  const result = checkUserAgent(userAgent);

  if (!userAgent && !allowMissing) {
    return {
      valid: false,
      error: 'User-Agent header required',
      statusCode: 400,
    };
  }

  if (!result.allowed) {
    return {
      valid: false,
      error: 'Request blocked',
      statusCode: 403,
    };
  }

  if (result.riskScore >= blockThreshold) {
    return {
      valid: false,
      error: 'Suspicious request detected',
      statusCode: 403,
    };
  }

  return { valid: true };
}
