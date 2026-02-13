/**
 * Event-Driven Automation Engine (Pillar 9)
 * Evaluates rules on events and executes actions
 */

import { prisma } from '@/lib/prisma';
import { subDays, subHours, subMinutes } from 'date-fns';
import { AUTOMATION_RULES, type AutomationRuleDefinition } from './rules';
import {
  sendReEngagementEmail,
  sendWelcomeEmail,
  tempBlockUser24h,
  shadowbanUser,
  blockIp1h,
  pinPost,
  sendCongratsEmail,
  notifyOwner,
} from './actions';

export type AutomationEvent = {
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

type ActionContext = {
  userId?: string;
  postId?: string;
  ip?: string;
  [key: string]: unknown;
};

/** Evaluate rule 1: Re-engagement for inactive + high churn */
async function evalReengagementInactive(
  _event: AutomationEvent,
  conditions: Record<string, unknown>
): Promise<ActionContext[]> {
  const inactiveDays = (conditions.inactiveDays as number) ?? 14;
  const churnRiskMin = (conditions.churnRiskMin as number) ?? 0.6;
  const cutoff = subDays(new Date(), inactiveDays);

  const atRisk = await prisma.churnPrediction.findMany({
    where: {
      churnProbability: { gte: churnRiskMin },
      riskLevel: 'high',
      predictedAt: { gte: subDays(new Date(), 1) },
    },
    select: { userId: true },
  });

  const userIds = atRisk.map((r) => r.userId);
  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      isBanned: false,
      lastActiveAt: { lt: cutoff },
      lastLoginAt: { lt: cutoff },
    },
    select: { id: true },
  });

  return users.map((u) => ({ userId: u.id }));
}

/** Evaluate rule 2: 3+ reports against same user in 24h */
async function evalReports3In24h(event: AutomationEvent): Promise<ActionContext[]> {
  const targetId = event.metadata?.targetId as string | undefined;
  const targetType = event.metadata?.targetType as string | undefined;
  if (!targetId || targetType !== 'USER') return [];

  const since = subHours(new Date(), 24);
  const reports = await prisma.report.count({
    where: {
      targetType: 'USER',
      targetId,
      createdAt: { gte: since },
    },
  });

  if (reports >= 3) return [{ userId: targetId }];
  return [];
}

/** Evaluate rule 3: 5+ posts in 10 min by same user */
async function evalSpam5Posts10min(event: AutomationEvent): Promise<ActionContext[]> {
  const authorId = event.metadata?.authorId as string | undefined;
  if (!authorId) return [];

  const since = subMinutes(new Date(), 10);
  const count = await prisma.post.count({
    where: { authorId, createdAt: { gte: since } },
  });

  if (count >= 5) return [{ userId: authorId }];
  return [];
}

/** Evaluate rule 4: ClientError >10 in 5 min */
async function evalClientErrorBatch(event: AutomationEvent): Promise<ActionContext[]> {
  const count = (event.metadata?.count as number) ?? 0;
  if (count >= 10) return [{}];
  return [];
}

/** Evaluate rule 5: AI cost >2x average (handled by cron) */
async function evalAiCostSpike(event: AutomationEvent): Promise<ActionContext[]> {
  const isSpike = event.metadata?.isSpike as boolean;
  if (isSpike) return [{}];
  return [];
}

/** Evaluate rule 6: GDPR pending >25 days */
async function evalGdprPending(): Promise<ActionContext[]> {
  const cutoff = subDays(new Date(), 25);
  const pending = await prisma.dataRequest.count({
    where: {
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
      createdAt: { lt: cutoff },
    },
  });
  if (pending > 0) return [{}];
  return [];
}

/** Evaluate rule 7: New user signup */
async function evalNewSignup(event: AutomationEvent): Promise<ActionContext[]> {
  const userId = event.entityId ?? event.metadata?.userId as string | undefined;
  if (userId) return [{ userId }];
  return [];
}

/** Evaluate rule 8: Post 50+ votes in 1h */
async function evalViralPost(event: AutomationEvent): Promise<ActionContext[]> {
  const postId = event.metadata?.postId as string | undefined;
  if (!postId) return [];

  const since = subMinutes(new Date(), 60);
  const count = await prisma.vote.count({
    where: { targetId: postId, targetType: 'POST', createdAt: { gte: since } },
  });
  if (count >= 50) return [{ postId }];
  return [];
}

/** Evaluate rule 9: User reaches 10 posts */
async function evalUser10Posts(event: AutomationEvent): Promise<ActionContext[]> {
  const authorId = event.metadata?.authorId as string | undefined;
  if (!authorId) return [];

  const count = await prisma.post.count({ where: { authorId } });
  if (count === 10) return [{ userId: authorId }];
  return [];
}

