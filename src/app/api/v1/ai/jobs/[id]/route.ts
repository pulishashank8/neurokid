/**
 * AI Job Status API v1
 * 
 * Poll for async AI chat results
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { AIJobQueue } from "@/lib/queue/ai-job-queue";
import { withApiHandler } from "@/lib/api/api-handler";
import { enforceRateLimit, RateLimits } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/ai/jobs/[id]
 * Get job status and result
 */
export const GET = withApiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit polling
    const rateLimitResponse = await enforceRateLimit(
      RateLimits.aiChat,
      `${session.user.id}:poll`
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await context.params;
    const job = await AIJobQueue.getStatus(id, session.user.id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Return appropriate response based on status
    switch (job.status) {
      case "completed":
        const strippedResult = job.result?.replace(/\*\*([^*]+)\*\*/g, "$1") ?? job.result;
        return NextResponse.json({
          status: "completed",
          result: strippedResult,
          completedAt: job.completedAt,
        });

      case "failed":
        return NextResponse.json(
          {
            status: "failed",
            error: job.error || "Processing failed",
            completedAt: job.completedAt,
          },
          { status: 500 }
        );

      case "processing":
        return NextResponse.json(
          {
            status: "processing",
            startedAt: job.startedAt,
            retryCount: job.retryCount,
          },
          {
            status: 202,
            headers: {
              // Suggest client retry after 2 seconds
              "Retry-After": "2",
            },
          }
        );

      case "pending":
      default:
        return NextResponse.json(
          {
            status: "pending",
            createdAt: job.createdAt,
          },
          {
            status: 202,
            headers: {
              "Retry-After": "2",
            },
          }
        );
    }
  },
  {
    routeName: "GET /api/v1/ai/jobs/[id]",
  }
);
