import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subDays } from 'date-fns';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const twelveWeeksAgo = subDays(new Date(), 12 * 7);
    const snapshots = await prisma.userRetentionSnapshot.findMany({
      where: { cohortDate: { gte: twelveWeeksAgo } },
      orderBy: { cohortDate: 'desc' },
      take: 12,
    });

    return NextResponse.json({
      cohortRetention: snapshots.map((s) => ({
        cohortDate: s.cohortDate,
        day1: Math.round(s.day1Retention * 100),
        day7: Math.round(s.day7Retention * 100),
        day30: Math.round(s.day30Retention * 100),
      })),
    });
  } catch (error) {
    console.error('[Retention] Error:', error);
    // If table doesn't exist (migration not applied) or query fails, return empty so page loads
    const msg = error instanceof Error ? error.message : String(error);
    if (
      /does not exist|relation.*not found|Unknown.*UserRetentionSnapshot|P2021|invalid.*table/i.test(msg)
    ) {
      return NextResponse.json({ cohortRetention: [] });
    }
    return NextResponse.json(
      { error: 'Failed to fetch retention', detail: process.env.NODE_ENV === 'development' ? msg : undefined },
      { status: 500 }
    );
  }
}
