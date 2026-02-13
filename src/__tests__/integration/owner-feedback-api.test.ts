import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getFeedback } from '@/app/api/owner/feedback/route';
import { GET as getQuickReactions } from '@/app/api/owner/feedback/quick-reactions/route';
import { GET as getNPS } from '@/app/api/owner/nps/route';
import { createMockRequest, parseResponse } from '../helpers/api';

vi.mock('@/lib/admin-auth', () => ({
  isAdminAuthenticated: vi.fn().mockResolvedValue(true),
}));

describe('Owner Feedback API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/owner/feedback', () => {
    it('should return feedbacks and counts', async () => {
      const request = createMockRequest('GET', '/api/owner/feedback', {
        searchParams: { hours: '168', limit: '20' },
      });
      const response = await getFeedback(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.feedbacks).toBeDefined();
      expect(Array.isArray(data.feedbacks)).toBe(true);
      expect(data.counts).toBeDefined();
      expect(typeof data.counts).toBe('object');
    });

    it('should filter by type when provided', async () => {
      const request = createMockRequest('GET', '/api/owner/feedback', {
        searchParams: { type: 'NPS', hours: '168' },
      });
      const response = await getFeedback(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.feedbacks).toBeDefined();
      expect(Array.isArray(data.feedbacks)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const { isAdminAuthenticated } = await import('@/lib/admin-auth');
      vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false);

      const request = createMockRequest('GET', '/api/owner/feedback');
      const response = await getFeedback(request);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/owner/feedback/quick-reactions', () => {
    it('should return quick reaction averages', async () => {
      const request = createMockRequest('GET', '/api/owner/feedback/quick-reactions', {
        searchParams: { hours: '720' },
      });
      const response = await getQuickReactions(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('avg');
      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('byCategory');
      expect(typeof data.byCategory).toBe('object');
    });

    it('should return 401 when not authenticated', async () => {
      const { isAdminAuthenticated } = await import('@/lib/admin-auth');
      vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false);

      const request = createMockRequest('GET', '/api/owner/feedback/quick-reactions');
      const response = await getQuickReactions(request);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/owner/nps', () => {
    it('should return NPS metrics', async () => {
      const request = createMockRequest('GET', '/api/owner/nps', {
        searchParams: { period: 'week' },
      });
      const response = await getNPS(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(typeof data.score).toBe('number');
      expect(typeof data.promoters).toBe('number');
      expect(typeof data.passives).toBe('number');
      expect(typeof data.detractors).toBe('number');
      expect(typeof data.total).toBe('number');
      expect(data.trend).toBeDefined();
      expect(Array.isArray(data.trend)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const { isAdminAuthenticated } = await import('@/lib/admin-auth');
      vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false);

      const request = createMockRequest('GET', '/api/owner/nps');
      const response = await getNPS(request);
      expect(response.status).toBe(401);
    });
  });
});
