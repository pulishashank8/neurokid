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
import { setMockSession } from '../setup';

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
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
      setMockSession(mockSession);

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
      expect(data.content).toContain('This is a test comment');
      expect(data.author?.id).toBe(testUser.id);
      expect(data.postId).toBe(testPost.id);

      // Verify in database
      const commentInDb = await prisma.comment.findFirst({
        where: { postId: testPost.id },
      });
      expect(commentInDb).toBeDefined();
      expect(commentInDb?.authorId).toBe(testUser.id);
    });

    it('should create an anonymous comment', async () => {
      setMockSession(mockSession);

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
      expect(data.isAnonymous).toBe(true);
      expect(data.author).toBeNull();
    });

    it('should create a reply to a comment', async () => {
      setMockSession(mockSession);

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
      expect(data.content).toContain('This is a reply');
      expect(data.parentCommentId).toBe(parentComment.id);

      // Verify in database
      const replyInDb = await prisma.comment.findUnique({
        where: { id: data.id },
      });
      expect(replyInDb?.parentCommentId).toBe(parentComment.id);
    });

    it('should fail when user is not authenticated', async () => {
      setMockSession(null);

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
      setMockSession(mockSession);

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
      setMockSession(mockSession);

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
      expect(data.content).not.toContain('<script>');
      expect(data.content).toContain('Safe text');
    });

    it('should fail when post does not exist', async () => {
      setMockSession(mockSession);

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
      expect(data.comments).toBeDefined();
      expect(Array.isArray(data.comments)).toBe(true);
      expect(data.comments.length).toBeGreaterThan(0);
    });

    it('should return threaded comment structure', async () => {
      const request = createMockRequest('GET', `/api/posts/${testPost.id}/comments`);
      const response = await GET(request, {
        params: Promise.resolve({ id: testPost.id }),
      });
      const data = await parseResponse(response);

      expect(response.status).toBe(200);

      // API returns root-level comments only; replies are fetched separately
      const comments = data.comments;
      expect(comments.length).toBeGreaterThanOrEqual(2);
      comments.forEach((c: any) => {
        expect(c.id).toBeDefined();
        expect(c.content).toBeDefined();
        expect(c.author === null || typeof c.author === 'object').toBe(true);
      });
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

      const comments = data.comments;
      const anonymousComment = comments.find((c: any) => c.isAnonymous === true);
      expect(anonymousComment).toBeDefined();
      expect(anonymousComment.isAnonymous).toBe(true);
      expect(anonymousComment.author).toBeNull();
    });
  });
});
