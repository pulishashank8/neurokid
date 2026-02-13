import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

import { subDays, startOfDay } from 'date-fns';

/**
 * GET /api/owner/users - List users for email/notification recipient selection
 * Query: search?, limit?, page?, group?, activity?
 * group: "all" | "parents" | "therapist" | "providers"
 * activity: "all" | "inactive_7d" | "new_today" | "joined_7d" | "joined_1y"
 */
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const group = searchParams.get('group')?.trim().toLowerCase() || '';
  const activity = searchParams.get('activity')?.trim().toLowerCase() || 'all';
  const limit = Math.min(1000, Math.max(10, parseInt(searchParams.get('limit') || '50')));
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const skip = (page - 1) * limit;

  const today = startOfDay(new Date());
  const last7d = subDays(today, 7);
  const last1y = subDays(today, 365);

  const baseWhere: Record<string, unknown>[] = [];

  if (group === 'parents') {
    baseWhere.push({ userRoles: { some: { role: 'PARENT' } } });
  } else if (group === 'therapist' || group === 'therapists') {
    baseWhere.push({ userRoles: { some: { role: 'THERAPIST' } } });
  } else if (group === 'providers' || group === 'doctors') {
    baseWhere.push({ claimedProviders: { some: {} } });
  }

  if (activity === 'inactive_7d') {
    baseWhere.push({ OR: [{ lastLoginAt: { lt: last7d } }, { lastLoginAt: null }] });
  } else if (activity === 'new_today') {
    baseWhere.push({ createdAt: { gte: today } });
  } else if (activity === 'joined_7d') {
    baseWhere.push({ createdAt: { gte: subDays(today, 7), lt: today } });
  } else if (activity === 'joined_1y') {
    baseWhere.push({ createdAt: { lt: last1y } });
  }

  let segmentWhere: Record<string, unknown> = {};
  if (search && !group && activity === 'all') {
    segmentWhere = {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { profile: { username: { contains: search, mode: 'insensitive' as const } } },
        { profile: { displayName: { contains: search, mode: 'insensitive' as const } } },
      ],
    };
  } else if (baseWhere.length > 0) {
    segmentWhere = baseWhere.length === 1 ? baseWhere[0] : { AND: baseWhere };
  }
  const where = Object.keys(segmentWhere).length > 0
    ? { AND: [{ isBanned: false }, segmentWhere] }
    : { isBanned: false };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        profile: { select: { username: true, displayName: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const items = users.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.profile?.username ?? null,
    displayName: u.profile?.displayName ?? null,
  }));

  return NextResponse.json({
    users: items,
    total,
    page,
    limit,
  });
}
