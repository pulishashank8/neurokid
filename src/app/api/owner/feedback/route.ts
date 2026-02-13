/**
 * GET /api/owner/feedback
 * Owner view of all user feedback - filter by type, date range, reviewed status
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const hours = parseInt(searchParams.get('hours') || '168'); // default 7 days
    const reviewed = searchParams.get('reviewed');

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const where: Record<string, unknown> = {
      createdAt: { gte: since },
    };

    if (type) where.type = type;
    if (reviewed === 'true') where.isReviewed = true;
    if (reviewed === 'false') where.isReviewed = false;

    const [feedbacks, counts] = await Promise.all([
      prisma.userFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.userFeedback.groupBy({
        by: ['type'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
    ]);

    // Batch-fetch user emails for display
    const userIds = [...new Set(feedbacks.map((f) => f.userId))];
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true },
          })
        : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.email]));

    return NextResponse.json({
      feedbacks: feedbacks.map((f) => ({
        ...f,
        userEmail: userMap[f.userId] ?? null,
      })),
      counts: counts.reduce(
        (acc, c) => {
          acc[c.type] = c._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
    });
  } catch (err) {
    console.error('[owner/feedback]', err);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
