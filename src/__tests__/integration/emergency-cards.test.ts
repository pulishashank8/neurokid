import { resetMockData } from '../setup';
import { GET, POST } from '@/app/api/emergency-cards/route';
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
  RateLimits: { emergencyCardRead: {}, emergencyCardCreate: {} },
  enforceRateLimit: vi.fn().mockResolvedValue(null),
}));

import { getServerSession } from 'next-auth';

const prisma = getTestPrisma();

describe('Emergency Cards API Integration Tests', () => {
  let testUser: any;
  let mockSession: any;

  beforeEach(async () => {
    resetMockData();
    const uniqueId = Date.now();
    testUser = await createTestUser(
      `emergency-${uniqueId}@example.com`,
      'password123',
      `emergencyuser${uniqueId}`
    );
    mockSession = createMockSession(testUser);
  });

  describe('GET /api/emergency-cards', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockRequest('GET', '/api/emergency-cards');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return empty cards for new user', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('GET', '/api/emergency-cards');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.cards).toEqual([]);
    });

    it('should return user cards', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      // Create via POST to ensure encryption is applied
      const createReq = createMockRequest('POST', '/api/emergency-cards', {
        body: { childName: 'Alex', childAge: 5, diagnosis: 'ASD' },
      });
      await POST(createReq);

      const request = createMockRequest('GET', '/api/emergency-cards');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.cards.length).toBe(1);
      expect(data.cards[0].childName).toBe('Alex');
    });
  });

  describe('POST /api/emergency-cards', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockRequest('POST', '/api/emergency-cards', {
        body: { childName: 'Alex' },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should create emergency card successfully', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/emergency-cards', {
        body: {
          childName: 'Alex',
          childAge: 5,
          diagnosis: 'ASD',
          triggers: 'Loud noises',
          calmingStrategies: 'Deep breathing',
        },
      });
      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.card).toBeDefined();
      expect(data.card.childName).toBe('Alex');
    });

    it('should reject missing childName', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/emergency-cards', {
        body: {},
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