/** Evaluate rule 10: 10+ failed logins from IP */
async function evalFailedLoginsIp(event: AutomationEvent): Promise<ActionContext[]> {
  const ip = event.metadata?.ipAddress as string | undefined;
  const count = (event.metadata?.failCount as number) ?? 0;
  if (ip && count >= 10) return [{ ip }];
  return [];
}

/** Evaluate rule 11: Missing profiles >20% */
async function evalMissingProfiles(event: AutomationEvent): Promise<ActionContext[]> {
  const missingPct = event.metadata?.missingPercent as number | undefined;
  if (missingPct !== undefined && missingPct >= 20) return [{}];
  return [];
}

/** Evaluate rule 12: Feature adoption <5% (cron) */
async function evalFeatureAdoption(event: AutomationEvent): Promise<ActionContext[]> {
  const adoption = event.metadata?.adoptionPercent as number | undefined;
  if (adoption !== undefined && adoption < 5) return [{}];
  return [];
}

/** Evaluate rule 13: HIGH risk screening */
async function evalHighRiskScreening(event: AutomationEvent): Promise<ActionContext[]> {
  const riskLevel = event.metadata?.riskLevel as string | undefined;
  const userId = event.entityId ?? event.metadata?.userId as string | undefined;
  if (riskLevel === 'HIGH' && userId) return [{ userId }];
  return [];
}

/** Evaluate rule 14: DB latency (cron) */
async function evalDbLatency(event: AutomationEvent): Promise<ActionContext[]> {
  const isHigh = event.metadata?.latencyHigh as boolean;
  if (isHigh) return [{}];
  return [];
}

/** Evaluate rule 15: Content gap (search analysis) */
async function evalContentGap(event: AutomationEvent): Promise<ActionContext[]> {
  const searchCount = event.metadata?.searchCount as number | undefined;
  const postCount = event.metadata?.postCount as number | undefined;
  if (searchCount !== undefined && postCount !== undefined && searchCount >= 10 && postCount === 0) return [{}];
  return [];
}

const EVALUATORS: Record<string, (e: AutomationEvent, c?: Record<string, unknown>) => Promise<ActionContext[]>> = {
  reengagement_inactive_14d: evalReengagementInactive,
  auto_temp_block_reports: evalReports3In24h,
  spam_shadowban: evalSpam5Posts10min,
  client_error_critical: evalClientErrorBatch,
  ai_cost_spike: evalAiCostSpike,
  gdpr_escalate: evalGdprPending,
  welcome_new_user: evalNewSignup,
  suggest_pin_viral: evalViralPost,
  congrats_10_posts: evalUser10Posts,
  ip_block_failed_logins: evalFailedLoginsIp,
  missing_profiles_alert: evalMissingProfiles,
  feature_adoption_low: evalFeatureAdoption,
  high_risk_screening: evalHighRiskScreening,
  db_latency_alert: evalDbLatency,
  content_gap_search: evalContentGap,
};

const TRIGGER_EVENT_MAP: Record<string, string[]> = {
  CHURN_SCAN_COMPLETE: ['reengagement_inactive_14d'],
  REPORT_CREATED: ['auto_temp_block_reports'],
  POST_CREATED: ['spam_shadowban', 'congrats_10_posts'],
  CLIENT_ERROR_BATCH: ['client_error_critical'],
  AI_COST_DAILY_SCAN: ['ai_cost_spike'],
  GDPR_SCAN: ['gdpr_escalate'],
  USER_SIGNUP: ['welcome_new_user'],
  VOTE_CREATED: ['suggest_pin_viral'],
  LOGIN_FAILED: ['ip_block_failed_logins'],
  PROFILE_SCAN: ['missing_profiles_alert'],
  FEATURE_ADOPTION_SCAN: ['feature_adoption_low'],
  SCREENING_COMPLETED: ['high_risk_screening'],
  DB_LATENCY_SCAN: ['db_latency_alert'],
  SEARCH_ANALYSIS: ['content_gap_search'],
};

