/**
 * Create AdminNotification for owner dashboard alerts
 */
import { prisma } from '@/lib/prisma';

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export async function createAdminNotification(params: {
  type: string;
  severity: NotificationSeverity;
  message: string;
  relatedEntity?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: {
        type: params.type,
        severity: params.severity,
        message: params.message,
        relatedEntity: params.relatedEntity ?? null,
        metadata: params.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error('[AdminNotification] Failed to create:', error);
  }
}
