/**
 * User Risk & Safety Scoring
 *
 * Assigns risk score based on:
 * - Report history (reports filed against user, reports user filed)
 * - Content removals (moderation actions)
 * - Spam-like behavior (rate limits)
 * - Excessive messaging
 * - AI safety triggers (if any)
 *
 * Run nightly via GET /api/cron/risk-scoring
 */

import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

export async function runRiskScoring(): Promise<void> {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sevenDaysAgo = subDays(now, 7);

  try {
    const users = await prisma.user.findMany({
      where: { isBanned: false },
      select: { id: true },
    });

    for (const user of users) {
      const [
        reportsAgainstUser,
        contentRemovals,
        rateLimitCount,
        messageCount,
        messageReportsAgainst,
      ] = await Promise.all([
        prisma.report.count({
          where: { targetId: user.id, targetType: 'USER', createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.moderationAction.count({
          where: { targetUserId: user.id, createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.rateLimitLog.count({
          where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
        }) + prisma.messageRateLimit.count({
          where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.message.count({
          where: { senderId: user.id, createdAt: { gte: sevenDaysAgo } },
        }),
        prisma.messageReport.count({
          where: { reportedUserId: user.id, createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);

      const factors: Record<string, number | string> = {};
      let score = 0;

      if (reportsAgainstUser > 0) {
        score += Math.min(reportsAgainstUser * 0.15, 0.4);
        factors.reports_against = reportsAgainstUser;
      }
      if (contentRemovals > 0) {
        score += Math.min(contentRemovals * 0.2, 0.5);
        factors.content_removals = contentRemovals;
      }
      if (rateLimitCount > 5) {
        score += Math.min(rateLimitCount * 0.02, 0.2);
        factors.rate_limits = rateLimitCount;
      }
      if (messageCount > 200) {
        score += 0.1;
        factors.excessive_messaging = messageCount;
      }
      if (messageReportsAgainst > 0) {
        score += Math.min(messageReportsAgainst * 0.2, 0.4);
        factors.message_reports = messageReportsAgainst;
      }

      const finalScore = Math.min(score, 1);
      let riskLevel = 'LOW';
      if (finalScore >= 0.6) riskLevel = 'HIGH';
      else if (finalScore >= 0.3) riskLevel = 'MEDIUM';

      await prisma.userRiskScore.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          score: finalScore,
          riskLevel,
          lastEvaluatedAt: now,
          factors: factors as Record<string, unknown>,
        },
        update: {
          score: finalScore,
          riskLevel,
          lastEvaluatedAt: now,
          factors: factors as Record<string, unknown>,
        },
      });
    }
  } catch (error) {
    console.error('[RiskScoring] Failed:', error);
    throw error;
  }
}