/** Execute a single action */
async function executeAction(
  action: string,
  ctx: ActionContext,
  rule: AutomationRuleDefinition
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (action) {
      case 'SEND_REENGAGEMENT_EMAIL':
        if (ctx.userId) await sendReEngagementEmail(ctx.userId);
        break;
      case 'SEND_WELCOME_EMAIL':
        if (ctx.userId) await sendWelcomeEmail(ctx.userId);
        break;
      case 'TEMP_BLOCK_24H':
        if (ctx.userId)
          await tempBlockUser24h(ctx.userId, `3+ reports in 24h - auto temp block by ${rule.name}`);
        break;
      case 'SHADOWBAN_USER':
        if (ctx.userId) await shadowbanUser(ctx.userId, `5+ posts in 10 min - auto shadowban by ${rule.name}`);
        break;
      case 'NOTIFY_OWNER':
        await notifyOwner('warning', `Automation: ${rule.name} triggered`, { ...ctx });
        break;
      case 'CRITICAL_ALERT':
        await notifyOwner('critical', `Automation: ${rule.name} - immediate attention required`, { ...ctx });
        break;
      case 'BLOCK_IP_1H':
        if (ctx.ip) await blockIp1h(ctx.ip);
        break;
      case 'SUGGEST_PIN':
        if (ctx.postId)
          await pinPost(ctx.postId, `50+ votes in 1h - suggested by ${rule.name}`);
        break;
      case 'SEND_CONGRATS_EMAIL':
        if (ctx.userId) await sendCongratsEmail(ctx.userId, 'You\'ve reached 10 posts! Thank you for contributing to NeuroKid.');
        break;
      case 'LOG':
        // No-op, logged via AutomationAction
        break;
      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/** Map actual emitted event types to automation trigger names */
const EVENT_TYPE_ALIASES: Record<string, string> = {
  post_create: 'POST_CREATED',
  report_create: 'REPORT_CREATED',
  user_signup: 'USER_SIGNUP',
  user_created: 'USER_SIGNUP',
  vote_create: 'VOTE_CREATED',
  comment_create: 'COMMENT_CREATED',
};

/** Run automation engine for a given event */
export async function processAutomationEvent(event: AutomationEvent): Promise<{
  triggered: number;
  actionsExecuted: number;
  errors: string[];
}> {
  const eventType = EVENT_TYPE_ALIASES[event.eventType] ?? event.eventType;
  const ruleIds = TRIGGER_EVENT_MAP[eventType];
  if (!ruleIds?.length) return { triggered: 0, actionsExecuted: 0, errors: [] };

  const rules = AUTOMATION_RULES.filter((r) => ruleIds.includes(r.id));
  let triggered = 0;
  let actionsExecuted = 0;
  const errors: string[] = [];

  const normalizedEvent = { ...event, eventType };

  for (const ruleDef of rules) {
    const dbRule = await prisma.automationRule.findFirst({
      where: { triggerEvent: ruleDef.triggerEvent, isActive: true },
    });

    // Use DB rule if exists (allows overrides), else use predefined
    const rule = dbRule
      ? { ...ruleDef, conditions: (dbRule.conditions as Record<string, unknown>) ?? ruleDef.conditions, actions: (dbRule.actions as string[]) ?? ruleDef.actions }
      : ruleDef;

    const evaluator = EVALUATORS[ruleDef.id];
    if (!evaluator) continue;

    const contexts = await evaluator(normalizedEvent, rule.conditions as Record<string, unknown>);
    if (contexts.length === 0) continue;

    triggered++;

    for (const ctx of contexts) {
      for (const action of rule.actions) {
        const result = await executeAction(action, ctx, rule);
        if (result.success) {
          actionsExecuted++;
          await prisma.automationAction.create({
            data: {
              ruleId: dbRule?.id ?? ruleDef.id,
              ruleName: rule.name,
              triggerEvent: eventType,
              actionTaken: action,
              targetUserId: ctx.userId ?? null,
              targetPostId: ctx.postId ?? null,
              status: 'SUCCESS',
              details: ctx as Record<string, unknown>,
            },
          });
        } else {
          errors.push(`${rule.name}/${action}: ${result.error}`);
          await prisma.automationAction.create({
            data: {
              ruleId: dbRule?.id ?? ruleDef.id,
              ruleName: rule.name,
              triggerEvent: eventType,
              actionTaken: action,
              targetUserId: ctx.userId ?? null,
              targetPostId: ctx.postId ?? null,
              status: 'FAILED',
              details: { error: result.error, ...ctx } as Record<string, unknown>,
            },
          });
        }
      }
    }

    if (dbRule) {
      await prisma.automationRule.update({
        where: { id: dbRule.id },
        data: {
          lastTriggered: new Date(),
          triggerCount: { increment: 1 },
        },
      });
    }
  }

  return { triggered, actionsExecuted, errors };
}

/** Seed default rules into DB (idempotent) */
export async function seedAutomationRules(): Promise<void> {
  const existing = await prisma.automationRule.findMany();
  for (const rule of AUTOMATION_RULES) {
    const found = existing.find((r) => r.triggerEvent === rule.triggerEvent && r.name === rule.name);
    if (!found) {
      await prisma.automationRule.create({
        data: {
          name: rule.name,
          description: rule.description,
          triggerEvent: rule.triggerEvent,
          conditions: rule.conditions,
          actions: rule.actions,
          isActive: true,
        },
      });
    }
  }
}
