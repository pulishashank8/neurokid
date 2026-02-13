/**
 * GET /api/owner/briefing
 * Daily briefing metrics from real database – no fake/placeholder data.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { startOfDay, subDays } from 'date-fns';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = startOfDay(now);
    const last24h = subDays(now, 24);

    // Real counts from database – "today" = since midnight in server timezone
    const [
      newUsers,
      activeUsersToday,
      aiUsageLogToday,
      aiJobToday,
      pendingContentReports,
      pendingMessageReports,
      messagesToday,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: today } } }),
      prisma.aIUsageLog.count({ where: { createdAt: { gte: today } } }),
      prisma.aIJob.count({ where: { createdAt: { gte: today } } }),
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.messageReport.count({ where: { status: 'OPEN' } }),
      prisma.message.count({ where: { createdAt: { gte: today } } }),
    ]);

    // Errors in last 24h – ClientError table may not exist in all environments
    let errors24h = 0;
    try {
      errors24h = await prisma.clientError.count({ where: { createdAt: { gte: last24h } } });
    } catch {
      // ClientError table may not exist
    }

    const aiRequestsToday = aiUsageLogToday + aiJobToday;
    const pendingReports = pendingContentReports + pendingMessageReports;

    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    const greeting =
      timeOfDay === 'morning' ? 'Good morning' : timeOfDay === 'afternoon' ? 'Good afternoon' : 'Good evening';

    const alerts: Array<{ type: 'warning' | 'info' | 'success'; message: string }> = [];
    if (errors24h > 0) {
      alerts.push({ type: 'warning', message: `${errors24h} client error(s) in the last 24 hours` });
    } else {
      alerts.push({ type: 'success', message: 'All systems operational' });
    }
    if (newUsers > 0) {
      alerts.push({ type: 'info', message: `${newUsers} new user${newUsers === 1 ? '' : 's'} joined today` });
    }

    return NextResponse.json({
      greeting,
      timeOfDay,
      highlights: {
        newUsers,
        activeUsers: activeUsersToday,
        aiRequests: aiRequestsToday,
        pendingReports,
        errors24h,
        messagesCount: messagesToday,
      },
      alerts,
      aiSummary: undefined, // Only add from AI when we have real insights; avoid fabricated text
    });
  } catch (error) {
    console.error('[Briefing] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch briefing' }, { status: 500 });
  }
}
