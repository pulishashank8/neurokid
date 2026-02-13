import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET } from '@/app/api/owner/users/[id]/export/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';

// Mock NextAuth
vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    default: vi.fn(),
    getServerSession: vi.fn(),
  };
});

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    userRole: {
      findMany: vi.fn(),
    },
    post: {
      findMany: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
    },
    vote: {
      findMany: vi.fn(),
    },
    report: {
      findMany: vi.fn(),
    },
    userFeedback: {
      findMany: vi.fn(),
    },
    userSession: {
      findMany: vi.fn(),
    },
    bookmark: {
      findMany: vi.fn(),
    },
    userConsent: {
      findMany: vi.fn(),
    },
  },
}));

describe('GDPR Data Export API', () => {
  const mockUserId = 'user-123';
  const mockOwnerId = 'owner-456';
  const mockDifferentUserId = 'user-789';

  const createMockRequest = (url: string) => {
    return new NextRequest(url, { method: 'GET' });
  };

  const createMockParams = (id: string) => {
    return Promise.resolve({ id });
  };

  const mockUserData = {
    id: mockUserId,
    email: 'test@example.com',
    emailVerified: new Date('2024-01-01'),
    username: 'testuser',
    role: 'USER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    lastLoginAt: new Date('2024-01-03'),
    isBanned: false,
    bannedUntil: null,
    bannedReason: null,
    profile: {
      username: 'testuser',
      displayName: 'Test User',
      bio: 'Test bio',
      location: 'Test City',
      profilePictureUrl: null,
      relationshipToChild: 'PARENT',
      preferredContactMethod: 'EMAIL',
      timezone: 'UTC',
      isProfileComplete: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    },
    userRoles: [
      {
        id: 'role-1',
        userId: mockUserId,
        role: 'USER',
        assignedAt: new Date('2024-01-01'),
      },
    ],
    childProfiles: [
      {
        id: 'child-1',
        childName: 'Test Child',
        dateOfBirth: new Date('2020-01-01'),
        diagnosisType: 'AUTISM',
        diagnosisDate: new Date('2022-01-01'),
        severityLevel: 'MODERATE',
        communicationLevel: 'VERBAL',
        supportNeeds: ['Speech therapy'],
        strengths: ['Creative'],
        challenges: ['Social interaction'],
        currentInterventions: ['ABA therapy'],
        schoolInfo: 'Test School',
        medicalInfo: {
          allergies: ['Peanuts'],
          medications: ['None'],
          medicalConditions: ['Autism'],
          emergencyContact: '555-1234',
        },
        therapyGoals: [
          {
            id: 'goal-1',
            goalText: 'Improve communication',
            category: 'COMMUNICATION',
            targetDate: new Date('2024-12-31'),
            status: 'IN_PROGRESS',
            progress: 50,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-15'),
          },
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      },
    ],
    providerProfile: null,
  };

  const mockPosts = [
    {
      id: 'post-1',
      title: 'Test Post',
      content: 'Test content',
      category: { name: 'General' },
      status: 'ACTIVE',
      isAnonymous: false,
      viewCount: 10,
      voteScore: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const mockComments = [
    {
      id: 'comment-1',
      content: 'Test comment',
      postId: 'post-1',
      status: 'ACTIVE',
      isAnonymous: false,
      voteScore: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const mockVotes = [
    {
      id: 'vote-1',
      targetType: 'POST',
      targetId: 'post-1',
      value: 1,
      createdAt: new Date('2024-01-01'),
    },
  ];

  const mockReports = [
    {
      id: 'report-1',
      targetType: 'POST',
      targetId: 'post-2',
      reason: 'Spam',
      status: 'OPEN',
      createdAt: new Date('2024-01-01'),
    },
  ];

  const mockFeedback = [
    {
      id: 'feedback-1',
      type: 'BUG_REPORT',
      rating: null,
      text: 'Found a bug',
      category: 'technical',
      pagePath: '/test',
      createdAt: new Date('2024-01-01'),
    },
  ];

  const mockSessions = [
    {
      id: 'session-1',
      lastActiveAt: new Date('2024-01-03'),
      createdAt: new Date('2024-01-01'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('Authorization', () => {
    it('should allow user to export their own data', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: mockUserId, role: 'USER' },
      });

      (prisma.user.findUnique as any).mockResolvedValue(mockUserData);
      (prisma.post.findMany as any).mockResolvedValue(mockPosts);
      (prisma.comment.findMany as any).mockResolvedValue(mockComments);
      (prisma.vote.findMany as any).mockResolvedValue(mockVotes);
      (prisma.report.findMany as any).mockResolvedValue(mockReports);
      (prisma.userFeedback.findMany as any).mockResolvedValue(mockFeedback);
      (prisma.userSession.findMany as any).mockResolvedValue(mockSessions);

      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
    });

    it('should return 403 if user tries to export another user data', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: mockUserId, role: 'USER' },
      });

      const request = createMockRequest('http://localhost:3000/api/owner/users/user-789/export');
      const params = createMockParams(mockDifferentUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });

    it('should allow owner to export any user data', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: mockOwnerId, role: 'OWNER' },
      });

      // Mock owner's roles
      (prisma.userRole.findMany as any).mockResolvedValue([{
        id: 'owner-role',
        userId: mockOwnerId,
        role: 'OWNER',
        assignedAt: new Date('2024-01-01'),
      }]);

      (prisma.user.findUnique as any).mockResolvedValue(mockUserData);
      (prisma.post.findMany as any).mockResolvedValue(mockPosts);
      (prisma.comment.findMany as any).mockResolvedValue(mockComments);
      (prisma.vote.findMany as any).mockResolvedValue(mockVotes);
      (prisma.report.findMany as any).mockResolvedValue(mockReports);
      (prisma.userFeedback.findMany as any).mockResolvedValue(mockFeedback);
      (prisma.userSession.findMany as any).mockResolvedValue(mockSessions);
      (prisma.bookmark.findMany as any).mockResolvedValue([]);
      (prisma.userConsent.findMany as any).mockResolvedValue([]);

      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
    });
  });

  describe('Data Export', () => {
    beforeEach(() => {
      (getServerSession as any).mockResolvedValue({
        user: { id: mockUserId, role: 'USER' },
      });

      (prisma.user.findUnique as any).mockResolvedValue(mockUserData);
      (prisma.post.findMany as any).mockResolvedValue(mockPosts);
      (prisma.comment.findMany as any).mockResolvedValue(mockComments);
      (prisma.vote.findMany as any).mockResolvedValue(mockVotes);
      (prisma.report.findMany as any).mockResolvedValue(mockReports);
      (prisma.userFeedback.findMany as any).mockResolvedValue(mockFeedback);
      (prisma.userSession.findMany as any).mockResolvedValue(mockSessions);
    });

    it('should return 404 if user does not exist', async () => {
      // Mock as owner to bypass authorization and reach the user not found check
      (getServerSession as any).mockResolvedValue({
        user: { id: mockOwnerId, role: 'OWNER' },
      });
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.userRole.findMany as any).mockResolvedValue([{
        id: 'owner-role',
        userId: mockOwnerId,
        role: 'OWNER',
        assignedAt: new Date('2024-01-01'),
      }]);

      const request = createMockRequest('http://localhost:3000/api/owner/users/nonexistent/export');
      const params = createMockParams('nonexistent');

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should export all user personal information', async () => {
      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.personalInformation).toBeDefined();
      expect(data.personalInformation.email).toBe('test@example.com');
      expect(data.personalInformation.userId).toBe(mockUserId);
    });

    it('should include profile information', async () => {
      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.profile).toBeDefined();
      expect(data.profile.displayName).toBe('Test User');
      expect(data.profile.bio).toBe('Test bio');
    });

    it('should include roles', async () => {
      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.roles).toBeDefined();
      expect(Array.isArray(data.roles)).toBe(true);
    });

    it('should include all community activity (posts, comments, votes, reports)', async () => {
      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.communityActivity).toBeDefined();
      expect(data.communityActivity.posts).toBeDefined();
      expect(data.communityActivity.posts.total).toBe(1);
      expect(data.communityActivity.posts.items[0].title).toBe('Test Post');

      expect(data.communityActivity.comments.total).toBe(1);
      expect(data.communityActivity.comments.items[0].content).toBe('Test comment');

      expect(data.communityActivity.votes.total).toBe(1);
      expect(data.communityActivity.votes.items[0].value).toBe(1);

      expect(data.communityActivity.reports.total).toBe(1);
      expect(data.communityActivity.reports.items[0].reason).toBe('Spam');
    });

    it('should include feedback data', async () => {
      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.feedback).toBeDefined();
      expect(data.feedback.total).toBe(1);
      expect(data.feedback.items[0].type).toBe('BUG_REPORT');
      expect(data.feedback.items[0].text).toBe('Found a bug');
    });

    it('should include session data (last 100 sessions)', async () => {
      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.sessions.total).toBe(1);
      expect(data.sessions.recentSessions).toHaveLength(1);
    });

    it('should include export metadata with GDPR compliance note', async () => {
      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.exportMetadata).toBeDefined();
      expect(data.exportMetadata.exportedAt).toBeDefined();
      expect(data.exportMetadata.dataSubject).toBe(mockUserId);
      expect(data.exportMetadata.exportFormat).toBe('JSON');
      expect(data.exportMetadata.gdprCompliance).toContain('GDPR Article 20');
    });

    it('should return JSON response', async () => {
      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeDefined();
      expect(data.exportMetadata).toBeDefined();
    });

    it('should handle users with no roles', async () => {
      const userWithoutRoles = { ...mockUserData, userRoles: [] };
      (prisma.user.findUnique as any).mockResolvedValue(userWithoutRoles);
      (prisma.userRole.findMany as any).mockResolvedValue([]);
      (prisma.post.findMany as any).mockResolvedValue([]);
      (prisma.comment.findMany as any).mockResolvedValue([]);
      (prisma.vote.findMany as any).mockResolvedValue([]);
      (prisma.report.findMany as any).mockResolvedValue([]);
      (prisma.userFeedback.findMany as any).mockResolvedValue([]);
      (prisma.userSession.findMany as any).mockResolvedValue([]);
      (prisma.bookmark.findMany as any).mockResolvedValue([]);
      (prisma.userConsent.findMany as any).mockResolvedValue([]);

      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.roles).toEqual([]);
    });

    it('should handle users with no community activity', async () => {
      (prisma.userRole.findMany as any).mockResolvedValue(mockUserData.userRoles || []);
      (prisma.post.findMany as any).mockResolvedValue([]);
      (prisma.comment.findMany as any).mockResolvedValue([]);
      (prisma.vote.findMany as any).mockResolvedValue([]);
      (prisma.report.findMany as any).mockResolvedValue([]);
      (prisma.userFeedback.findMany as any).mockResolvedValue([]);
      (prisma.userSession.findMany as any).mockResolvedValue([]);
      (prisma.bookmark.findMany as any).mockResolvedValue([]);
      (prisma.userConsent.findMany as any).mockResolvedValue([]);

      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.communityActivity.posts.total).toBe(0);
      expect(data.communityActivity.comments.total).toBe(0);
      expect(data.communityActivity.votes.total).toBe(0);
      expect(data.communityActivity.reports.total).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 if database query fails', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: mockUserId, role: 'USER' },
      });

      (prisma.user.findUnique as any).mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('http://localhost:3000/api/owner/users/user-123/export');
      const params = createMockParams(mockUserId);

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Internal server error');
    });
  });
});
