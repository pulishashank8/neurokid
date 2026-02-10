/**
 * API Version Middleware
 * 
 * Handles API versioning via:
 * 1. X-API-Version header (preferred)
 * 2. URL path version (/api/v1/, /api/v2/)
 * 3. Defaults to latest stable version
 * 
 * Adds version headers to all responses including deprecation warnings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

// ============================================================================
// Version Configuration
// ============================================================================

export interface ApiVersion {
  /** Version identifier (YYYY-MM-DD format) */
  id: string;
  /** URL path prefix (e.g., 'v1', 'v2') */
  path: string;
  /** Version status */
  status: 'beta' | 'stable' | 'deprecated' | 'sunset';
  /** Release date */
  releasedAt: string;
  /** Sunset date (when version will be retired) */
  sunsetDate?: string;
  /** Whether this is the default version */
  isDefault: boolean;
}

/** Available API versions */
export const API_VERSIONS: Record<string, ApiVersion> = {
  '2024-01-15': {
    id: '2024-01-15',
    path: 'v1',
    status: 'stable',
    releasedAt: '2024-01-15',
    sunsetDate: '2025-07-15',
    isDefault: true,
  },
  '2025-01-15': {
    id: '2025-01-15',
    path: 'v2',
    status: 'beta',
    releasedAt: '2025-01-15',
    isDefault: false,
  },
};

/** Default version when none specified */
export const DEFAULT_API_VERSION = '2024-01-15';

/** Latest stable version */
export const LATEST_STABLE_VERSION = '2024-01-15';

// ============================================================================
// Version Resolution
// ============================================================================

export interface VersionResolution {
  version: ApiVersion;
  source: 'header' | 'path' | 'default';
  isDeprecated: boolean;
  daysUntilSunset?: number;
}

/**
 * Resolve API version from request
 */
