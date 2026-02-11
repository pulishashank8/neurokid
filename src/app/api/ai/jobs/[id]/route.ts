import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AIJobQueue } from "@/lib/queue/ai-job-queue";
import { withApiHandler } from "@/lib/api/apiHandler";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withApiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const job = await AIJobQueue.getStatus(id, session.user.id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    switch (job.status) {
      case "completed":
        // Strip markdown bold (**text**) from AI output for cleaner display
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
          { status: 202, headers: { "Retry-After": "2" } }
        );

      case "pending":
      default:
        return NextResponse.json(
          { status: "pending", createdAt: job.createdAt },
          { status: 202, headers: { "Retry-After": "2" } }
        );
    }
  },
  { routeName: "GET /api/ai/jobs/[id]" }
);
