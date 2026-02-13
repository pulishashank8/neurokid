import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  runBusinessIntelligenceCalculation,
  getBusinessMetrics,
} from '@/lib/owner/business-intelligence';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    businessMetric: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    user: { count: vi.fn() },
    userRetentionSnapshot: { findMany: vi.fn() },
    churnPrediction: { count: vi.fn() },
    platformCost: { aggregate: vi.fn() },
    post: { count: vi.fn() },
    screeningResult: { count: vi.fn(), groupBy: vi.fn() },
    userFeedback: { findMany: vi.fn() },
    aIUsageLog: { groupBy: vi.fn(), aggregate: vi.fn() },
  },
}));

describe('Business Intelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.businessMetric.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.businessMetric.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(10);
    vi.mocked(prisma.userRetentionSnapshot.findMany).mockResolvedValue([
      { day7Retention: 0.3, day30Retention: 0.2 } as never,
    ]);
    vi.mocked(prisma.churnPrediction.count).mockResolvedValue(2);
    vi.mocked(prisma.platformCost.aggregate).mockResolvedValue({ _sum: { amount: 0 } } as never);
    vi.mocked(prisma.post.count).mockResolvedValue(50);
    vi.mocked(prisma.screeningResult.count).mockResolvedValue(20);
    vi.mocked(prisma.screeningResult.groupBy).mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }] as never);
    vi.mocked(prisma.userFeedback.findMany).mockResolvedValue([]);
    vi.mocked(prisma.aIUsageLog.groupBy).mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }] as never);
    vi.mocked(prisma.aIUsageLog.aggregate).mockResolvedValue({ _sum: { tokensUsed: 10000 } } as never);
  });

  describe('runBusinessIntelligenceCalculation', () => {
    it('should compute and upsert BI metrics', async () => {
      const result = await runBusinessIntelligenceCalculation();

      expect(result.success).toBe(true);
      expect(result.metricsComputed).toBeGreaterThan(0);
      expect(prisma.businessMetric.upsert).toHaveBeenCalled();
    });

    it('should store DAU, WAU, MAU', async () => {
      await runBusinessIntelligenceCalculation();

      const upsertCalls = vi.mocked(prisma.businessMetric.upsert).mock.calls;
      const metricNames = upsertCalls.map((c) => (c[0] as { create: { metricName: string } }).create.metricName);
      expect(metricNames).toContain('DAU');
      expect(metricNames).toContain('WAU');
      expect(metricNames).toContain('MAU');
    });

    it('should store stickiness, retention, churn', async () => {
      await runBusinessIntelligenceCalculation();

      const upsertCalls = vi.mocked(prisma.businessMetric.upsert).mock.calls;
      const metricNames = upsertCalls.map((c) => (c[0] as { create: { metricName: string } }).create.metricName);
      expect(metricNames).toContain('STICKINESS');
      expect(metricNames).toContain('RETENTION_RATE');
      expect(metricNames).toContain('CHURN_RATE');
    });

    it('should store CAC, LTV, LTV_CAC_RATIO', async () => {
      await runBusinessIntelligenceCalculation();

      const upsertCalls = vi.mocked(prisma.businessMetric.upsert).mock.calls;
      const metricNames = upsertCalls.map((c) => (c[0] as { create: { metricName: string } }).create.metricName);
      expect(metricNames).toContain('CAC');
      expect(metricNames).toContain('LTV');
      expect(metricNames).toContain('LTV_CAC_RATIO');
    });

    it('should handle prisma errors gracefully', async () => {
      vi.mocked(prisma.businessMetric.upsert).mockRejectedValueOnce(new Error('DB error'));

      const result = await runBusinessIntelligenceCalculation();

      expect(result.success).toBe(false);
      expect(result.error).toContain('DB error');
    });
  });

  describe('getBusinessMetrics', () => {
    it('should return metrics from database', async () => {
      vi.mocked(prisma.businessMetric.findMany).mockResolvedValue([
        { metricName: 'DAU', metricValue: 5, period: 'daily', periodDate: new Date() } as never,
      ]);

      const metrics = await getBusinessMetrics({ daysBack: 30 });

      expect(metrics).toHaveLength(1);
      expect(metrics[0].metricName).toBe('DAU');
      expect(metrics[0].metricValue).toBe(5);
    });

    it('should filter by metricNames when provided', async () => {
      vi.mocked(prisma.businessMetric.findMany).mockResolvedValue([]);

      await getBusinessMetrics({
        metricNames: ['DAU', 'MAU'],
        daysBack: 7,
      });

      expect(prisma.businessMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            metricName: { in: ['DAU', 'MAU'] },
          }),
        })
      );
    });
  });
});
