/**
 * Revenue tracker & runway calculator - Pillar 22
 *
 * Tracks income (donations, grants, sponsorships, subscriptions),
 * computes net profit/loss, burn rate, runway.
 */
import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths } from 'date-fns';

export const REVENUE_SOURCES = [
  'DONATION',
  'GRANT',
  'SPONSORSHIP',
  'SUBSCRIPTION',
  'AD_REVENUE',
  'OTHER',
] as const;

export type RevenueSource = (typeof REVENUE_SOURCES)[number];

export interface RevenueSummary {
  month: string;
  total: number;
  bySource: Record<string, number>;
}

export interface RunwayResult {
  cashReserves: number;
  monthlyBurnRate: number;
  monthlyRevenue: number;
  runwayMonths: number | null;
  isProfitable: boolean;
}

/**
 * Get revenue aggregated by month (last N months).
 */
export async function getRevenueByMonth(options?: {
  monthsBack?: number;
  sources?: RevenueSource[];
}): Promise<RevenueSummary[]> {
  const { monthsBack = 12, sources } = options ?? {};
  const since = subMonths(startOfMonth(new Date()), monthsBack);

  const entries = await prisma.revenueEntry.findMany({
    where: {
      month: { gte: since },
      ...(sources && sources.length > 0
        ? { source: { in: sources as string[] } }
        : {}),
    },
    orderBy: { month: 'asc' },
  });

  const byMonth = new Map<string, { total: number; bySource: Record<string, number> }>();

  for (const e of entries) {
    const key = e.month.toISOString().slice(0, 7);
    const existing = byMonth.get(key) ?? {
      total: 0,
      bySource: {} as Record<string, number>,
    };
    existing.bySource[e.source] = (existing.bySource[e.source] ?? 0) + e.amount;
    existing.total += e.amount;
    byMonth.set(key, existing);
  }

  return Array.from(byMonth.entries()).map(([month, data]) => ({
    month,
    total: data.total,
    bySource: data.bySource,
  }));
}

/**
 * Get total revenue for a specific month.
 */
export async function getMonthlyRevenue(month: Date): Promise<number> {
  const monthStart = startOfMonth(month);
  const monthEnd = startOfMonth(subMonths(month, -1));

  const result = await prisma.revenueEntry.aggregate({
    where: {
      month: { gte: monthStart, lt: monthEnd },
    },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}

/**
 * Add a revenue entry.
 */
export async function addRevenue(params: {
  source: RevenueSource;
  amount: number;
  month: Date;
  description?: string;
  stripeId?: string;
  currency?: string;
}): Promise<{ id: string }> {
  const { source, amount, description, stripeId, currency = 'USD' } = params;
  const monthStart = startOfMonth(params.month);

  const created = await prisma.revenueEntry.create({
    data: {
      source,
      amount,
      month: monthStart,
      description,
      stripeId,
      currency,
    },
  });
  return { id: created.id };
}

/**
 * Compute runway: months until cash runs out.
 * burn rate = avg monthly costs over last 3 months
 * runway = cashReserves / burnRate when not profitable
 */
export async function computeRunway(options?: {
  cashReserves: number;
  monthsForBurnAvg?: number;
}): Promise<RunwayResult> {
  const { cashReserves = 0, monthsForBurnAvg = 3 } = options ?? {};

  const now = new Date();
  const since = subMonths(startOfMonth(now), monthsForBurnAvg);

  const [costAgg, revAgg] = await Promise.all([
    prisma.platformCost.aggregate({
      where: { month: { gte: since } },
      _sum: { amount: true },
    }),
    prisma.revenueEntry.aggregate({
      where: { month: { gte: since } },
      _sum: { amount: true },
    }),
  ]);

  const totalCost = costAgg._sum.amount ?? 0;
  const totalRevenue = revAgg._sum.amount ?? 0;

  const monthlyBurnRate = monthsForBurnAvg > 0 ? totalCost / monthsForBurnAvg : 0;
  const monthlyRevenue = monthsForBurnAvg > 0 ? totalRevenue / monthsForBurnAvg : 0;

  const isProfitable = monthlyRevenue >= monthlyBurnRate;

  let runwayMonths: number | null = null;
  if (!isProfitable && monthlyBurnRate > 0 && cashReserves > 0) {
    const netBurn = monthlyBurnRate - monthlyRevenue;
    runwayMonths = Math.floor(cashReserves / netBurn);
  }

  return {
    cashReserves,
    monthlyBurnRate,
    monthlyRevenue,
    runwayMonths,
    isProfitable,
  };
}
