import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compileDailyBrief } from '@/lib/owner/digest/daily-brief';
import { compileWeeklyAnalytics } from '@/lib/owner/digest/weekly-analytics';
import { compileMonthlyExecutive } from '@/lib/owner/digest/monthly-executive';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { count: vi.fn(), findMany: vi.fn() },
    clientError: { count: vi.fn() },
    systemAnomaly: { count: vi.fn() },
    aIAgentInsight: { count: vi.fn() },
    report: { count: vi.fn() },
    automationAction: { count: vi.fn() },
    platformCost: { aggregate: vi.fn() },
    businessMetric: { findMany: vi.fn() },
    revenueEntry: { aggregate: vi.fn() },
  },
}));

describe('Digest Generators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compileDailyBrief', () => {
    it('returns daily brief structure', async () => {
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(10);
      vi.mocked(prisma.clientError.count).mockResolvedValue(2);
      vi.mocked(prisma.systemAnomaly.count).mockResolvedValue(1);
      vi.mocked(prisma.aIAgentInsight.count).mockResolvedValue(0);
      vi.mocked(prisma.report.count).mockResolvedValue(3);
      vi.mocked(prisma.user.findMany).mockResolvedValue([{ email: 'a@b.com' }, { email: 'b@c.com' }] as never);

      const result = await compileDailyBrief();

      expect(result).toHaveProperty('newSignups', 5);
      expect(result).toHaveProperty('signupEmails');
      expect(result.signupEmails).toContain('a@b.com');
      expect(result).toHaveProperty('errors', 2);
      expect(result).toHaveProperty('anomaliesCount', 1);
      expect(result).toHaveProperty('criticalInsights', 0);
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('pendingReports', 3);
      expect(result).toHaveProperty('date');
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('compileWeeklyAnalytics', () => {
    it('returns weekly analytics with growthWoW', async () => {
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(20)  // newUsersNow (current week)
        .mockResolvedValueOnce(15);  // newUsersPrev (prior week)
      vi.mocked(prisma.automationAction.count).mockResolvedValue(5);
      vi.mocked(prisma.platformCost.aggregate).mockResolvedValue({ _sum: { amount: 150 } } as never);
      vi.mocked(prisma.businessMetric.findMany).mockResolvedValue([]);

      const result = await compileWeeklyAnalytics();

      expect(result.newUsers).toBe(20);
      expect(result.growthWoW).toBeCloseTo(33.3, 0);
      expect(result.automationActions).toBe(5);
      expect(result.totalCost).toBe(150);
      expect(result.weekEnd).toBeDefined();
    });

    it('returns 0 growth when prev period has no users', async () => {
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(10)  // newUsersNow
        .mockResolvedValueOnce(0);  // newUsersPrev -> growthWoW = 0
      vi.mocked(prisma.automationAction.count).mockResolvedValue(0);
      vi.mocked(prisma.platformCost.aggregate).mockResolvedValue({ _sum: { amount: null } } as never);
      vi.mocked(prisma.businessMetric.findMany).mockResolvedValue([]);

      const result = await compileWeeklyAnalytics();

      expect(result.newUsers).toBe(10);
      expect(result.growthWoW).toBe(0);
      expect(result.totalCost).toBe(0);
    });
  });

  describe('compileMonthlyExecutive', () => {
    it('returns monthly executive with net profit', async () => {
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(50)   // newUsersNow
        .mockResolvedValueOnce(40);  // newUsersPrev
      vi.mocked(prisma.platformCost.aggregate).mockResolvedValue({ _sum: { amount: 500 } } as never);
      vi.mocked(prisma.revenueEntry.aggregate).mockResolvedValue({ _sum: { amount: 700 } } as never);

      const result = await compileMonthlyExecutive();

      expect(result.newUsers).toBe(50);
      expect(result.totalCost).toBe(500);
      expect(result.totalRevenue).toBe(700);
      expect(result.netProfit).toBe(200);
      expect(result.month).toMatch(/^\d{4}-\d{2}$/);
    });
  });
});
