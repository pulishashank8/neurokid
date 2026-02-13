/**
 * Log moderation actions to ModerationActionLog for admin audit trail
 */
import { prisma } from '@/lib/prisma';

const OWNER_ADMIN_ID = 'owner';

export async function logModerationAction(params: {
  actionType: string;
  targetType: 'post' | 'comment' | 'user';
  targetId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.moderationActionLog.create({
      data: {
        adminId: OWNER_ADMIN_ID,
        actionType: params.actionType,
        targetType: params.targetType,
        targetId: params.targetId ?? null,
        reason: params.reason ?? null,
        metadata: params.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error('[ModerationLog] Failed to log:', error);
  }
}
