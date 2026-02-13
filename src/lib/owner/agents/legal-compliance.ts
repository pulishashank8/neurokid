/**
 * Legal Compliance Agent
 * Monitors GDPR, consent, content liability, and COPPA compliance
 */

import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';
import type { AgentInsight, AgentResult, AgentContext } from './types';

export async function runLegalComplianceAgent(context: AgentContext): Promise<AgentResult> {
  const start = Date.now();
  const insights: AgentInsight[] = [];

  try {
    const { now } = context;
    const twentyFiveDaysAgo = subDays(now, 25);
    const twentyEightDaysAgo = subDays(now, 28);

    // Check for pending GDPR data requests (using a generic approach)
    // In a real app, you'd have a DataRequest model
    const pendingDataRequests = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "User"
      WHERE "deletedAt" IS NULL
      AND "email" LIKE '%gdpr%'
      OR "email" LIKE '%delete%'
    `.catch(() => [{ count: BigInt(0) }]);

    const gdprPending = Number(pendingDataRequests[0]?.count ?? 0);

    // Check for users without email verification (consent tracking)
    const unverifiedUsers = await prisma.user.count({
      where: { emailVerified: false },
    });

    const totalUsers = await prisma.user.count();
    const unverifiedRate = totalUsers > 0 ? (unverifiedUsers / totalUsers) * 100 : 0;

    // Check for posts/comments that might need content review
    const recentPosts = await prisma.post.count({
      where: {
        createdAt: { gte: subDays(now, 1) },
      },
    });

    // Check for users who haven't completed profile (potential COPPA concerns)
    const incompleteProfiles = await prisma.user.count({
      where: {
        profile: null,
      },
    });

    // Generate compliance insights

    // GDPR deadline warning
    if (gdprPending > 0) {
      insights.push({
        agentType: 'LEGAL_COMPLIANCE',
        category: 'LEGAL',
        severity: 'critical',
        title: 'GDPR data requests pending',
        description: `${gdprPending} potential data requests may need attention. GDPR requires response within 30 days.`,
        recommendation: 'Review and process any pending data subject requests immediately.',
        metrics: { pendingRequests: gdprPending },
        confidence: 0.75,
      });
    }

    // High unverified rate
    if (unverifiedRate > 30 && totalUsers > 10) {
      insights.push({
        agentType: 'LEGAL_COMPLIANCE',
        category: 'LEGAL',
        severity: 'warning',
        title: 'High unverified user rate',
        description: `${unverifiedRate.toFixed(1)}% of users have not verified their email (${unverifiedUsers} users).`,
        recommendation: 'Send verification reminder emails to improve consent tracking.',
        metrics: { unverifiedUsers, unverifiedRate },
        confidence: 0.9,
      });
    }

    // Content moderation recommendation
    if (recentPosts > 50) {
      insights.push({
        agentType: 'LEGAL_COMPLIANCE',
        category: 'LEGAL',
        severity: 'info',
        title: 'High content volume - review recommended',
        description: `${recentPosts} posts created in the last 24 hours. Regular moderation review recommended.`,
        recommendation: 'Ensure content moderation queue is being reviewed regularly.',
        metrics: { recentPosts },
        confidence: 0.8,
      });
    }

    // Profile completion for age verification
    if (incompleteProfiles > 10) {
      insights.push({
        agentType: 'LEGAL_COMPLIANCE',
        category: 'LEGAL',
        severity: 'info',
        title: 'Incomplete user profiles',
        description: `${incompleteProfiles} users have not completed their profiles. This may impact age verification.`,
        recommendation: 'Consider prompting users to complete profiles for better COPPA compliance.',
        metrics: { incompleteProfiles },
        confidence: 0.7,
      });
    }

    return {
      agentType: 'LEGAL_COMPLIANCE',
      success: true,
      insights,
      executionTimeMs: Date.now() - start,
    };
  } catch (error) {
    return {
      agentType: 'LEGAL_COMPLIANCE',
      success: false,
      insights: [],
      executionTimeMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
