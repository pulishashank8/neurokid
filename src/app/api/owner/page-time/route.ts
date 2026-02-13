import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const daysBack = Math.min(90, Math.max(7, parseInt(searchParams.get('days') ?? '30', 10)));
    const since = subDays(new Date(), daysBack);

    const [pageViews, clickCounts] = await Promise.all([
      prisma.pageView.findMany({
        where: { createdAt: { gte: since } },
        select: { pagePath: true, duration: true, scrollDepth: true },
      }),
      prisma.clickEvent.groupBy({
        by: ['pagePath'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
    ]);

    const byPath = new Map<
      string,
      { pagePath: string; totalDuration: number; views: number; avgScroll: number; clicks: number }
    >();

    for (const pv of pageViews) {
      const existing = byPath.get(pv.pagePath) ?? {
        pagePath: pv.pagePath,
        totalDuration: 0,
        views: 0,
        avgScroll: 0,
        clicks: 0,
      };
      existing.totalDuration += pv.duration || 0;
      existing.views += 1;
      if (pv.scrollDepth != null) {
        existing.avgScroll =
          (existing.avgScroll * (existing.views - 1) + pv.scrollDepth) / existing.views;
      }
      byPath.set(pv.pagePath, existing);
    }

    for (const c of clickCounts) {
      const existing = byPath.get(c.pagePath);
      if (existing) existing.clicks = c._count.id;
      else byPath.set(c.pagePath, { pagePath: c.pagePath, totalDuration: 0, views: 0, avgScroll: 0, clicks: c._count.id });
    }

    const pageTimeData = Array.from(byPath.values())
      .map((p) => ({
        ...p,
        avgDuration: p.views > 0 ? Math.round(p.totalDuration / p.views) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    return NextResponse.json({ pageTimeData });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Owner PageTime] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page-time data', detail: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    );
  }
}
