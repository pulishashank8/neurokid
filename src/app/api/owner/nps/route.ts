/**
 * GET /api/owner/nps
 * NPS metrics for owner dashboard - score, breakdown, trend
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getNPSMetrics } from '@/lib/owner/feedback';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'month') as 'day' | 'week' | 'month';

    const [current, previous, trendData] = await Promise.all([
      getNPSMetrics({ period }),
      (async () => {
        const hours = period === 'day' ? 48 : period === 'week' ? 336 : 1440;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        const feedbacks = await prisma.userFeedback.findMany({
          where: {
            type: 'NPS',
            rating: { not: null },
            createdAt: { gte: since },
          },
          select: { rating: true, createdAt: true },
        });
        const midpoint = new Date(Date.now() - (hours / 2) * 60 * 60 * 1000);
        const prevRatings = feedbacks.filter((f) => f.createdAt < midpoint).map((f) => f.rating!);
        const prev =
          prevRatings.length > 0
            ? (() => {
                let p = 0,
                  d = 0;
                for (const r of prevRatings) {
                  if (r >= 9) p++;
                  else if (r <= 6) d++;
                }
                return Math.round((p / prevRatings.length) * 100 - (d / prevRatings.length) * 100);
              })()
            : null;
        return prev;
      })(),
      (async () => {
        const days = 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const feedbacks = await prisma.userFeedback.findMany({
          where: { type: 'NPS', rating: { not: null }, createdAt: { gte: since } },
          select: { rating: true, createdAt: true },
        });
        const byDay: Record<string, number[]> = {};
        for (const f of feedbacks) {
          const d = f.createdAt.toISOString().slice(0, 10);
          if (!byDay[d]) byDay[d] = [];
          byDay[d].push(f.rating!);
        }
        return Object.entries(byDay)
          .map(([date, ratings]) => {
            let p = 0,
              d = 0;
            for (const r of ratings) {
              if (r >= 9) p++;
              else if (r <= 6) d++;
            }
            const score = ratings.length > 0 ? Math.round((p / ratings.length) * 100 - (d / ratings.length) * 100) : 0;
            return { date, score, count: ratings.length };
          })
          .sort((a, b) => a.date.localeCompare(b.date));
      })(),
    ]);

    const scoreChange =
      previous !== null && current.total > 0 ? current.score - previous : null;

    return NextResponse.json({
      score: current.score,
      promoters: current.promoters,
      passives: current.passives,
      detractors: current.detractors,
      total: current.total,
      scoreChange,
      trend: trendData,
    });
  } catch (err) {
    console.error('[owner/nps]', err);
    return NextResponse.json({ error: 'Failed to fetch NPS' }, { status: 500 });
  }
}
