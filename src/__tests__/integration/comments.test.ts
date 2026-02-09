import { resetMockData } from '../setup';
import { GET, POST } from '@/app/api/posts/[id]/comments/route';
import {
  createTestUser,
  createMockSession,
  getSeededCategory,
  createTestPost,
  createTestComment,
} from '../helpers/auth';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';
import { getServerSession } from 'next-auth';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

// Mock @/lib/auth
vi.mock('@/lib/auth', () => ({
  getServerSession: vi.fn(),
  authOptions: {},
}));

const prisma = getTestPrisma();

describe('Comments API Integration Tests', () => {
  let testUser: any;
  let testCategory: any;
  let testPost: any;
  let mockSession: any;

  beforeEach(async () => {
        resetMockData();
    // Unique user to prevent conflicts
    const uniqueId = Date.now();
    testUser = await createTestUser(`comment-test-${uniqueId}@example.com`, 'password123', `commenttester${uniqueId}`);

    testCategory = await getSeededCategory('general-discussion');
    testPost = await createTestPost(testUser.id, testCategory.id, {
      title: 'Test Post for Comments',
      content: '<p>Content</p>',
    });
    mockSession = createMockSession(testUser);
  });

  describe('POST /api/posts/:id/comments - Create Comment', () => {
    it('should create a comment on a post', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', `/api/posts/${testPost.id}/comments`, {
        body: {
          content: '<p>This is a test comment</p>',
          isAnonymous: false,
        },
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.data.content).toContain('This is a test comment');
      expect(data.data.author.id).toBe(testUser.id);
      expect(data.data.postId).toBe(testPost.id);

      // Verify in database
      const commentInDb = await prisma.comment.findFirst({
        where: { postId: testPost.id },
      });
      expect(commentInDb).toBeDefined();
      expect(commentInDb?.authorId).toBe(testUser.id);
    });

    it('should create an anonymous comment', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', `/api/posts/${testPost.id}/comments`, {
        body: {
          content: '<p>Anonymous comment</p>',
          isAnonymous: true,
        },
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.data.isAnonymous).toBe(true);
      expect(data.data.author.username).toBe('Anonymous');
    });

    it('should create a reply to a comment', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      // First, create a parent comment
      const parentComment = await createTestComment(
        testUser.id,
        testPost.id,
        '<p>Parent comment</p>'
      );

      // Create a reply
      const request = createMockRequest('POST', `/api/posts/${testPost.id}/comments`, {
        body: {
          content: '<p>This is a reply</p>',
          parentCommentId: parentComment.id,
          isAnonymous: false,
        },
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const data = await parseResponse(response);

      if (response.status !== 201) {
        console.log('Create Reply Failed:', JSON.stringify(data, null, 2));
      }

      expect(response.status).toBe(201);
      expect(data.data.content).toContain('This is a reply');
      expect(data.data.parentCommentId).toBe(parentComment.id);

      // Verify in database
      const replyInDb = await prisma.comment.findUnique({
        where: { id: data.data.id },
      });
      expect(replyInDb?.parentCommentId).toBe(parentComment.id);
    });

    it('should fail when user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockRequest('POST', `/api/posts/${testPost.id}/comments`, {
        body: {
          content: '<p>Test comment</p>',
        },
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const data = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should fail with invalid data (empty content)', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', `/api/posts/${testPost.id}/comments`, {
        body: {
          content: '',
        },
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should sanitize malicious HTML in comments', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', `/api/posts/${testPost.id}/comments`, {
        body: {
          content: '<p>Safe text</p><script>alert("XSS")</script>',
          isAnonymous: false,
        },
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const data = await parseResponse(response);

      if (response.status !== 201) {
        console.log('XSS Test Failed:', JSON.stringify(data, null, 2));
      }

      expect(response.status).toBe(201);
      expect(data.data.content).not.toContain('<script>');
      expect(data.data.content).toContain('Safe text');
    });

    it('should fail when post does not exist', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/posts/non-existent-id/comments', {
        body: {
          content: '<p>Test comment</p>',
        },
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const data = await parseResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/posts/:id/comments - Get Comments Thread', () => {
    beforeEach(async () => {
      // Create a comment thread structure
      const comment1 = await createTestComment(
        testUser.id,
        testPost.id,
        '<p>First comment</p>'
      );
      await createTestComment(
        testUser.id,
        testPost.id,
        '<p>Second comment</p>'
      );
      // Reply to first comment
      await createTestComment(
        testUser.id,
        testPost.id,
        '<p>Reply to first</p>',
        comment1.id
      );
    });

    it('should get all comments for a post', async () => {
      const request = createMockRequest('GET', `/api/posts/${testPost.id}/comments`);
      const response = await GET(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.data.comments).toBeDefined(); // Use data.data.comments!
      expect(Array.isArray(data.data.comments)).toBe(true);
      expect(data.data.comments.length).toBeGreaterThan(0);
    });

    it('should return threaded comment structure', async () => {
      const request = createMockRequest('GET', `/api/posts/${testPost.id}/comments`);
      const response = await GET(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const data = await parseResponse(response);

      expect(response.status).toBe(200);

      // The API returns { comments: [...] }
      const comments = data.data.comments;

      // Find root comments (those without parentCommentId)
      const rootComments = comments.filter((c: any) => !c.parentCommentId);
      expect(rootComments.length).toBeGreaterThan(0);

      // Check if root comments have children
      const commentWithReplies = rootComments.find((c: any) => c.children && c.children.length > 0);
      expect(commentWithReplies).toBeDefined();
      expect(commentWithReplies.children[0].parentCommentId).toBe(commentWithReplies.id);
    });

    it('should return 404 for non-existent post', async () => {
      const request = createMockRequest('GET', '/api/posts/non-existent-id/comments');
      const response = await GET(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const data = await parseResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should hide author info for anonymous comments', async () => {
      // Create anonymous comment
      await prisma.comment.create({
        data: {
          content: '<p>Anonymous comment</p>',
          authorId: testUser.id,
          postId: testPost.id,
          isAnonymous: true,
          status: 'ACTIVE',
          voteScore: 0,
        },
      });

      const request = createMockRequest('GET', `/api/posts/${testPost.id}/comments`);
      const response = await GET(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const data = await parseResponse(response);

      expect(response.status).toBe(200);

      const comments = data.data.comments;
      const anonymousComment = comments.find((c: any) => c.isAnonymous === true);
      expect(anonymousComment).toBeDefined();
      expect(anonymousComment.author.username).toBe('Anonymous');
    });
  });
});
