/**
 * CDN Header Configuration
 * 
 * Generates optimal Cache-Control headers for different asset types.
 * Used by middleware.ts for static asset caching.
 */

export interface CacheConfig {
  maxAge: number;
  staleWhileRevalidate?: number;
  immutable?: boolean;
  private?: boolean;
  noStore?: boolean;
}

/**
 * Cache configurations for different asset types
 */
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Images - cache for 1 year (immutable with hash)
  images: {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    immutable: true,
  },
  
  // Fonts - cache for 1 year (immutable with hash)
  fonts: {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    immutable: true,
  },
  
  // Static JS/CSS (Next.js hashed files) - cache for 1 year
  staticAssets: {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    immutable: true,
  },
  
  // API responses - short cache with stale-while-revalidate
  api: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 300, // 5 minutes
  },
  
  // User-generated content - moderate cache
  userContent: {
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 86400, // 24 hours
  },
  
  // HTML pages - no cache for dynamic content
  html: {
    maxAge: 0,
    noStore: true,
  },
  
  // No cache for authenticated data
  private: {
    maxAge: 0,
    private: true,
    noStore: true,
  },
};

/**
 * Generate Cache-Control header string
 */
export function generateCacheControl(config: CacheConfig): string {
  if (config.noStore) {
    return "no-store, no-cache, must-revalidate, proxy-revalidate";
  }
  
  const directives: string[] = [];
  
  if (config.private) {
    directives.push("private");
  } else {
    directives.push("public");
  }
  
  directives.push(`max-age=${config.maxAge}`);
  
  if (config.staleWhileRevalidate) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }
  
  if (config.immutable) {
    directives.push("immutable");
  }
  
  return directives.join(", ");
}

/**
 * Get cache config for a path
 */
export function getCacheConfigForPath(path: string): CacheConfig {
  // Images
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i.test(path)) {
    return CACHE_CONFIGS.images;
  }
  
  // Fonts
  if (/\.(woff|woff2|ttf|otf|eot)$/i.test(path)) {
    return CACHE_CONFIGS.fonts;
  }
  
  // Static JS/CSS with hash
  if (path.includes("/_next/static/")) {
    return CACHE_CONFIGS.staticAssets;
  }
  
  // API routes
  if (path.startsWith("/api/")) {
    return CACHE_CONFIGS.api;
  }
  
  // HTML pages
  if (path.endsWith("/") || path.endsWith(".html")) {
    return CACHE_CONFIGS.html;
  }
  
  // Default
  return CACHE_CONFIGS.userContent;
}

/**
 * Get CDN headers for a response
 */
export function getCdnHeaders(path: string): Record<string, string> {
  const config = getCacheConfigForPath(path);
  const cacheControl = generateCacheControl(config);
  
  const headers: Record<string, string> = {
    "Cache-Control": cacheControl,
  };
  
  // Add Vary header for proper CDN caching
  if (path.startsWith("/api/")) {
    headers["Vary"] = "Accept-Encoding, Authorization";
  } else {
    headers["Vary"] = "Accept-Encoding";
  }
  
  return headers;
}
