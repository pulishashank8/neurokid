/**
 * Feedback & NPS utilities - Pillar 20
 * NPS calculation, sentiment categorization, quick reaction averaging
 */
import { prisma } from '@/lib/prisma';

export type FeedbackType = 'QUICK_REACTION' | 'NPS' | 'BUG_REPORT' | 'FEATURE_REQUEST';

/** NPS categories: Promoters 9-10, Passives 7-8, Detractors 0-6 */
export function getNPSCategory(rating: number): 'PROMOTER' | 'PASSIVE' | 'DETRACTOR' {
  if (rating >= 9) return 'PROMOTER';
  if (rating >= 7) return 'PASSIVE';
  return 'DETRACTOR';
}

/**
 * Calculate NPS score from ratings array
 * NPS = % Promoters - % Detractors (range -100 to 100)
 */
export function calculateNPS(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  let promoters = 0;
  let detractors = 0;
  for (const r of ratings) {
    if (r >= 9) promoters++;
    else if (r <= 6) detractors++;
  }
  const pctPromoters = (promoters / ratings.length) * 100;
  const pctDetractors = (detractors / ratings.length) * 100;
  return Math.round(pctPromoters - pctDetractors);
}

/**
 * Get NPS breakdown (counts by category)
 */
export function getNPSBreakdown(ratings: number[]): {
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  score: number;
} {
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  for (const r of ratings) {
    if (r >= 9) promoters++;
    else if (r >= 7) passives++;
    else detractors++;
  }
  const total = promoters + passives + detractors;
  const score = total > 0 ? calculateNPS(ratings) : 0;
  return { promoters, passives, detractors, total, score };
}

/**
 * Fetch NPS metrics for a time range (from UserFeedback)
 */
export async function getNPSMetrics(options?: {
  since?: Date;
  period?: 'day' | 'week' | 'month';
}) {
  const period = options?.period ?? 'month';
  const hours = period === 'day' ? 24 : period === 'week' ? 168 : 720;
  const since = options?.since ?? new Date(Date.now() - hours * 60 * 60 * 1000);

  const feedbacks = await prisma.userFeedback.findMany({
    where: {
      type: 'NPS',
      rating: { not: null },
      createdAt: { gte: since },
    },
    select: { rating: true },
  });

  const ratings = feedbacks
    .map((f) => f.rating)
    .filter((r): r is number => r !== null);

  return getNPSBreakdown(ratings);
}

/**
 * Average quick reaction score per category (-1 to 1, or null if no data)
 */
export async function getQuickReactionAverages(options?: {
  since?: Date;
  category?: string;
}) {
  const since = options?.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const feedbacks = await prisma.userFeedback.findMany({
    where: {
      type: 'QUICK_REACTION',
      rating: { not: null },
      createdAt: { gte: since },
      ...(options?.category ? { category: options.category } : {}),
    },
    select: { rating: true, category: true },
  });

  if (feedbacks.length === 0) return { avg: null, count: 0, byCategory: {} };

  const total = feedbacks.reduce((s, f) => s + (f.rating ?? 0), 0);
  const avg = total / feedbacks.length;

  const byCategory: Record<string, { sum: number; count: number }> = {};
  for (const f of feedbacks) {
    const cat = f.category ?? 'general';
    if (!byCategory[cat]) byCategory[cat] = { sum: 0, count: 0 };
    byCategory[cat].sum += f.rating ?? 0;
    byCategory[cat].count++;
  }

  const byCategoryAvg: Record<string, number> = {};
  for (const [cat, v] of Object.entries(byCategory)) {
    byCategoryAvg[cat] = v.count > 0 ? v.sum / v.count : 0;
  }

  return { avg, count: feedbacks.length, byCategory: byCategoryAvg };
}
