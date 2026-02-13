import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subMinutes } from 'date-fns';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const fiveMinAgo = subMinutes(now, 5);

    const [
      activeUsersNow,
      aiRequestsLast5m,
      messagesLast5m,
      failedAILast5m,
      totalAILast5m,
    ] = await Promise.all([
      prisma.userSession.count({
        where: { lastActiveAt: { gte: subMinutes(now, 5) } },
      }),
      prisma.aIUsageLog.count({ where: { createdAt: { gte: fiveMinAgo } } }) +
        prisma.aIJob.count({ where: { createdAt: { gte: fiveMinAgo } } }),
      prisma.message.count({ where: { createdAt: { gte: fiveMinAgo } } }),
      prisma.aIJob.count({
        where: { status: 'failed', completedAt: { gte: fiveMinAgo } },
      }),
      prisma.aIUsageLog.count({ where: { createdAt: { gte: fiveMinAgo } } }) +
        prisma.aIJob.count({ where: { createdAt: { gte: fiveMinAgo } } }),
    ]);

    const errorRate = totalAILast5m > 0 ? (failedAILast5m / totalAILast5m) * 100 : 0;

    return NextResponse.json({
      activeUsersNow,
      aiRequestsLast5m,
      messagesPerMinute: Math.round(messagesLast5m / 5),
      errorRateLast5m: Math.round(errorRate * 100) / 100,
    });
  } catch (error) {
    console.error('[Live KPIs] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch live KPIs' }, { status: 500 });
  }
}
