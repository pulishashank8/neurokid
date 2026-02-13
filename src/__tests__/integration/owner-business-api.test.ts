import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getBusiness } from '@/app/api/owner/business/route';
import { createMockRequest, parseResponse } from '../helpers/api';

vi.mock('@/lib/admin-auth', () => ({
  isAdminAuthenticated: vi.fn().mockResolvedValue(true),
}));

const mockGetBusinessMetrics = vi.fn().mockResolvedValue([]);
const mockRunBusinessIntelligenceCalculation = vi.fn().mockResolvedValue({ success: true });

vi.mock('@/lib/owner/business-intelligence', () => ({
  runBusinessIntelligenceCalculation: (...args: unknown[]) => mockRunBusinessIntelligenceCalculation(...args),
  getBusinessMetrics: (...args: unknown[]) => mockGetBusinessMetrics(...args),
}));

describe('Owner Business API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBusinessMetrics.mockResolvedValue([
      { metricName: 'DAU', metricValue: 10, period: 'daily', periodDate: new Date().toISOString() },
      { metricName: 'CAC', metricValue: 5, period: 'monthly', periodDate: new Date().toISOString() },
    ]);
    mockRunBusinessIntelligenceCalculation.mockResolvedValue({ success: true });
  });

  describe('GET /api/owner/business', () => {
    it('should return business metrics', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/owner/business', {
        searchParams: { period: 'monthly', days: '90' },
      });
      const response = await getBusiness(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.metrics).toBeDefined();
      expect(Array.isArray(data.metrics)).toBe(true);
      expect(mockGetBusinessMetrics).toHaveBeenCalledWith(
        expect.objectContaining({ period: 'monthly', daysBack: 90 })
      );
    });

    it('should accept compute=true to run BI calculation', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/owner/business', {
        searchParams: { period: 'monthly', days: '90', compute: 'true' },
      });
      const response = await getBusiness(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.metrics).toBeDefined();
      expect(data.computed).toBe(true);
      expect(mockRunBusinessIntelligenceCalculation).toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      const { isAdminAuthenticated } = await import('@/lib/admin-auth');
      vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false);

      const request = createMockRequest('GET', 'http://localhost:3000/api/owner/business');
      const response = await getBusiness(request);
      expect(response.status).toBe(401);
      expect(mockGetBusinessMetrics).not.toHaveBeenCalled();
    });
  });
});
