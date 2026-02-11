import { resetMockData } from '../setup';
import { GET, POST } from '@/app/api/rhymes/save/route';
import { createTestUser, createMockSession } from '../helpers/auth';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

import { getServerSession } from 'next-auth';

const prisma = getTestPrisma();

describe('Rhymes Save API Integration Tests', () => {
  let testUser: any;
  let mockSession: any;

  beforeEach(async () => {
    resetMockData();
    const uniqueId = Date.now();
    testUser = await createTestUser(
      `rhyme-${uniqueId}@example.com`,
      'password123',
      `rhymeuser${uniqueId}`
    );
    mockSession = createMockSession(testUser);
  });

  describe('GET /api/rhymes/save', () => {
    it('should return empty savedIds when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.savedIds).toEqual([]);
    });

    it('should return saved rhyme IDs for user', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      await prisma.savedRhyme.create({
        data: { userId: testUser.id, rhymeId: 'rhyme-1' },
      });
      await prisma.savedRhyme.create({
        data: { userId: testUser.id, rhymeId: 'rhyme-2' },
      });

      const response = await GET();
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.savedIds).toContain('rhyme-1');
      expect(data.savedIds).toContain('rhyme-2');
    });
  });

  describe('POST /api/rhymes/save', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockRequest('POST', '/api/rhymes/save', {
        body: { rhymeId: 'rhyme-1' },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should save a rhyme', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/rhymes/save', {
        body: { rhymeId: 'rhyme-1' },
      });
      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.saved).toBe(true);

      const saved = await prisma.savedRhyme.findMany({
        where: { userId: testUser.id },
      });
      expect(saved.some(s => s.rhymeId === 'rhyme-1')).toBe(true);
    });

    it('should unsave when rhyme already saved', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      await prisma.savedRhyme.create({
        data: { userId: testUser.id, rhymeId: 'rhyme-1' },
      });

      const request = createMockRequest('POST', '/api/rhymes/save', {
        body: { rhymeId: 'rhyme-1' },
      });
      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.saved).toBe(false);
    });

    it('should reject missing rhymeId', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/rhymes/save', {
        body: {},
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
