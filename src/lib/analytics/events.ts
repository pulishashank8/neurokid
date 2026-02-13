/**
 * Analytics Event Tracker
 *
 * Tracks user engagement events for the Owner Dashboard analytics.
 * Events are stored in AnalyticsEvent for engagement metrics, feature usage,
 * and ML-ready structured data.
 */

import { prisma } from '@/lib/prisma';

export type AnalyticsEventType =
  | 'login'
  | 'post_create'
  | 'post_view'
  | 'comment_create'
  | 'ai_use'
  | 'ai_chat'
  | 'resource_view'
  | 'page_view'
  | 'screening_complete'
  | 'screening_start'
  | 'message_send'
  | 'community_search'
  | 'profile_view'
  | 'daily_win_create'
  | 'therapy_log_access'
  | 'emergency_card_access';

export interface TrackEventOptions {
  userId?: string;
  eventType: AnalyticsEventType | string;
  featureName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track an analytics event. Fails silently to not break user flows.
 */
export async function trackEvent(options: TrackEventOptions): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        userId: options.userId ?? null,
        eventType: options.eventType,
        featureName: options.featureName ?? null,
        metadata: options.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
}
