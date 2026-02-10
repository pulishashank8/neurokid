import { NextResponse } from "next/server";
import { container, TOKENS } from "@/lib/container";
import { withApiHandler, AuthenticatedRequest } from "@/lib/api";
import { ViewCountService } from "@/application/services/ViewCountService";
import { registerDependencies } from "@/lib/container-registrations";

// Ensure dependencies are registered
registerDependencies();

// POST /api/owner/view-counts/flush - Flush view counts to database
export const POST = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const viewCountService = container.resolve<ViewCountService>(TOKENS.ViewCountService);

    const result = await viewCountService.flushToDatabase();

    return NextResponse.json({
      success: true,
      flushed: result.flushed,
      errors: result.errors,
      message: `Flushed ${result.flushed} view counts to database${result.errors > 0 ? ` with ${result.errors} errors` : ''}`
    });
  },
  {
    method: 'POST',
    routeName: 'POST /api/owner/view-counts/flush',
    requireAuth: true,
    roles: ['ADMIN', 'OWNER'],
  }
);

// GET /api/owner/view-counts/flush - Get pending view count stats
export const GET = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const viewCountService = container.resolve<ViewCountService>(TOKENS.ViewCountService);

    const stats = await viewCountService.getPendingStats();

    return NextResponse.json({
      pendingPosts: stats.pendingPosts,
      totalPendingViews: stats.totalPendingViews,
    });
  },
  {
    method: 'GET',
    routeName: 'GET /api/owner/view-counts/flush',
    requireAuth: true,
    roles: ['ADMIN', 'OWNER'],
  }
);
