/**
 * GET /api/owner/moderation/summary
 * Real report counts from database – no mock data.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subDays, startOfDay } from 'date-fns';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = startOfDay(now);
    const last7d = subDays(today, 7);

    const [
      contentPending,
      contentResolved7d,
      messagePending,
      messageResolved7d,
      postsOpen,
      commentsOpen,
      usersOpen,
    ] = await Promise.all([
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.report.count({
        where: {
          status: { in: ['RESOLVED', 'DISMISSED'] },
          updatedAt: { gte: last7d },
        },
      }),
      prisma.messageReport.count({ where: { status: 'OPEN' } }),
      prisma.messageReport.count({
        where: {
          status: { in: ['RESOLVED', 'DISMISSED'] },
          updatedAt: { gte: last7d },
        },
      }),
      prisma.report.count({ where: { status: 'OPEN', targetType: 'POST' } }),
      prisma.report.count({ where: { status: 'OPEN', targetType: 'COMMENT' } }),
      prisma.report.count({ where: { status: 'OPEN', targetType: 'USER' } }),
    ]);

    const pending = contentPending + messagePending;
    const resolved = contentResolved7d + messageResolved7d;
    const byType = {
      posts: postsOpen,
      comments: commentsOpen,
      users: usersOpen,
      messages: messagePending,
    };

    // Recent reports – content reports first
    const recentContent = await prisma.report.findMany({
      where: { status: { in: ['OPEN', 'RESOLVED', 'DISMISSED'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, targetType: true, reason: true, status: true, createdAt: true },
    });

    const recentMessage = await prisma.messageReport.findMany({
      where: { status: { in: ['OPEN', 'RESOLVED', 'DISMISSED'] } },
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: { id: true, reason: true, status: true, createdAt: true },
    });

    const recent = [
      ...recentContent.map((r) => ({
        id: r.id,
        type: r.targetType.toLowerCase(),
        reason: r.reason,
        createdAt: r.createdAt.toISOString(),
        status: r.status === 'OPEN' ? 'pending' : 'resolved',
      })),
      ...recentMessage.map((r) => ({
        id: r.id,
        type: 'message',
        reason: r.reason,
        createdAt: r.createdAt.toISOString(),
        status: r.status === 'OPEN' ? 'pending' : 'resolved',
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return NextResponse.json({
      pending,
      resolved,
      byType,
      recent,
    });
  } catch (error) {
    console.error('[Moderation Summary] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch report summary' }, { status: 500 });
  }
}
