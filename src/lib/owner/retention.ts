/**
 * User Retention Analytics
 * D1/D7/D30 retention by cohort (signup week)
 */
import { prisma } from '@/lib/prisma';
import { subDays, startOfWeek, format } from 'date-fns';

export async function runRetentionCalculation(): Promise<void> {
  const now = new Date();
  const twelveWeeksAgo = subDays(now, 12 * 7);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: twelveWeeksAgo } },
    select: { id: true, createdAt: true },
  });

  const cohortMap = new Map<string, string[]>();
  for (const u of users) {
    const cohortDate = startOfWeek(u.createdAt, { weekStartsOn: 1 });
    const key = format(cohortDate, 'yyyy-MM-dd');
    const arr = cohortMap.get(key) ?? [];
    arr.push(u.id);
    cohortMap.set(key, arr);
  }

  const last7d = subDays(now, 7);
  const last30d = subDays(now, 30);

  for (const [cohortStr, userIds] of cohortMap) {
    if (userIds.length < 1) continue;

    const cohortDate = new Date(cohortStr);
    const day1 = subDays(cohortDate, -1);
    const day7 = subDays(cohortDate, -7);
    const day30 = subDays(cohortDate, -30);

    if (day30 > now) continue;

    const [day1Active, day7Active, day30Active] = await Promise.all([
      prisma.user.count({
        where: {
          id: { in: userIds },
          lastLoginAt: { gte: day1 },
        },
      }),
      prisma.user.count({
        where: {
          id: { in: userIds },
          lastLoginAt: { gte: day7 },
        },
      }),
      prisma.user.count({
        where: {
          id: { in: userIds },
          lastLoginAt: { gte: day30 },
        },
      }),
    ]);

    const day1Retention = userIds.length > 0 ? day1Active / userIds.length : 0;
    const day7Retention = userIds.length > 0 ? day7Active / userIds.length : 0;
    const day30Retention = userIds.length > 0 ? day30Active / userIds.length : 0;

    await prisma.userRetentionSnapshot.deleteMany({ where: { cohortDate } });
    await prisma.userRetentionSnapshot.create({
      data: {
        cohortDate,
        day1Retention,
        day7Retention,
        day30Retention,
      },
    });
  }

  const pruneDate = subDays(now, 90);
  await prisma.userRetentionSnapshot.deleteMany({
    where: { cohortDate: { lt: pruneDate } },
  });
}
