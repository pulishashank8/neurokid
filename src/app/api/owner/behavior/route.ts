import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subDays } from 'date-fns';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const last30d = subDays(new Date(), 30);
    const events = await prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: last30d }, userId: { not: null } },
      select: { userId: true, eventType: true, featureName: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const userEvents = new Map<string, Array<{ eventType: string; at: Date }>>();
    for (const e of events) {
      if (!e.userId) continue;
      const arr = userEvents.get(e.userId) ?? [];
      arr.push({ eventType: e.eventType, at: e.createdAt });
      userEvents.set(e.userId, arr);
    }

    const journeyCounts = new Map<string, number>();
    const retentionByFeature = new Map<string, Set<string>>();

    for (const [, evts] of userEvents) {
      const seq = evts
        .map((e) => e.eventType)
        .filter((v, i, a) => i === 0 || v !== a[i - 1])
        .slice(0, 5)
        .join(' → ');
      if (seq) {
        journeyCounts.set(seq, (journeyCounts.get(seq) ?? 0) + 1);
      }

      const returning = evts.some((e, i) => {
        if (i === 0) return false;
        const prev = evts[i - 1].at;
        const curr = e.at;
        const days = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        return days >= 7;
      });
      if (returning) {
        const firstFeature = evts[0]?.eventType ?? 'unknown';
        const set = retentionByFeature.get(firstFeature) ?? new Set();
        set.add(evts[0] ? evts[0].eventType : '');
        retentionByFeature.set(firstFeature, set);
      }
    }

    const topJourneys = Array.from(journeyCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([journey, count]) => ({ journey, count }));

    const totalWithJourney = Array.from(journeyCounts.values()).reduce((a, b) => a + b, 0);
    const topRetentionActions = Array.from(retentionByFeature.entries())
      .map(([feature, set]) => ({ feature, retainedCount: set.size }))
      .sort((a, b) => b.retainedCount - a.retainedCount)
      .slice(0, 5);

    const signups = await prisma.user.count({
      where: { createdAt: { gte: last30d } },
    });
    const screeningCount = await prisma.screeningResult.count({
      where: { completedAt: { gte: last30d } },
    });
    const firstAiCount = await prisma.aIUsageLog.count({
      where: { createdAt: { gte: last30d } },
    });
    const postCreates = await prisma.analyticsEvent.count({
      where: {
        eventType: 'post_create',
        createdAt: { gte: last30d },
      },
    });
    const weeklyActive = await prisma.user.count({
      where: { lastLoginAt: { gte: subDays(new Date(), 7) } },
    });

    const funnel = [
      { step: 'Signup', entered: signups, completed: signups },
      { step: 'Screening', entered: screeningCount, completed: screeningCount },
      { step: 'First AI Use', entered: firstAiCount, completed: firstAiCount },
      { step: 'Community (Post)', entered: postCreates, completed: postCreates },
      { step: 'Weekly Active', entered: weeklyActive, completed: weeklyActive },
    ];

    const dropOffStep =
      funnel.find((f, i) => i > 0 && f.entered < funnel[i - 1].entered * 0.5) ?? funnel[funnel.length - 1];

    return NextResponse.json({
      topJourneys,
      totalWithJourney,
      topRetentionActions,
      funnel,
      highestDropOffStep: dropOffStep.step,
    });
  } catch (error) {
    console.error('[Behavior] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch behavior data' }, { status: 500 });
  }
}
