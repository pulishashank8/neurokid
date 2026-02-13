/**
 * Cost tracker - Pillar 11 / 22
 *
 * Aggregates PlatformCost (AI, HOSTING, DATABASE, EMAIL, STORAGE, etc.)
 * by month. Supports add/update costs and monthly breakdown.
 */
import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths } from 'date-fns';

export const COST_CATEGORIES = [
  'AI',
  'HOSTING',
  'DATABASE',
  'EMAIL',
  'STORAGE',
  'MARKETING',
  'ACQUISITION',
  'ADS',
  'OTHER',
] as const;

export type CostCategory = (typeof COST_CATEGORIES)[number];

export interface CostSummary {
  month: string;
  total: number;
  byCategory: Record<string, number>;
}

/**
 * Get costs aggregated by month (last N months).
 */
export async function getCostsByMonth(options?: {
  monthsBack?: number;
  categories?: CostCategory[];
}): Promise<CostSummary[]> {
  const { monthsBack = 12, categories } = options ?? {};
  const since = subMonths(startOfMonth(new Date()), monthsBack);

  const costs = await prisma.platformCost.findMany({
    where: {
      month: { gte: since },
      ...(categories && categories.length > 0
        ? { category: { in: categories as string[] } }
        : {}),
    },
    orderBy: { month: 'asc' },
  });

  const byMonth = new Map<string, { total: number; byCategory: Record<string, number> }>();

  for (const c of costs) {
    const key = c.month.toISOString().slice(0, 7); // YYYY-MM
    const existing = byMonth.get(key) ?? {
      total: 0,
      byCategory: {} as Record<string, number>,
    };
    existing.byCategory[c.category] = (existing.byCategory[c.category] ?? 0) + c.amount;
    existing.total += c.amount;
    byMonth.set(key, existing);
  }

  return Array.from(byMonth.entries()).map(([month, data]) => ({
    month,
    total: data.total,
    byCategory: data.byCategory,
  }));
}

/**
 * Get total cost for a specific month.
 */
export async function getMonthlyCost(month: Date): Promise<number> {
  const monthStart = startOfMonth(month);
  const monthEnd = startOfMonth(subMonths(month, -1));

  const result = await prisma.platformCost.aggregate({
    where: {
      month: { gte: monthStart, lt: monthEnd },
    },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}

/**
 * Add or update a cost entry. If a record exists for (category, month),
 * adds to existing amount; otherwise creates new.
 */
export async function addCost(params: {
  category: CostCategory;
  amount: number;
  month: Date;
  description?: string;
  currency?: string;
}): Promise<{ id: string }> {
  const { category, amount, description, currency = 'USD' } = params;
  const monthStart = startOfMonth(params.month);

  const existing = await prisma.platformCost.findUnique({
    where: {
      category_month: { category, month: monthStart },
    },
  });

  if (existing) {
    await prisma.platformCost.update({
      where: { id: existing.id },
      data: {
        amount: existing.amount + amount,
        ...(description ? { description } : {}),
      },
    });
    return { id: existing.id };
  }

  const created = await prisma.platformCost.create({
    data: {
      category,
      amount,
      month: monthStart,
      description,
      currency,
    },
  });
  return { id: created.id };
}

/**
 * Set (replace) cost for a category/month.
 */
export async function setCost(params: {
  category: CostCategory;
  amount: number;
  month: Date;
  description?: string;
  currency?: string;
}): Promise<{ id: string }> {
  const { category, amount, description, currency = 'USD' } = params;
  const monthStart = startOfMonth(params.month);

  const upserted = await prisma.platformCost.upsert({
    where: {
      category_month: { category, month: monthStart },
    },
    create: {
      category,
      amount,
      month: monthStart,
      description,
      currency,
    },
    update: { amount, description },
  });
  return { id: upserted.id };
}
