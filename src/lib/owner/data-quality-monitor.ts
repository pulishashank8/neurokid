/**
 * Data Quality Monitoring
 *
 * Tracks:
 * - Missing critical fields %
 * - Duplicate records
 * - Incomplete user profiles
 * - Data freshness (stale records)
 *
 * Run via cron or GET /api/owner/data-quality
 */

import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function runDataQualityMonitor(): Promise<void> {
  const now = new Date();
  const ninetyDaysAgo = subDays(now, 90);

  try {
    const [
      totalUsers,
      usersWithoutProfile,
      staleUsers,
      totalPosts,
      postsWithoutAuthor,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { profile: null } }),
      prisma.user.count({
        where: {
          OR: [
            { lastActiveAt: { lt: ninetyDaysAgo } },
            { lastActiveAt: null, lastLoginAt: { lt: ninetyDaysAgo } },
            { lastActiveAt: null, lastLoginAt: null, createdAt: { lt: ninetyDaysAgo } },
          ],
        },
      }),
      prisma.post.count(),
      prisma.post.count({ where: { authorId: null } }),
    ]);

    // Duplicate check (email is unique, username should be unique via profile)
    const duplicateEmails = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM (
        SELECT email, COUNT(*) as c FROM "User" GROUP BY email HAVING COUNT(*) > 1
      ) t
    `;
    const dupCount = Number(duplicateEmails[0]?.count ?? 0);

    const metrics: Array<{ metricName: string; metricValue: number }> = [];

    // Missing critical fields
    const missingProfilePct = totalUsers > 0 ? (usersWithoutProfile / totalUsers) * 100 : 0;

    metrics.push(
      { metricName: 'missing_profile_pct', metricValue: Math.round(missingProfilePct * 100) / 100 },
      { metricName: 'stale_users_90d', metricValue: staleUsers },
      { metricName: 'stale_users_pct', metricValue: totalUsers > 0 ? Math.round((staleUsers / totalUsers) * 10000) / 100 : 0 },
      { metricName: 'duplicate_records', metricValue: dupCount },
      { metricName: 'posts_without_author_pct', metricValue: totalPosts > 0 ? Math.round((postsWithoutAuthor / totalPosts) * 10000) / 100 : 0 }
    );

    await prisma.dataQualityMetric.createMany({
      data: metrics.map((m) => ({
        metricName: m.metricName,
        metricValue: m.metricValue,
        recordedAt: now,
      })),
    });
  } catch (error) {
    console.error('[DataQualityMonitor] Failed:', error);
    await prisma.dataQualityMetric.create({
      data: {
        metricName: 'monitor_error',
        metricValue: 1,
        recordedAt: now,
      },
    });
  }
}
