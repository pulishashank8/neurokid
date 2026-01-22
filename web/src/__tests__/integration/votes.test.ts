import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/votes/route';
import {
  createTestUser,
  createMockSession,
  getSeededCategory,
  createTestPost,
  createTestComment,
} from '../helpers/auth';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

import { getServerSession } from 'next-auth';

const prisma = getTestPrisma();

describe('Votes API Integration Tests', () => {
  let testUser: any;
  let testCategory: any;
  let testPost: any;
  let testComment: any;
  let mockSession: any;

  beforeEach(async () => {
    testUser = await createTestUser('vote-test@example.com', 'password123', 'votetester');
    testCategory = await getSeededCategory('general-discussion');
    testPost = await createTestPost(testUser.id, testCategory.id, {
      title: 'Test Post for Voting',
      content: '<p>Content</p>',
    });
    testComment = await createTestComment(
      testUser.id,
      testPost.id,
      '<p>Test comment for voting</p>'
    );
    mockSession = createMockSession(testUser);
  });

  describe('POST /api/votes - Create/Update Vote', () => {
    it('should upvote a post', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/votes', {
        body: {
          targetType: 'POST',
          targetId: testPost.id,
          value: 1,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.voteScore).toBe(1);

      // Verify in database
      const vote = await prisma.vote.findUnique({
        where: {
          userId_targetId_targetType: {
            userId: testUser.id,
            targetId: testPost.id,
            targetType: 'POST',
          },
        },
      });
      expect(vote).toBeDefined();
      expect(vote?.value).toBe(1);

      // Verify post vote score updated
      const updatedPost = await prisma.post.findUnique({
        where: { id: testPost.id },
      });
      expect(updatedPost?.voteScore).toBe(1);
    });

    it('should downvote a post', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/votes', {
        body: {
          targetType: 'POST',
          targetId: testPost.id,
          value: -1,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.voteScore).toBe(-1);

      // Verify post vote score updated
      const updatedPost = await prisma.post.findUnique({
        where: { id: testPost.id },
      });
      expect(updatedPost?.voteScore).toBe(-1);
    });

    it('should upvote a comment', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/votes', {
        body: {
          targetType: 'COMMENT',
          targetId: testComment.id,
          value: 1,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.voteScore).toBe(1);

      // Verify comment vote score updated
      const updatedComment = await prisma.comment.findUnique({
        where: { id: testComment.id },
      });
      expect(updatedComment?.voteScore).toBe(1);
    });

    it('should change vote from upvote to downvote', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      // First upvote
      await prisma.vote.create({
        data: {
          userId: testUser.id,
          targetId: testPost.id,
          targetType: 'POST',
          value: 1,
        },
      });
      await prisma.post.update({
        where: { id: testPost.id },
        data: { voteScore: 1 },
      });

      // Change to downvote
      const request = createMockRequest('POST', '/api/votes', {
        body: {
          targetType: 'POST',
          targetId: testPost.id,
          value: -1,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.voteScore).toBe(-1);

      // Verify vote changed
      const vote = await prisma.vote.findUnique({
        where: {
          userId_targetId_targetType: {
            userId: testUser.id,
            targetId: testPost.id,
            targetType: 'POST',
          },
        },
      });
      expect(vote?.value).toBe(-1);
    });

    it('should remove vote when value is 0', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      // First create a vote
      await prisma.vote.create({
        data: {
          userId: testUser.id,
          targetId: testPost.id,
          targetType: 'POST',
          value: 1,
        },
      });
      await prisma.post.update({
        where: { id: testPost.id },
        data: { voteScore: 1 },
      });

      // Remove vote
      const request = createMockRequest('POST', '/api/votes', {
        body: {
          targetType: 'POST',
          targetId: testPost.id,
          value: 0,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.voteScore).toBe(0);

      // Verify vote removed
      const vote = await prisma.vote.findUnique({
        where: {
          userId_targetId_targetType: {
            userId: testUser.id,
            targetId: testPost.id,
            targetType: 'POST',
          },
        },
      });
      expect(vote).toBeNull();

      // Verify post vote score updated
      const updatedPost = await prisma.post.findUnique({
        where: { id: testPost.id },
      });
      expect(updatedPost?.voteScore).toBe(0);
    });

    it('should fail when user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockRequest('POST', '/api/votes', {
        body: {
          targetType: 'POST',
          targetId: testPost.id,
          value: 1,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should fail with invalid vote value (not -1, 0, or 1)', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/votes', {
        body: {
          targetType: 'POST',
          targetId: testPost.id,
          value: 5,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should fail when post does not exist', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/votes', {
        body: {
          targetType: 'POST',
          targetId: 'non-existent-post-id',
          value: 1,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should fail when comment does not exist', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/votes', {
        body: {
          targetType: 'COMMENT',
          targetId: 'non-existent-comment-id',
          value: 1,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should calculate correct vote scores with multiple users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      // First user upvotes
      const request1 = createMockRequest('POST', '/api/votes', {
        body: {
          targetType: 'POST',
          targetId: testPost.id,
          value: 1,
        },
      });
      await POST(request1);

      // Create second user
      const testUser2 = await createTestUser('vote-test2@example.com', 'password', 'votetester2');
      vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser2));

      // Second user also upvotes
      const request2 = createMockRequest('POST', '/api/votes', {
        body: {
          targetType: 'POST',
          targetId: testPost.id,
          value: 1,
        },
      });
      const response2 = await POST(request2);
      const data2 = await parseResponse(response2);

      expect(response2.status).toBe(200);
      expect(data2.voteScore).toBe(2);

      // Verify in database
      const updatedPost = await prisma.post.findUnique({
        where: { id: testPost.id },
      });
      expect(updatedPost?.voteScore).toBe(2);
    });
  });
});
