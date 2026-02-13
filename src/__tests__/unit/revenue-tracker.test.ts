import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRevenueByMonth,
  addRevenue,
  getMonthlyRevenue,
  computeRunway,
  REVENUE_SOURCES,
} from '@/lib/owner/revenue-tracker';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    revenueEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    platformCost: {
      aggregate: vi.fn(),
    },
  },
}));

describe('Revenue Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRevenueByMonth', () => {
    it('should aggregate revenue by month', async () => {
      vi.mocked(prisma.revenueEntry.findMany).mockResolvedValue([
        { source: 'DONATION', amount: 50, month: new Date('2026-01-01') } as never,
        { source: 'GRANT', amount: 500, month: new Date('2026-01-01') } as never,
        { source: 'DONATION', amount: 25, month: new Date('2026-02-01') } as never,
      ] as never);

      const result = await getRevenueByMonth({ monthsBack: 3 });

      expect(result).toHaveLength(2);
      const jan = result.find((r) => r.month === '2026-01');
      expect(jan).toBeDefined();
      expect(jan?.total).toBe(550);
      expect(jan?.bySource).toEqual({ DONATION: 50, GRANT: 500 });
    });
  });

  describe('getMonthlyRevenue', () => {
    it('should return total revenue for month', async () => {
      vi.mocked(prisma.revenueEntry.aggregate).mockResolvedValue({
        _sum: { amount: 1200 },
      } as never);

      const result = await getMonthlyRevenue(new Date('2026-02-15'));

      expect(result).toBe(1200);
    });
  });

  describe('addRevenue', () => {
    it('should create revenue entry', async () => {
      vi.mocked(prisma.revenueEntry.create).mockResolvedValue({
        id: 'r1',
        source: 'DONATION',
        amount: 50,
        month: new Date('2026-01-01'),
      } as never);

      const result = await addRevenue({
        source: 'DONATION',
        amount: 50,
        month: new Date('2026-01-15'),
      });

      expect(result.id).toBe('r1');
      expect(prisma.revenueEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ source: 'DONATION', amount: 50 }),
        })
      );
    });
  });

  describe('computeRunway', () => {
    it('should return profitable when revenue >= costs', async () => {
      vi.mocked(prisma.platformCost.aggregate).mockResolvedValue({
        _sum: { amount: 500 },
      } as never);
      vi.mocked(prisma.revenueEntry.aggregate).mockResolvedValue({
        _sum: { amount: 600 },
      } as never);

      const result = await computeRunway({ cashReserves: 1000 });

      expect(result.isProfitable).toBe(true);
      expect(result.runwayMonths).toBeNull();
      expect(result.monthlyBurnRate).toBeCloseTo(500 / 3);
      expect(result.monthlyRevenue).toBeCloseTo(600 / 3);
    });

    it('should compute runway months when not profitable', async () => {
      vi.mocked(prisma.platformCost.aggregate).mockResolvedValue({
        _sum: { amount: 900 },
      } as never);
      vi.mocked(prisma.revenueEntry.aggregate).mockResolvedValue({
        _sum: { amount: 300 },
      } as never);

      const result = await computeRunway({
        cashReserves: 600,
        monthsForBurnAvg: 3,
      });

      expect(result.isProfitable).toBe(false);
      const netBurn = 300 - 100; // 900/3 - 300/3 = 300 - 100 = 200/mo
      expect(result.monthlyBurnRate).toBe(300);
      expect(result.monthlyRevenue).toBe(100);
      expect(result.runwayMonths).toBe(3); // 600 / 200 = 3
    });
  });

  describe('REVENUE_SOURCES', () => {
    it('should include expected sources', () => {
      expect(REVENUE_SOURCES).toContain('DONATION');
      expect(REVENUE_SOURCES).toContain('GRANT');
      expect(REVENUE_SOURCES).toContain('SUBSCRIPTION');
    });
  });
});
