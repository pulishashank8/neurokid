import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateNPS,
  getNPSCategory,
  getNPSBreakdown,
  getNPSMetrics,
  getQuickReactionAverages,
} from '@/lib/owner/feedback';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userFeedback: {
      findMany: vi.fn(),
    },
  },
}));

describe('NPS Calculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNPSCategory', () => {
    it('returns PROMOTER for 9-10', () => {
      expect(getNPSCategory(9)).toBe('PROMOTER');
      expect(getNPSCategory(10)).toBe('PROMOTER');
    });
    it('returns PASSIVE for 7-8', () => {
      expect(getNPSCategory(7)).toBe('PASSIVE');
      expect(getNPSCategory(8)).toBe('PASSIVE');
    });
    it('returns DETRACTOR for 0-6', () => {
      expect(getNPSCategory(0)).toBe('DETRACTOR');
      expect(getNPSCategory(6)).toBe('DETRACTOR');
    });
  });

  describe('calculateNPS', () => {
    it('returns 0 for empty array', () => {
      expect(calculateNPS([])).toBe(0);
    });
    it('calculates NPS correctly: 100% promoters = 100', () => {
      expect(calculateNPS([9, 10, 9, 10])).toBe(100);
    });
    it('calculates NPS correctly: 100% detractors = -100', () => {
      expect(calculateNPS([0, 1, 2, 3])).toBe(-100);
    });
    it('calculates NPS correctly: 50% promoters, 50% detractors = 0', () => {
      expect(calculateNPS([9, 10, 0, 1])).toBe(0);
    });
    it('passives do not affect score', () => {
      expect(calculateNPS([9, 10, 7, 8])).toBe(50); // 2 promoters, 0 detractors = 50
    });
  });

  describe('getNPSBreakdown', () => {
    it('counts promoters, passives, detractors correctly', () => {
      const result = getNPSBreakdown([9, 10, 7, 8, 0, 1, 5]);
      expect(result.promoters).toBe(2);
      expect(result.passives).toBe(2);
      expect(result.detractors).toBe(3);
      expect(result.total).toBe(7);
    });
    it('calculates score', () => {
      const result = getNPSBreakdown([9, 10, 0, 1]);
      expect(result.score).toBe(0);
    });
  });

  describe('getNPSMetrics', () => {
    it('fetches NPS from database and returns breakdown', async () => {
      vi.mocked(prisma.userFeedback.findMany).mockResolvedValue([
        { rating: 9 } as never,
        { rating: 10 } as never,
        { rating: 3 } as never,
      ] as never);

      const result = await getNPSMetrics({ period: 'week' });

      expect(result.promoters).toBe(2);
      expect(result.detractors).toBe(1);
      expect(result.total).toBe(3);
      expect(result.score).toBe(33); // 66.67 - 33.33 ≈ 33
    });
  });

  describe('getQuickReactionAverages', () => {
    it('returns null avg when no feedback', async () => {
      vi.mocked(prisma.userFeedback.findMany).mockResolvedValue([]);

      const result = await getQuickReactionAverages();

      expect(result.avg).toBeNull();
      expect(result.count).toBe(0);
    });
    it('calculates average when feedback exists', async () => {
      vi.mocked(prisma.userFeedback.findMany).mockResolvedValue([
        { rating: 1, category: 'screening' } as never,
        { rating: -1, category: 'screening' } as never,
      ] as never);

      const result = await getQuickReactionAverages();

      expect(result.avg).toBe(0);
      expect(result.count).toBe(2);
    });
  });
});
