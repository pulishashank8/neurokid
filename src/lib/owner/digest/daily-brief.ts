/**
 * Daily Morning Brief - Pillar 18
 */
import { prisma } from '@/lib/prisma';

export async function compileDailyBrief() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    newSignups,
    errors,
    anomaliesCount,
    criticalInsights,
    activeUsers,
    pendingReports,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.clientError.count({ where: { createdAt: { gte: since } } }),
    prisma.systemAnomaly.count({ where: { resolvedAt: null, detectedAt: { gte: since } } }),
    prisma.aIAgentInsight.count({
      where: { createdAt: { gte: since }, severity: 'critical', isResolved: false },
    }),
    prisma.user.count({ where: { lastActiveAt: { gte: since } } }),
    prisma.report.count({ where: { status: 'OPEN' } }),
  ]);

  const signupNames = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    take: 10,
    select: { email: true },
  });

  return {
    newSignups,
    signupEmails: signupNames.map((u) => u.email),
    errors,
    anomaliesCount,
    criticalInsights,
    activeUsers,
    pendingReports,
    date: new Date().toISOString().slice(0, 10),
  };
}
