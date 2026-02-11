import { resetMockData } from '../setup';
import { GET, POST } from '@/app/api/therapy-sessions/route';
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

describe('Therapy Sessions API Integration Tests', () => {
  let testUser: any;
  let mockSession: any;

  beforeEach(async () => {
    resetMockData();
    const uniqueId = Date.now();
    testUser = await createTestUser(
      `therapy-${uniqueId}@example.com`,
      'password123',
      `therapyuser${uniqueId}`
    );
    mockSession = createMockSession(testUser);
  });

  describe('GET /api/therapy-sessions', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockRequest('GET', '/api/therapy-sessions');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return empty sessions for new user', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('GET', '/api/therapy-sessions');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.sessions).toEqual([]);
    });

    it('should return user sessions', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      await prisma.therapySession.create({
        data: {
          userId: testUser.id,
          childName: 'Alex',
          therapistName: 'Dr. Smith',
          therapyType: 'SPEECH',
          sessionDate: new Date('2025-01-15'),
          duration: 60,
        },
      });

      const request = createMockRequest('GET', '/api/therapy-sessions');
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.sessions.length).toBe(1);
      expect(data.sessions[0].childName).toBe('Alex');
      expect(data.sessions[0].therapyType).toBe('SPEECH');
    });

    it('should filter by childName when provided', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      await prisma.therapySession.create({
        data: {
          userId: testUser.id,
          childName: 'Alex',
          therapistName: 'Dr. Smith',
          therapyType: 'SPEECH',
          sessionDate: new Date('2025-01-15'),
        },
      });
      await prisma.therapySession.create({
        data: {
          userId: testUser.id,
          childName: 'Sam',
          therapistName: 'Dr. Jones',
          therapyType: 'OT',
          sessionDate: new Date('2025-01-14'),
        },
      });

      const request = createMockRequest('GET', '/api/therapy-sessions', {
        searchParams: { childName: 'Alex' },
      });
      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.sessions.length).toBe(1);
      expect(data.sessions[0].childName).toBe('Alex');
    });
  });

  describe('POST /api/therapy-sessions', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockRequest('POST', '/api/therapy-sessions', {
        body: {
          childName: 'Alex',
          therapistName: 'Dr. Smith',
          therapyType: 'SPEECH',
          sessionDate: '2025-01-15',
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should create therapy session successfully', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/therapy-sessions', {
        body: {
          childName: 'Alex',
          therapistName: 'Dr. Smith',
          therapyType: 'SPEECH',
          sessionDate: '2025-01-15T10:00:00Z',
          duration: 45,
          notes: 'Good progress on articulation',
        },
      });
      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.session).toBeDefined();
      expect(data.session.childName).toBe('Alex');
      expect(data.session.therapistName).toBe('Dr. Smith');
      expect(data.session.therapyType).toBe('SPEECH');
    });

    it('should reject missing required fields', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/therapy-sessions', {
        body: {
          childName: 'Alex',
          // missing therapistName, therapyType, sessionDate
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
