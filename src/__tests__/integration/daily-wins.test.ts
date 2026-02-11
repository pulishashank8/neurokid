import { resetMockData } from '../setup';
import { GET, POST } from '@/app/api/daily-wins/route';
import { createTestUser, createMockSession } from '../helpers/auth';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

vi.mock('@/lib/rate-limit', () => ({
  RateLimits: { postCreate: {} },
  enforceRateLimit: vi.fn().mockResolvedValue(null),
}));

import { getServerSession } from 'next-auth';

const prisma = getTestPrisma();

describe('Daily Wins API Integration Tests', () => {
  let testUser: any;
  let mockSession: any;

  beforeEach(async () => {
    resetMockData();
    const uniqueId = Date.now();
    testUser = await createTestUser(
      `dailywin-${uniqueId}@example.com`,
      'password123',
      `dailywinuser${uniqueId}`
    );
    mockSession = createMockSession(testUser);
  });

  describe('GET /api/daily-wins', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockRequest('GET', '/api/daily-wins');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return empty wins for new user', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('GET', '/api/daily-wins');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.wins).toEqual([]);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(0);
    });

    it('should return user wins with pagination', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      await prisma.dailyWin.create({
        data: {
          userId: testUser.id,
          date: new Date('2025-01-15'),
          content: 'Had a great therapy session today',
          mood: 4,
          category: 'therapy',
        },
      });

      const request = createMockRequest('GET', '/api/daily-wins');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.wins.length).toBe(1);
      expect(data.wins[0].content).toBe('Had a great therapy session today');
      expect(data.pagination.total).toBe(1);
    });

    it('should support limit and offset query params', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('GET', '/api/daily-wins', {
        searchParams: { limit: '5', offset: '0' },
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.wins).toBeDefined();
      expect(data.pagination.limit).toBe(5);
    });
  });

  describe('POST /api/daily-wins', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockRequest('POST', '/api/daily-wins', {
        body: { content: 'My win for today' },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should create daily win successfully', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/daily-wins', {
        body: {
          content: 'My child said their first sentence today!',
          mood: 5,
          category: 'milestone',
        },
      });
      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.win).toBeDefined();
      expect(data.win.content).toBe('My child said their first sentence today!');
      expect(data.win.mood).toBe(5);
    });

    it('should reject empty content', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/daily-wins', {
        body: { content: '' },
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should reject future date', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const request = createMockRequest('POST', '/api/daily-wins', {
        body: {
          content: 'A win',
          date: futureDate.toISOString(),
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
