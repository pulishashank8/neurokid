/**
 * Event Bus for real-time dashboard updates
 * In-memory buffer + optional Redis pub/sub for multi-instance
 */
import { prisma } from '@/lib/prisma';
import { isRedisEnabled } from '@/lib/redis';

const MAX_BUFFER = 200;
const buffer: Array<{ id: string; eventType: string; entityType: string; entityId?: string; metadata?: Record<string, unknown>; createdAt: Date }> = [];
const listeners = new Set<(event: { eventType: string; entityType: string; entityId?: string; metadata?: unknown; createdAt: string }) => void>();

export type RealtimeEventPayload = {
  eventType: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export async function emitRealtimeEvent(payload: RealtimeEventPayload): Promise<void> {
  try {
    const [record] = await prisma.$transaction([
      prisma.realtimeEvent.create({
        data: {
          eventType: payload.eventType,
          entityType: payload.entityType,
          entityId: payload.entityId ?? null,
          metadata: payload.metadata ?? undefined,
        },
      }),
    ]);

    const event = {
      id: record.id,
      eventType: record.eventType,
      entityType: record.entityType,
      entityId: record.entityId ?? undefined,
      metadata: record.metadata as Record<string, unknown> | undefined,
      createdAt: record.createdAt.toISOString(),
    };

    buffer.push({ ...event, createdAt: record.createdAt });
    if (buffer.length > MAX_BUFFER) buffer.shift();

    listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (e) {
        console.error('[EventBus] Listener error:', e);
      }
    });

    // Trigger automation engine for matching events
    try {
      const { processAutomationEvent } = await import('@/lib/owner/automation');
      const automationEvent = {
        eventType: payload.eventType,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: payload.metadata,
      };
      processAutomationEvent(automationEvent).catch((e) =>
        console.error('[EventBus] Automation error:', e)
      );
    } catch {
      // Automation module may not be loaded
    }

    if (isRedisEnabled()) {
      try {
        const { redis } = await import('@/lib/redis');
        if (redis?.publish) redis.publish('owner:events', JSON.stringify(event)).catch(() => {});
      } catch {
        // Redis unavailable
      }
    }
  } catch (e) {
    console.error('[EventBus] emit error:', e);
  }
}

export function subscribeToEvents(
  onEvent: (event: { eventType: string; entityType: string; entityId?: string; metadata?: unknown; createdAt: string }) => void
): () => void {
  listeners.add(onEvent);
  return () => listeners.delete(onEvent);
}

export function getRecentEvents(limit = 50) {
  return buffer.slice(-limit).reverse().map((e) => ({
    ...e,
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
  }));
}
