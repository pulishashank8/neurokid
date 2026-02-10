/**
 * Geo-Blocking Service
 * 
 * Block or allow requests based on country of origin
 * 
 * Features:
 * - Country-level blocking
 * - Whitelist mode (block all except allowed)
 * - Blacklist mode (allow all except blocked)
 * - GeoIP detection
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration - can be loaded from environment or database
const GEO_CONFIG = {
  // Mode: 'whitelist' = block all except allowed
  //       'blacklist' = allow all except blocked
  mode: (process.env.GEO_BLOCK_MODE as 'whitelist' | 'blacklist') || 'blacklist',
  
  // List of country codes (ISO 3166-1 alpha-2)
  blockedCountries: process.env.GEO_BLOCKED_COUNTRIES?.split(',') || [],
  allowedCountries: process.env.GEO_ALLOWED_COUNTRIES?.split(',') || [],
  
  // Whether to enable geo-blocking
  enabled: process.env.GEO_BLOCKING_ENABLED === 'true',
} as const;

interface GeoInfo {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface GeoCheckResult {
  allowed: boolean;
  reason?: string;
  geoInfo?: GeoInfo;
}

/**
 * Get country from IP address
 * Uses various methods depending on infrastructure (Cloudflare, AWS, etc.)
 */
export function getCountryFromRequest(request: NextRequest): GeoInfo | null {
  // Check for CDN/provider headers first
  const cfCountry = request.headers.get('cf-ipcountry'); // Cloudflare
  const awsCountry = request.headers.get('cloudfront-viewer-country'); // CloudFront
  const fastlyCountry = request.headers.get('fastly-geo-country'); // Fastly
  
  const countryCode = cfCountry || awsCountry || fastlyCountry;
  
  if (countryCode && countryCode !== 'XX') {
    return {
      country: getCountryName(countryCode),
      countryCode: countryCode.toUpperCase(),
    };
  }
  
  // Try to get additional geo info from headers
  const region = request.headers.get('cf-region') || 
                 request.headers.get('cloudfront-viewer-country-region');
  const city = request.headers.get('cf-ipcity') || 
               request.headers.get('cloudfront-viewer-city');
  
  if (countryCode) {
    return {
      country: getCountryName(countryCode),
      countryCode: countryCode.toUpperCase(),
      region: region || undefined,
      city: city || undefined,
    };
  }
  
  return null;
}

/**
 * Check if country is allowed
 */
export function checkGeoAccess(countryCode: string | null): GeoCheckResult {
  if (!GEO_CONFIG.enabled) {
    return { allowed: true };
  }
  
  if (!countryCode) {
    // If we can't determine country, allow but log
    return { 
      allowed: true,
      reason: 'Unknown country - allowing',
    };
  }
  
  const code = countryCode.toUpperCase();
  
  if (GEO_CONFIG.mode === 'whitelist') {
    // Only allow countries in the allowed list
    if (GEO_CONFIG.allowedCountries.includes(code)) {
      return { allowed: true, geoInfo: { country: getCountryName(code), countryCode: code } };
    }
    return { 
      allowed: false, 
      reason: `Country ${code} not in allowed list`,
      geoInfo: { country: getCountryName(code), countryCode: code },
    };
  } else {
    // Blacklist mode - block only listed countries
    if (GEO_CONFIG.blockedCountries.includes(code)) {
      return { 
        allowed: false, 
        reason: `Country ${code} is blocked`,
        geoInfo: { country: getCountryName(code), countryCode: code },
      };
    }
    return { allowed: true, geoInfo: { country: getCountryName(code), countryCode: code } };
  }
}

/**
 * Middleware for geo-blocking
 */
export function geoBlockMiddleware(request: NextRequest): NextResponse | null {
  if (!GEO_CONFIG.enabled) return null;
  
  const geoInfo = getCountryFromRequest(request);
  const result = checkGeoAccess(geoInfo?.countryCode || null);
  
  if (!result.allowed) {
    console.warn('[GEO-BLOCK] Blocked request:', {
      country: geoInfo?.countryCode,
      path: request.nextUrl.pathname,
      reason: result.reason,
    });
    
    return new NextResponse(
      JSON.stringify({
        error: 'Access denied from your location',
        code: 'GEO_BLOCKED',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  return null;
}

/**
 * Get geo info for logging/display
 */
export function getGeoInfo(request: NextRequest): GeoInfo | null {
  return getCountryFromRequest(request);
}

/**
 * Check if geo-blocking is configured
 */
export function isGeoBlockingEnabled(): boolean {
  return GEO_CONFIG.enabled;
}

/**
 * Get geo-blocking configuration (for admin)
 */
export function getGeoConfig(): {
  enabled: boolean;
  mode: string;
  blockedCount: number;
  allowedCount: number;
} {
  return {
    enabled: GEO_CONFIG.enabled,
    mode: GEO_CONFIG.mode,
    blockedCount: GEO_CONFIG.blockedCountries.length,
    allowedCount: GEO_CONFIG.allowedCountries.length,
  };
}

/**
 * Country code to name mapping (simplified)
 */
function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    'US': 'United States',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'JP': 'Japan',
    'CN': 'China',
    'RU': 'Russia',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'KP': 'North Korea',
    'IR': 'Iran',
    'SY': 'Syria',
    'CU': 'Cuba',
    'XX': 'Unknown',
  };
  
  return countries[code.toUpperCase()] || code;
}

export { GEO_CONFIG };
export type { GeoInfo, GeoCheckResult };
