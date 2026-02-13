import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { format } from 'date-fns';

const RANGE_HOURS: Record<string, number> = {
  '24': 24,
  '168': 168,
  '720': 720,
  '8760': 8760,
};

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const hoursParam = searchParams.get('hours') ?? '720';
    const hours = RANGE_HOURS[hoursParam] ?? 720;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [events, pageViews] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since } },
        select: { eventType: true, featureName: true, userId: true, createdAt: true },
      }),
      prisma.pageView.findMany({
        where: { createdAt: { gte: since } },
        select: { duration: true },
      }),
    ]);

    // Get user emails for events with userId
    const userIds = [...new Set(events.map((e) => e.userId).filter(Boolean))] as string[];
    const usersById = new Map<string, string>();
    if (userIds.length > 0) {
      const userList = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true },
      });
      for (const u of userList) {
        usersById.set(u.id, u.email);
      }
    }

    const byFeature: Record<string, number> = {};
    const byHour: Record<number, number> = {};
    const byUser: Record<string, number> = {};
    const byDate: Record<string, number> = {};
    const uniqueUsers = new Set<string>();
    const returningUsers = new Set<string>();
    const userFirstSeen = new Map<string, string>();

    for (const e of events) {
      const feat = e.featureName || e.eventType || 'other';
      byFeature[feat] = (byFeature[feat] || 0) + 1;
      byHour[e.createdAt.getHours()] = (byHour[e.createdAt.getHours()] || 0) + 1;
      const dateStr = format(e.createdAt, 'yyyy-MM-dd');
      byDate[dateStr] = (byDate[dateStr] || 0) + 1;

      if (e.userId) {
        byUser[e.userId] = (byUser[e.userId] || 0) + 1;
        uniqueUsers.add(e.userId);
        const first = userFirstSeen.get(e.userId);
        if (!first) userFirstSeen.set(e.userId, dateStr);
        else if (first !== dateStr) returningUsers.add(e.userId);
      }
    }

    // All features, sorted by count descending
    const mostUsedFeatures = Object.entries(byFeature)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    const mostFrequentUsers = Object.entries(byUser)
      .sort(([, a], [, b]) => b - a)
      .map(([userId, count]) => ({ userId, count, email: usersById.get(userId) ?? null }));

    const peakHeatmap = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: byHour[h] || 0,
    }));

    // Engagement trend over time (daily events)
    const sortedDates = Object.keys(byDate).sort();
    const engagementTrend = sortedDates.map((date) => ({ date, count: byDate[date] }));

    let avgSessionDuration = 0;
    if (pageViews.length > 0) {
      const totalMs = pageViews.reduce((s, p) => s + (p.duration || 0), 0);
      avgSessionDuration = Math.round(totalMs / pageViews.length / 60000);
    }

    return NextResponse.json({
      mostUsedFeatures,
      mostFrequentUsers,
      engagementTrend,
      avgSessionDuration,
      uniqueUsersCount: uniqueUsers.size,
      returningUsersCount: returningUsers.size,
      newUsersCount: Math.max(0, uniqueUsers.size - returningUsers.size),
      peakUsageHeatmap: peakHeatmap,
      totalEvents: events.length,
      hours,
    });
  } catch (error) {
    console.error('[Engagement] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch engagement' }, { status: 500 });
  }
}
