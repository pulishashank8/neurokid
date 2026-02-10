import { NextResponse } from 'next/server';
import { withApiHandler, AuthenticatedRequest } from '@/lib/api';
import { AIJobQueue } from '@/lib/queue/ai-job-queue';

// GET /api/ai/jobs/[id] - Get job status for polling
export const GET = withApiHandler(
  async (request: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
    const params = await context?.params;
    if (!params?.id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }
    const { id } = params;
    const userId = request.session.user.id;

    // Get job status - users can only see their own jobs
    const job = await AIJobQueue.getStatus(id, userId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Calculate estimated wait time based on queue position
    let estimatedWaitSeconds: number | undefined;
    if (job.status === 'pending') {
      const pendingCount = await AIJobQueue.getPendingCountBefore(job.id);
      estimatedWaitSeconds = pendingCount * 5; // ~5 seconds per job
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      result: job.status === 'completed' ? job.result : undefined,
      error: job.status === 'failed' ? job.error : undefined,
      retryCount: job.retryCount,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      estimatedWaitSeconds,
    });
  },
  {
    method: 'GET',
    routeName: 'GET /api/ai/jobs/[id]',
    requireAuth: true,
    rateLimit: 'readPost',
  }
);
