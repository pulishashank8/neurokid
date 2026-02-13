/**
 * GET /api/owner/events
 * Returns recent real-time events for the Live Activity feed.
 * Uses RealtimeEvent first, then AnalyticsEvent as fallback when empty.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getRecentEvents } from '@/lib/owner/event-bus';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') ?? '20', 10)));

    let events = getRecentEvents(limit);

    if (events.length === 0) {
      const fromRealtime = await prisma.realtimeEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { eventType: true, entityType: true, entityId: true, createdAt: true },
      });
      if (fromRealtime.length > 0) {
        events = fromRealtime.map((e) => ({
          eventType: e.eventType,
          entityType: e.entityType,
          entityId: e.entityId ?? undefined,
          createdAt: e.createdAt.toISOString(),
        }));
      }
    }

    // Fallback: use AnalyticsEvent (login, page_view, screening, etc.) when RealtimeEvent is empty
    if (events.length === 0) {
      const fromAnalytics = await prisma.analyticsEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit * 2, // fetch extra for deduplication
        select: { eventType: true, featureName: true, createdAt: true },
      });
      const mapped = fromAnalytics.map((e) => ({
        eventType: e.eventType,
        entityType: e.featureName ?? e.eventType,
        entityId: undefined,
        createdAt: e.createdAt.toISOString(),
      }));
      // Deduplicate: same type+entity within same 60-second window → keep most recent
      const seen = new Set<string>();
      events = mapped.filter((e) => {
        const min = new Date(e.createdAt).setSeconds(0, 0);
        const key = `${e.eventType}:${e.entityType}:${min}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, limit);
    }

    return NextResponse.json({ events });
  } catch (e) {
    console.error('[Owner Events] Error:', e);
    return NextResponse.json({ error: 'Failed to fetch events', events: [] }, { status: 500 });
  }
}
