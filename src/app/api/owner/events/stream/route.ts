/**
 * SSE stream for real-time dashboard events
 * Admin-only; streams events from in-memory buffer + DB fallback when buffer is empty
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subscribeToEvents, getRecentEvents } from '@/lib/owner/event-bus';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // client disconnected
        }
      };

      let recent = getRecentEvents(30);
      if (recent.length === 0) {
        try {
          const fromRealtime = await prisma.realtimeEvent.findMany({
            orderBy: { createdAt: 'desc' },
            take: 30,
            select: { eventType: true, entityType: true, entityId: true, createdAt: true },
          });
          if (fromRealtime.length > 0) {
            recent = fromRealtime.map((e) => ({
              eventType: e.eventType,
              entityType: e.entityType,
              entityId: e.entityId ?? undefined,
              createdAt: e.createdAt.toISOString(),
            }));
          } else {
            const fromAnalytics = await prisma.analyticsEvent.findMany({
              orderBy: { createdAt: 'desc' },
              take: 60,
              select: { eventType: true, featureName: true, createdAt: true },
            });
            const mapped = fromAnalytics.map((e) => ({
              eventType: e.eventType,
              entityType: e.featureName ?? e.eventType,
              entityId: undefined,
              createdAt: e.createdAt.toISOString(),
            }));
            const seen = new Set<string>();
            recent = mapped.filter((e) => {
              const min = new Date(e.createdAt).setSeconds(0, 0);
              const key = `${e.eventType}:${e.entityType}:${min}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            }).slice(0, 30);
          }
        } catch (e) {
          console.error('[Events Stream] DB fallback error:', e);
        }
      }

      if (recent.length > 0) {
        send(JSON.stringify({ type: 'init', events: recent }));
      } else {
        send(JSON.stringify({ type: 'heartbeat', ts: Date.now() }));
      }

      const unsub = subscribeToEvents((event) => {
        send(JSON.stringify({ type: 'event', ...event }));
      });

      const interval = setInterval(() => {
        send(JSON.stringify({ type: 'heartbeat', ts: Date.now() }));
      }, 15000);

      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        unsub();
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
