import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCostsByMonth,
  addCost,
  setCost,
  getMonthlyCost,
  COST_CATEGORIES,
} from '@/lib/owner/cost-tracker';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    platformCost: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

describe('Cost Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCostsByMonth', () => {
    it('should aggregate costs by month', async () => {
      vi.mocked(prisma.platformCost.findMany).mockResolvedValue([
        { category: 'AI', amount: 50, month: new Date('2026-01-01') } as never,
        { category: 'HOSTING', amount: 100, month: new Date('2026-01-01') } as never,
        { category: 'AI', amount: 60, month: new Date('2026-02-01') } as never,
      ] as never);

      const result = await getCostsByMonth({ monthsBack: 3 });

      expect(result).toHaveLength(2);
      const jan = result.find((r) => r.month === '2026-01');
      expect(jan).toBeDefined();
      expect(jan?.total).toBe(150);
      expect(jan?.byCategory).toEqual({ AI: 50, HOSTING: 100 });
    });

    it('should filter by categories when provided', async () => {
      vi.mocked(prisma.platformCost.findMany).mockResolvedValue([]);

      await getCostsByMonth({ monthsBack: 6, categories: ['AI', 'HOSTING'] });

      expect(prisma.platformCost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { in: ['AI', 'HOSTING'] },
          }),
        })
      );
    });
  });

  describe('getMonthlyCost', () => {
    it('should return total cost for month', async () => {
      vi.mocked(prisma.platformCost.aggregate).mockResolvedValue({
        _sum: { amount: 250 },
      } as never);

      const result = await getMonthlyCost(new Date('2026-02-15'));

      expect(result).toBe(250);
    });
  });

  describe('addCost', () => {
    it('should create new cost when none exists', async () => {
      vi.mocked(prisma.platformCost.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.platformCost.create).mockResolvedValue({
        id: 'c1',
        category: 'AI',
        amount: 50,
        month: new Date('2026-01-01'),
      } as never);

      const result = await addCost({
        category: 'AI',
        amount: 50,
        month: new Date('2026-01-15'),
      });

      expect(result.id).toBe('c1');
      expect(prisma.platformCost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ category: 'AI', amount: 50 }),
        })
      );
    });

    it('should add to existing cost when record exists', async () => {
      vi.mocked(prisma.platformCost.findUnique).mockResolvedValue({
        id: 'c1',
        amount: 30,
      } as never);
      vi.mocked(prisma.platformCost.update).mockResolvedValue({} as never);

      await addCost({
        category: 'AI',
        amount: 20,
        month: new Date('2026-01-01'),
      });

      expect(prisma.platformCost.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { amount: 50 },
      });
    });
  });

  describe('setCost', () => {
    it('should upsert cost', async () => {
      vi.mocked(prisma.platformCost.upsert).mockResolvedValue({
        id: 'c1',
        category: 'AI',
        amount: 75,
        month: new Date('2026-01-01'),
      } as never);

      const result = await setCost({
        category: 'AI',
        amount: 75,
        month: new Date('2026-01-01'),
      });

      expect(result.id).toBe('c1');
      expect(prisma.platformCost.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category_month: { category: 'AI', month: expect.any(Date) } },
          create: expect.objectContaining({ amount: 75 }),
          update: expect.objectContaining({ amount: 75 }),
        })
      );
    });
  });

  describe('COST_CATEGORIES', () => {
    it('should include expected categories', () => {
      expect(COST_CATEGORIES).toContain('AI');
      expect(COST_CATEGORIES).toContain('HOSTING');
      expect(COST_CATEGORIES).toContain('DATABASE');
    });
  });
});
