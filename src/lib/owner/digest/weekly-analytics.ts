/**
 * Weekly Analytics Digest - Pillar 18
 */
import { prisma } from '@/lib/prisma';

export async function compileWeeklyAnalytics() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const prevSince = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [
    newUsersNow,
    newUsersPrev,
    automationActions,
    costs,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.user.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    prisma.automationAction.count({ where: { createdAt: { gte: since } } }),
    prisma.platformCost.aggregate({
      where: { month: { gte: since } },
      _sum: { amount: true },
    }),
  ]);

  const growthWoW = newUsersPrev > 0 ? ((newUsersNow - newUsersPrev) / newUsersPrev) * 100 : 0;
  const businessMetrics = await prisma.businessMetric.findMany({
    where: { periodDate: { gte: since }, period: 'weekly' },
    orderBy: { periodDate: 'desc' },
    take: 10,
  });

  return {
    newUsers: newUsersNow,
    growthWoW: Math.round(growthWoW * 10) / 10,
    automationActions,
    totalCost: costs._sum.amount ?? 0,
    businessMetrics,
    weekEnd: new Date().toISOString().slice(0, 10),
  };
}
