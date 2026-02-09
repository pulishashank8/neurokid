/**
 * API Versions Endpoint
 * 
 * GET /api/versions - List all available API versions
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/api/handler';
import {
  API_VERSIONS,
  DEFAULT_API_VERSION,
  LATEST_STABLE_VERSION,
} from '@/middleware/api-version';
import { ApiResponse } from '@/lib/api/response';

/**
 * GET /api/versions
 * List all available API versions
 */
export const GET = withApiHandler(
  async (request) => {
    const versions = Object.values(API_VERSIONS).map(v => ({
      id: v.id,
      path: v.path,
      status: v.status,
      releasedAt: v.releasedAt,
      sunsetDate: v.sunsetDate,
      isDefault: v.isDefault,
      documentationUrl: `/api/docs?version=${v.id}`,
    }));

    return ApiResponse.success({
      versions,
      defaultVersion: DEFAULT_API_VERSION,
      latestStableVersion: LATEST_STABLE_VERSION,
    }, {
      requestId: request.headers.get('x-request-id') || undefined,
    });
  },
  {
    method: 'GET',
    routeName: 'api-versions',
  }
);
