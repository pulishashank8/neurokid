/**
 * API Version Metrics Endpoint
 * 
 * GET /api/versions/metrics - Get version usage metrics (admin only)
 */

import { withApiHandler } from '@/lib/api/handler';
import {
  API_VERSIONS,
  getVersionMetrics,
} from '@/middleware/api-version';
import { ApiResponse } from '@/lib/api/response';

/**
 * GET /api/versions/metrics
 * Get version usage metrics (admin only)
 */
export const GET = withApiHandler(
  async (request) => {
    const metrics = getVersionMetrics();
    
    // Calculate totals
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestCount, 0);
    const totalDeprecatedRequests = metrics.reduce((sum, m) => sum + m.deprecatedRequests, 0);
    
    // Enrich metrics with version info
    const enrichedMetrics = metrics.map(m => {
      const versionInfo = API_VERSIONS[m.version];
      return {
        ...m,
        status: versionInfo?.status || 'unknown',
        sunsetDate: versionInfo?.sunsetDate,
      };
    });

    return ApiResponse.success({
      metrics: enrichedMetrics,
      summary: {
        totalRequests,
        totalDeprecatedRequests,
        deprecatedPercentage: totalRequests > 0 
          ? ((totalDeprecatedRequests / totalRequests) * 100).toFixed(2) + '%'
          : '0%',
        activeVersions: Object.keys(API_VERSIONS).length,
      },
      generatedAt: new Date().toISOString(),
    }, {
      requestId: request.headers.get('x-request-id') || undefined,
    });
  },
  {
    method: 'GET',
    routeName: 'api-versions-metrics',
    requireAuth: true,
    roles: ['ADMIN', 'OWNER'],
  }
);
