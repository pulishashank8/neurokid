/**
 * POST /api/owner/notifications/send
 * Send in-app notifications to selected users.
 * Body: { title, message, link?, recipientUserIds: string[] } OR { title, message, group?, activity? } for segment-based send
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subDays, startOfDay } from 'date-fns';

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, message, link, recipientUserIds, group, activity } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
    }

    let userIds: string[] = [];

    if (Array.isArray(recipientUserIds) && recipientUserIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: recipientUserIds }, isBanned: false },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else {
      const today = startOfDay(new Date());
      const last7d = subDays(today, 7);
      const last1y = subDays(today, 365);

      const conditions: Record<string, unknown>[] = [];

      const g = (group || 'all').toString().toLowerCase();
      if (g === 'parents') conditions.push({ userRoles: { some: { role: 'PARENT' } } });
      else if (g === 'therapist' || g === 'therapists') conditions.push({ userRoles: { some: { role: 'THERAPIST' } } });
      else if (g === 'providers' || g === 'doctors') conditions.push({ claimedProviders: { some: {} } });

      const a = (activity || 'all').toString().toLowerCase();
      if (a === 'inactive_7d') conditions.push({ OR: [{ lastLoginAt: { lt: last7d } }, { lastLoginAt: null }] });
      else if (a === 'new_today') conditions.push({ createdAt: { gte: today } });
      else if (a === 'joined_7d') conditions.push({ createdAt: { gte: last7d, lt: today } });
      else if (a === 'joined_1y') conditions.push({ createdAt: { lt: last1y } });

      const segmentWhere = conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { AND: conditions };
      const where = Object.keys(segmentWhere).length > 0
        ? { AND: [{ isBanned: false }, segmentWhere] }
        : { isBanned: false };
      const users = await prisma.user.findMany({ where, select: { id: true } });
      userIds = users.map((u) => u.id);
    }

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'No recipients found for the selected segment' }, { status: 400 });
    }

    const payload = {
      title: String(title).trim(),
      message: String(message).trim(),
      link: link ? String(link).trim() : null,
    };

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: 'SYSTEM',
        payload,
      })),
    });

    return NextResponse.json({
      sentCount: userIds.length,
      total: userIds.length,
    });
  } catch (error) {
    console.error('[Notifications Send] Error:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}
