import { NextRequest } from 'next/server';
import { getToken, JWT } from 'next-auth/jwt';
import { AIJobQueue } from '@/lib/queue/ai-job-queue';
import { RateLimits } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

// Extended JWT type with sub claim
interface ExtendedJWT extends JWT {
  sub?: string;
}

const logger = createLogger({ context: 'AIChatStream' });

/**
 * GET /api/ai/chat/stream - Server-Sent Events for real-time AI responses
 * 
 * Streams job status updates to the client:
 * - pending: Job is queued, waiting to be processed
 * - processing: AI is generating response
 * - completed: Response is ready (includes result)
 * - failed: Job failed (includes error)
 */
export async function GET(request: NextRequest) {
  // Authenticate request
  const token = await getToken({ req: request }) as ExtendedJWT | null;
  if (!token?.sub) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const userId = token.sub;
  const jobId = request.nextUrl.searchParams.get('jobId');

  if (!jobId) {
    return new Response(
      JSON.stringify({ error: 'Job ID is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Rate limit check - use readPost limiter for polling (60/min)
  const rateLimitResult = await RateLimits.readPost.check(userId);

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Set up SSE response
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;
      let pollInterval: NodeJS.Timeout;

      const closeStream = () => {
        if (!isClosed) {
          isClosed = true;
          clearInterval(pollInterval);
          controller.close();
        }
      };

      // Send initial connection message
      controller.enqueue(encoder.encode('event: connected\ndata: {"message": "Stream connected"}\n\n'));

      // Poll for job status
      const pollJobStatus = async () => {
        try {
          const job = await AIJobQueue.getStatus(jobId, userId);

          if (!job) {
            controller.enqueue(encoder.encode(`event: error\ndata: {"error": "Job not found"}\n\n`));
            closeStream();
            return;
          }

          // Send status update
          const statusData = {
            status: job.status,
            retryCount: job.retryCount,
            updatedAt: job.updatedAt.toISOString(),
          };

          controller.enqueue(encoder.encode(`event: status\ndata: ${JSON.stringify(statusData)}\n\n`));

          // Handle completed job
          if (job.status === 'completed' && job.result) {
            const resultData = {
              status: 'completed',
              result: job.result,
              completedAt: job.completedAt?.toISOString(),
            };
            controller.enqueue(encoder.encode(`event: complete\ndata: ${JSON.stringify(resultData)}\n\n`));
            logger.info({ jobId, userId }, 'AI stream completed');
            closeStream();
            return;
          }

          // Handle failed job
          if (job.status === 'failed') {
            const errorData = {
              status: 'failed',
              error: job.error || 'Unknown error',
              retryCount: job.retryCount,
            };
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(errorData)}\n\n`));
            logger.warn({ jobId, userId, error: job.error }, 'AI stream failed');
            closeStream();
            return;
          }
        } catch (error) {
          logger.error({ jobId, error }, 'Error polling job status');
          controller.enqueue(encoder.encode(`event: error\ndata: {"error": "Internal error"}\n\n`));
          closeStream();
        }
      };

      // Poll immediately and then every 1 second
      await pollJobStatus();
      if (!isClosed) {
        pollInterval = setInterval(pollJobStatus, 1000);
      }

      // Close stream after 2 minutes (safety timeout)
      setTimeout(() => {
        if (!isClosed) {
          controller.enqueue(encoder.encode(`event: timeout\ndata: {"message": "Stream timeout"}\n\n`));
          closeStream();
        }
      }, 2 * 60 * 1000);
    },

    cancel() {
      // Clean up when client disconnects
      logger.debug({ jobId }, 'Client disconnected from stream');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
