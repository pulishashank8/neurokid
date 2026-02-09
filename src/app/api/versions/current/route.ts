/**
 * API Current Version Endpoint
 * 
 * GET /api/versions/current - Get current/default version info
 */

import { withApiHandler } from '@/lib/api/handler';
import {
  API_VERSIONS,
  DEFAULT_API_VERSION,
  LATEST_STABLE_VERSION,
  resolveApiVersion,
} from '@/middleware/api-version';
import { ApiResponse } from '@/lib/api/response';

/**
 * GET /api/versions/current
 * Get current version information
 */
export const GET = withApiHandler(
  async (request) => {
    const resolution = resolveApiVersion(request);
    const version = API_VERSIONS[DEFAULT_API_VERSION];

    return ApiResponse.success({
      current: {
        id: version.id,
        path: version.path,
        status: version.status,
        releasedAt: version.releasedAt,
        sunsetDate: version.sunsetDate,
      },
      requestedVersion: resolution.version.id,
      requestedVia: resolution.source,
      isDeprecated: resolution.isDeprecated,
      daysUntilSunset: resolution.daysUntilSunset,
      latestStableVersion: LATEST_STABLE_VERSION,
      documentationUrl: `/api/docs?version=${version.id}`,
      changelogUrl: `/api/docs/changelog?version=${version.id}`,
      migrationGuideUrl: `/api/docs/migration?from=${resolution.version.id}&to=${LATEST_STABLE_VERSION}`,
    }, {
      requestId: request.headers.get('x-request-id') || undefined,
    });
  },
  {
    method: 'GET',
    routeName: 'api-versions-current',
  }
);