export function resolveApiVersion(request: NextRequest): VersionResolution {
  const logger = createLogger({ component: 'ApiVersionMiddleware' });
  
  // 1. Check X-API-Version header (highest priority)
  const headerVersion = request.headers.get('x-api-version');
  if (headerVersion && API_VERSIONS[headerVersion]) {
    const version = API_VERSIONS[headerVersion];
    logger.debug({ version: headerVersion, source: 'header' }, 'API version resolved from header');
    return createResolution(version, 'header');
  }

  // 2. Check URL path for version prefix
  const url = request.nextUrl;
  const pathMatch = url.pathname.match(/^\/api\/(v\d+)\//);
  if (pathMatch) {
    const pathVersion = Object.values(API_VERSIONS).find(v => v.path === pathMatch[1]);
    if (pathVersion) {
      logger.debug({ version: pathVersion.id, source: 'path' }, 'API version resolved from path');
      return createResolution(pathVersion, 'path');
    }
  }

  // 3. Default to latest stable version
  const defaultVersion = API_VERSIONS[DEFAULT_API_VERSION];
  logger.debug({ version: defaultVersion.id, source: 'default' }, 'API version resolved to default');
  return createResolution(defaultVersion, 'default');
}

function createResolution(version: ApiVersion, source: 'header' | 'path' | 'default'): VersionResolution {
  const isDeprecated = version.status === 'deprecated' || version.status === 'sunset';
  
  let daysUntilSunset: number | undefined;
  if (version.sunsetDate) {
    const sunset = new Date(version.sunsetDate);
    const now = new Date();
    daysUntilSunset = Math.ceil((sunset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    version,
    source,
    isDeprecated,
    daysUntilSunset,
  };
}

// ============================================================================
// Version Validation
// ============================================================================

/**
 * Check if a version identifier is valid
 */
export function isValidApiVersion(version: string): boolean {
  return version in API_VERSIONS;
}

/**
 * Get version by path (e.g., 'v1' -> '2024-01-15')
 */
export function getVersionByPath(path: string): ApiVersion | undefined {
  return Object.values(API_VERSIONS).find(v => v.path === path);
}

/**
 * Get all available versions
 */
export function getAvailableVersions(): ApiVersion[] {
  return Object.values(API_VERSIONS);
}

/**
 * Get version info for a specific version
 */
export function getVersionInfo(versionId: string): ApiVersion | undefined {
  return API_VERSIONS[versionId];
}

// ============================================================================
// Header Management
// ============================================================================

export interface VersionHeaders {
  'X-API-Version': string;
  'X-API-Deprecation': string;
  'X-API-Sunset-Date'?: string;
  'Warning'?: string;
}

/**
 * Generate version-related response headers
 */
export function generateVersionHeaders(resolution: VersionResolution): VersionHeaders {
  const headers: VersionHeaders = {
    'X-API-Version': resolution.version.id,
    'X-API-Deprecation': String(resolution.isDeprecated),
  };

  if (resolution.version.sunsetDate) {
    headers['X-API-Sunset-Date'] = resolution.version.sunsetDate;
  }

  // Add Warning header for deprecated versions
  if (resolution.isDeprecated && resolution.daysUntilSunset !== undefined) {
    const latestVersion = Object.values(API_VERSIONS).find(v => v.status === 'stable' && !v.isDefault);
    const migrationTarget = latestVersion?.id || LATEST_STABLE_VERSION;
    
    headers['Warning'] = `299 - "API version ${resolution.version.id} is ${resolution.version.status}. ` +
      `Migrate to ${migrationTarget} by ${resolution.version.sunsetDate}. ` +
      `${resolution.daysUntilSunset} days remaining."`;
  }

  return headers;
}

// ============================================================================
// Middleware
// ============================================================================

export const API_VERSION_CONFIG = {
  /** Paths that should have version headers */
  matcher: ['/api/:path*'],
  
  /** Paths to exclude from versioning */
  excludedPaths: [
    '/api/health',
    '/api/health/:path*',
    '/api/docs',
    '/api/auth/:path*',
  ],
};

/**
 * Check if path should be excluded from version handling
 */
export function shouldExcludePath(pathname: string): boolean {
  return API_VERSION_CONFIG.excludedPaths.some(pattern => {
    // Simple pattern matching
    if (pattern.includes(':path*')) {
      const base = pattern.replace('/:path*', '');
      return pathname.startsWith(base);
    }
    return pathname === pattern;
  });
}

/**
 * API Version Middleware
 * 
 * Usage in middleware.ts:
 * ```typescript
 * import { apiVersionMiddleware } from './middleware/api-version';
 * 
 * export async function middleware(request: NextRequest) {
 *   // ... other middleware
 *   
 *   const response = await apiVersionMiddleware(request);
 *   if (response) return response;
 *   
 *   // ... continue to next middleware
 * }
 * ```
 */
export async function apiVersionMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip excluded paths
  if (shouldExcludePath(request.nextUrl.pathname)) {
    return null;
  }

  // Resolve version for this request
  const resolution = resolveApiVersion(request);
  
  // Store version info in request for later use
  (request as unknown as Record<string, unknown>).apiVersion = resolution;

  // If this is a direct middleware response, add headers
  // Otherwise, return null to continue to handler
  return null;
}

/**
 * Add version headers to response
 */
export function addVersionHeaders(
  response: NextResponse,
  resolution: VersionResolution
): NextResponse {
  const headers = generateVersionHeaders(resolution);
  
  Object.entries(headers).forEach(([key, value]) => {
    if (value !== undefined) {
      response.headers.set(key, value);
    }
  });

  return response;
}

// ============================================================================
// Route Rewriting
// ============================================================================

/**
 * Rewrite URL to versioned path if needed
 * 
 * Returns the rewritten pathname or null if no rewrite needed
 */
export function rewriteToVersionPath(
  pathname: string,
  version: ApiVersion
): string | null {
  // If already has version path, don't rewrite
  if (pathname.startsWith(`/api/${version.path}/`)) {
    return null;
  }

  // If has different version path, don't rewrite (let it 404 or handle separately)
  const versionPathMatch = pathname.match(/^\/api\/(v\d+)\//);
  if (versionPathMatch) {
    const requestedVersion = getVersionByPath(versionPathMatch[1]);
    if (requestedVersion && requestedVersion.id !== version.id) {
      return null; // Different version requested explicitly
    }
  }

  // Rewrite /api/xxx to /api/{versionPath}/xxx
  const newPath = pathname.replace(/^\/api\//, `/api/${version.path}/`);
  return newPath === pathname ? null : newPath;
}

// ============================================================================
// Version Analytics
// ============================================================================

interface VersionUsageMetrics {
  version: string;
  requestCount: number;
  uniqueClients: Set<string>;
  deprecatedRequests: number;
}

/** In-memory metrics (in production, use Redis/DB) */
const versionMetrics: Map<string, VersionUsageMetrics> = new Map();

/**
 * Track API version usage
 */
export function trackVersionUsage(
  resolution: VersionResolution,
  clientId?: string
): void {
  const versionId = resolution.version.id;
  
  if (!versionMetrics.has(versionId)) {
    versionMetrics.set(versionId, {
      version: versionId,
      requestCount: 0,
      uniqueClients: new Set(),
      deprecatedRequests: 0,
    });
  }

  const metrics = versionMetrics.get(versionId)!;
  metrics.requestCount++;
  
  if (clientId) {
    metrics.uniqueClients.add(clientId);
  }
  
  if (resolution.isDeprecated) {
    metrics.deprecatedRequests++;
  }
}

/**
 * Get version usage metrics
 */
export function getVersionMetrics(): Array<{
  version: string;
  requestCount: number;
  uniqueClientCount: number;
  deprecatedRequests: number;
}> {
  return Array.from(versionMetrics.values()).map(m => ({
    version: m.version,
    requestCount: m.requestCount,
    uniqueClientCount: m.uniqueClients.size,
    deprecatedRequests: m.deprecatedRequests,
  }));
}

/**
 * Reset metrics (for testing)
 */
export function resetVersionMetrics(): void {
  versionMetrics.clear();
}
