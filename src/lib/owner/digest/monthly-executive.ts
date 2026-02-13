/**
 * Monthly Executive Digest - Pillar 18
 */
import { prisma } from '@/lib/prisma';

export async function compileMonthlyExecutive() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const prevSince = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [
    newUsersNow,
    newUsersPrev,
    costs,
    revenue,
    dataRequests,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.user.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    prisma.platformCost.aggregate({
      where: { month: { gte: since } },
      _sum: { amount: true },
    }),
    prisma.revenueEntry.aggregate({
      where: { month: { gte: since } },
      _sum: { amount: true },
    }),
    Promise.resolve(0),
  ]);

  const growthMoM = newUsersPrev > 0 ? ((newUsersNow - newUsersPrev) / newUsersPrev) * 100 : 0;
  const totalCost = costs._sum.amount ?? 0;
  const totalRevenue = revenue._sum.amount ?? 0;

  return {
    newUsers: newUsersNow,
    growthMoM: Math.round(growthMoM * 10) / 10,
    totalCost,
    totalRevenue,
    netProfit: totalRevenue - totalCost,
    pendingDataRequests: dataRequests,
    month: new Date().toISOString().slice(0, 7),
  };
}
