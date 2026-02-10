import { NextResponse } from 'next/server';
import { withApiHandler, AuthenticatedRequest } from '@/lib/api';
import { AIJobQueue } from '@/lib/queue/ai-job-queue';
import { ForbiddenError } from '@/domain/errors';

/**
 * GET /api/owner/ai-jobs/dead-letter - List dead letter jobs (admin only)
 */
export const GET = withApiHandler(
  async (request: AuthenticatedRequest) => {
    // Check admin authorization
    const userRoles = request.session.user.roles || [];
    const isAdmin = userRoles.some((role: string) => 
      ['ADMIN', 'OWNER', 'MODERATOR'].includes(role)
    );

    if (!isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const userId = searchParams.get('userId') || undefined;

    // Get dead letter jobs
    const jobs = await AIJobQueue.getDeadLetterJobs({ limit, offset, userId });
    const stats = await AIJobQueue.getDeadLetterStats();

    return NextResponse.json({
      jobs,
      stats,
      pagination: {
        limit,
        offset,
        total: stats.total,
      },
    });
  },
  {
    method: 'GET',
    routeName: 'GET /api/owner/ai-jobs/dead-letter',
    requireAuth: true,
  }
);

/**
 * POST /api/owner/ai-jobs/dead-letter - Retry a dead letter job (admin only)
 */
export const POST = withApiHandler(
  async (request: AuthenticatedRequest) => {
    // Check admin authorization
    const userRoles = request.session.user.roles || [];
    const isAdmin = userRoles.some((role: string) => 
      ['ADMIN', 'OWNER', 'MODERATOR'].includes(role)
    );

    if (!isAdmin) {
      throw new ForbiddenError('Admin access required');
    }

    const body = await request.json();
    const { deadLetterId } = body;

    if (!deadLetterId) {
      return NextResponse.json(
        { error: 'deadLetterId is required' },
        { status: 400 }
      );
    }

    const result = await AIJobQueue.retryDeadLetterJob(deadLetterId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Job retry initiated',
      deadLetterId,
    });
  },
  {
    method: 'POST',
    routeName: 'POST /api/owner/ai-jobs/dead-letter',
    requireAuth: true,
  }
);
