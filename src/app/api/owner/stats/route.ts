import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subDays, startOfDay, format } from 'date-fns';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'growth': {
        const daysParam = searchParams.get('days');
        const days = Math.min(90, Math.max(7, daysParam ? parseInt(daysParam, 10) || 30 : 30));
        const startDate = startOfDay(subDays(new Date(), days));
        
        const users = await prisma.user.findMany({
          where: { createdAt: { gte: startDate } },
          select: { createdAt: true },
        });

        const posts = await prisma.post.findMany({
          where: { createdAt: { gte: startDate } },
          select: { createdAt: true },
        });

        const comments = await prisma.comment.findMany({
          where: { createdAt: { gte: startDate } },
          select: { createdAt: true },
        });

        const dailyData: Record<string, { users: number; posts: number; comments: number }> = {};
        
        for (let i = 0; i <= days; i++) {
          const date = format(subDays(new Date(), days - i), 'yyyy-MM-dd');
          dailyData[date] = { users: 0, posts: 0, comments: 0 };
        }

        users.forEach(u => {
          const date = format(u.createdAt, 'yyyy-MM-dd');
          if (dailyData[date]) dailyData[date].users++;
        });

        posts.forEach(p => {
          const date = format(p.createdAt, 'yyyy-MM-dd');
          if (dailyData[date]) dailyData[date].posts++;
        });

        comments.forEach(c => {
          const date = format(c.createdAt, 'yyyy-MM-dd');
          if (dailyData[date]) dailyData[date].comments++;
        });

        const chartData = Object.entries(dailyData).map(([date, data]) => ({
          date,
          ...data,
        }));

        return NextResponse.json({ chartData });
      }

      case 'screening': {
        const screenings = await prisma.screeningResult.groupBy({
          by: ['screeningType', 'riskLevel'],
          _count: { id: true },
        });

        const totalScreenings = await prisma.screeningResult.count();
        const screeningsByType = await prisma.screeningResult.groupBy({
          by: ['screeningType'],
          _count: { id: true },
        });

        return NextResponse.json({ 
          screenings, 
          totalScreenings,
          screeningsByType,
        });
      }

      case 'providers': {
        const totalProviders = await prisma.provider.count();
        const verifiedProviders = await prisma.provider.count({ where: { isVerified: true } });
        const totalReviews = await prisma.providerReview.count();
        
        const topProviders = await prisma.provider.findMany({
          orderBy: { totalReviews: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            rating: true,
            totalReviews: true,
            isVerified: true,
          },
        });

        return NextResponse.json({ 
          totalProviders, 
          verifiedProviders, 
          totalReviews,
          topProviders,
        });
      }

      case 'searches': {
        const recentSearches = await prisma.searchQuery.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: { user: { include: { profile: true } } },
        });

        const searchesByType = await prisma.searchQuery.groupBy({
          by: ['searchType'],
          _count: { id: true },
        });

        const topQueries = await prisma.$queryRaw`
          SELECT query, COUNT(*) as count 
          FROM "SearchQuery" 
          GROUP BY query 
          ORDER BY count DESC 
          LIMIT 20
        ` as { query: string; count: bigint }[];

        return NextResponse.json({ 
          recentSearches,
          searchesByType,
          topQueries: topQueries.map(q => ({ query: q.query, count: Number(q.count) })),
        });
      }

      case 'online': {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const todayStart = startOfDay(now);

        const onlineSessions = await prisma.userSession.findMany({
          where: { lastActiveAt: { gte: fiveMinutesAgo } },
          include: { user: { include: { profile: true } } },
          orderBy: { lastActiveAt: 'desc' },
        });

        const [recentLogins, recentLoginsTodayCount] = await Promise.all([
          prisma.user.findMany({
            where: { lastLoginAt: { not: null } },
            orderBy: { lastLoginAt: 'desc' },
            take: 20,
            include: { profile: true },
          }),
          prisma.user.count({
            where: { lastLoginAt: { gte: todayStart } },
          }),
        ]);

        return NextResponse.json({ 
          onlineCount: onlineSessions.length,
          onlineSessions,
          recentLogins,
          recentLoginsTodayCount,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid stats type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
