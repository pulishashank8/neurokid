import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subDays, subMonths, startOfDay, startOfMonth, format } from 'date-fns';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') ?? 'day'; // day | month | year
    const days = range === 'day' ? 30 : range === 'month' ? 365 : 730;
    const startDate = startOfDay(subDays(new Date(), days));

    const [users, posts, categories, searchQueries] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      prisma.post.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          createdAt: true,
          categoryId: true,
          category: { select: { name: true } },
        },
      }),
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.searchQuery.findMany({
        where: { createdAt: { gte: startDate } },
        select: { query: true },
      }),
    ]);

    const dailySignups: Record<string, number> = {};
    const monthlySignups: Record<string, number> = {};
    const yearlySignups: Record<string, number> = {};

    if (range === 'day') {
      for (let i = 0; i <= Math.min(days, 90); i++) {
        const d = format(subDays(new Date(), Math.min(days, 90) - i), 'yyyy-MM-dd');
        dailySignups[d] = 0;
      }
      users.forEach((u) => {
        const d = format(u.createdAt, 'yyyy-MM-dd');
        if (dailySignups[d] !== undefined) dailySignups[d]++;
      });
    }

    const monthsToShow = range === 'year' ? 24 : 12;
    if (range === 'month' || range === 'year') {
      for (let i = 0; i < monthsToShow; i++) {
        const m = startOfMonth(subMonths(new Date(), monthsToShow - 1 - i));
        const key = format(m, 'yyyy-MM');
        monthlySignups[key] = 0;
        yearlySignups[key] = 0;
      }
      users.forEach((u) => {
        const m = format(startOfMonth(u.createdAt), 'yyyy-MM');
        if (monthlySignups[m] !== undefined) monthlySignups[m]++;
        if (yearlySignups[m] !== undefined) yearlySignups[m]++;
      });
    }

    const weeklySignups: Record<string, number> = {};
    for (let w = 3; w >= 0; w--) {
      const wkStart = startOfDay(subDays(new Date(), w * 7));
      const wkEnd = subDays(wkStart, -7);
      weeklySignups[format(wkStart, 'yyyy-MM-dd')] = users.filter(
        (u) => u.createdAt >= wkStart && u.createdAt < wkEnd
      ).length;
    }

    const categoryCounts: Record<string, number> = {};
    posts.forEach((p) => {
      const name = p.category?.name || 'Unknown';
      categoryCounts[name] = (categoryCounts[name] || 0) + 1;
    });
    const activeCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const queryCounts: Record<string, number> = {};
    searchQueries.forEach((q) => {
      const k = (q.query || '').trim().toLowerCase();
      if (k) queryCounts[k] = (queryCounts[k] || 0) + 1;
    });
    const popularKeywords = Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));

    return NextResponse.json({
      range,
      dailySignups: Object.entries(dailySignups).map(([date, count]) => ({ date, count })),
      monthlySignups: Object.entries(monthlySignups).map(([date, count]) => ({ date, count })),
      yearlySignups: Object.entries(yearlySignups).map(([date, count]) => ({ date, count })),
      weeklySignups: Object.entries(weeklySignups).map(([date, count]) => ({ date, count })),
      activeCategories,
      popularKeywords,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Growth] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch growth data', detail: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    );
  }
}
