/**
 * Issue Fixer Agent
 * Auto-remediates issues found by other agents.
 * Takes actionable steps (block IPs, send notifications, trigger re-engagement)
 * and marks insights as resolved when fixes are applied.
 */

import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';
import type { AgentInsight, AgentResult, AgentContext } from './types';
import { notifyOwner, sendReEngagementEmail, blockIp1h } from '@/lib/owner/automation/actions';

const MAX_INSIGHTS_PER_RUN = 20;
const MAX_REENGAGEMENT_PER_RUN = 5;

export async function runIssueFixerAgent(context: AgentContext): Promise<AgentResult> {
  const start = Date.now();
  const insights: AgentInsight[] = [];

  try {
    const unresolved = await prisma.aIAgentInsight.findMany({
      where: { isResolved: false },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: MAX_INSIGHTS_PER_RUN,
    });

    let fixedCount = 0;

    for (const insight of unresolved) {
      const severity = insight.severity as 'info' | 'warning' | 'critical';
      const category = insight.category;
      const agentType = insight.agentType;

      let actionTaken = false;
      let actionDescription = '';

      // SECURITY: Block suspicious IPs when metrics include IP
      if (category === 'SECURITY' && severity !== 'info') {
        const ip = (insight.metrics as Record<string, unknown>)?.ip as string;
        if (ip && typeof ip === 'string') {
          try {
            await blockIp1h(ip);
            actionTaken = true;
            actionDescription = `Blocked IP ${ip} for 1 hour`;
          } catch {
            // Continue
          }
        }
      }

      // RISK / GROWTH: Re-engagement emails for inactive users
      if (
        (category === 'RISK' || category === 'GROWTH') &&
        (insight.title?.toLowerCase().includes('retention') ||
          insight.title?.toLowerCase().includes('active') ||
          insight.description?.toLowerCase().includes('inactive')) &&
        fixedCount < MAX_REENGAGEMENT_PER_RUN
      ) {
        try {
          const lastWeek = subDays(new Date(), 7);
          const inactiveUsers = await prisma.user.findMany({
            where: {
              lastLoginAt: { lt: lastWeek, not: null },
              isBanned: false,
              emailVerified: true,
            },
            select: { id: true },
            take: MAX_REENGAGEMENT_PER_RUN,
            orderBy: { lastLoginAt: 'asc' },
          });

          for (const u of inactiveUsers) {
            try {
              await sendReEngagementEmail(u.id);
              actionTaken = true;
              actionDescription = `Sent re-engagement email to ${inactiveUsers.length} inactive user(s)`;
              fixedCount++;
              break;
            } catch {
              // Skip failed sends
            }
          }
        } catch {
          // Continue
        }
      }

      // Always notify owner for critical/warning so they're aware
      if (severity === 'critical' || severity === 'warning') {
        try {
          await notifyOwner(severity, `[${agentType}] ${insight.title}: ${insight.description}`, {
            insightId: insight.id,
            recommendation: insight.recommendation,
            actionTaken: actionTaken ? actionDescription : undefined,
          });
          if (!actionTaken) actionDescription = 'Owner notified for review';
          actionTaken = true;
        } catch {
          // Continue
        }
      }

      // Mark as resolved when we took action
      if (actionTaken) {
        try {
          await prisma.aIAgentInsight.update({
            where: { id: insight.id },
            data: {
              isResolved: true,
              resolvedAt: new Date(),
              recommendation: insight.recommendation
                ? `${insight.recommendation}\n\n[Auto-fixed] ${actionDescription}`
                : `[Auto-fixed] ${actionDescription}`,
            },
          });
          const fixInsight: AgentInsight = {
            agentType: 'ISSUE_FIXER',
            category: 'RISK',
            severity: 'info',
            title: `Fixed: ${insight.title}`,
            description: actionDescription,
            recommendation: `Resolved insight from ${agentType}`,
            metrics: { insightId: insight.id, originalAgent: agentType },
            confidence: 0.95,
          };
          insights.push(fixInsight);
          await prisma.aIAgentInsight.create({
            data: {
              agentType: fixInsight.agentType,
              category: fixInsight.category,
              severity: fixInsight.severity,
              title: fixInsight.title,
              description: fixInsight.description,
              recommendation: fixInsight.recommendation,
              metrics: fixInsight.metrics as Record<string, unknown>,
              confidence: fixInsight.confidence,
            },
          });
        } catch {
          // Log but continue
        }
      }
    }

    return {
      agentType: 'ISSUE_FIXER',
      success: true,
      insights,
      executionTimeMs: Date.now() - start,
    };
  } catch (error) {
    return {
      agentType: 'ISSUE_FIXER',
      success: false,
      insights: [],
      executionTimeMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
