import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subDays } from 'date-fns';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sevenDaysAgo = subDays(new Date(), 7);
    const predictions = await prisma.churnPrediction.findMany({
      where: { predictedAt: { gte: sevenDaysAgo } },
      orderBy: [{ riskLevel: 'desc' }, { churnProbability: 'desc' }],
      take: 100,
    });

    const byUserId = new Map<string, (typeof predictions)[0]>();
    for (const p of predictions) {
      const existing = byUserId.get(p.userId);
      if (!existing || new Date(p.predictedAt) > new Date(existing.predictedAt)) {
        byUserId.set(p.userId, p);
      }
    }
    const latestPredictions = Array.from(byUserId.values());

    const highRisk = latestPredictions.filter((p) => p.riskLevel === 'high');
    const mediumRisk = latestPredictions.filter((p) => p.riskLevel === 'medium');
    const totalUsers = await prisma.user.count({ where: { isBanned: false } });
    const atRiskPct = totalUsers > 0 ? (latestPredictions.length / totalUsers) * 100 : 0;

    const highRiskWithUsers = await prisma.user.findMany({
      where: { id: { in: highRisk.slice(0, 20).map((p) => p.userId) } },
      include: { profile: true },
    });
    const userMap = new Map(highRiskWithUsers.map((u) => [u.id, u]));

    return NextResponse.json({
      atRiskPct: Math.round(atRiskPct * 100) / 100,
      totalAtRisk: latestPredictions.length,
      highRiskCount: highRisk.length,
      mediumRiskCount: mediumRisk.length,
      highRiskUsers: highRisk.slice(0, 20).map((p) => ({
        ...p,
        user: userMap.get(p.userId),
      })),
    });
  } catch (error) {
    console.error('[Churn] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch churn data' }, { status: 500 });
  }
}
