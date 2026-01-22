import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/posts/route';
import { GET as getPost, PATCH, DELETE } from '@/app/api/posts/[id]/route';
import {
  createTestUser,
  createMockSession,
  createTestPost,
  getSeededCategory,
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

describe('Posts API Integration Tests', () => {
  let testUser: any;
  let testCategory: any;
  let mockSession: any;

  beforeEach(async () => {
    // Create test user
    testUser = await createTestUser('post-test@example.com', 'password123', 'posttester');

    // Use existing seeded category
    testCategory = await getSeededCategory('general-discussion');

    mockSession = createMockSession(testUser);
  });

  describe('POST /api/posts - Create Post', () => {
    it('should create a new post successfully', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/posts', {
        body: {
          title: 'My First Post',
          content: '<p>This is my first post content</p>',
          categoryId: testCategory.id,
          isAnonymous: false,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.title).toBe('My First Post');
      expect(data.content).toContain('This is my first post content');
      expect(data.category.id).toBe(testCategory.id);
      expect(data.author.id).toBe(testUser.id);

      // Verify in database
      const postInDb = await prisma.post.findFirst({
        where: { title: 'My First Post' },
      });
      expect(postInDb).toBeDefined();
      expect(postInDb?.authorId).toBe(testUser.id);
    });

    it('should create an anonymous post', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/posts', {
        body: {
          title: 'Anonymous Post',
          content: '<p>Anonymous content</p>',
          categoryId: testCategory.id,
          isAnonymous: true,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.isAnonymous).toBe(true);
      expect(data.author.username).toBe('Anonymous');
    });

    it('should fail when user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = createMockRequest('POST', '/api/posts', {
        body: {
          title: 'Test Post',
          content: '<p>Content</p>',
          categoryId: testCategory.id,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should fail with invalid data (missing title)', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/posts', {
        body: {
          content: '<p>Content</p>',
          categoryId: testCategory.id,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should sanitize malicious HTML content', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = createMockRequest('POST', '/api/posts', {
        body: {
          title: 'XSS Test',
          content: '<p>Normal text</p><script>alert("XSS")</script>',
          categoryId: testCategory.id,
        },
      });

      const response = await POST(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(201);
      expect(data.content).not.toContain('<script>');
      expect(data.content).toContain('Normal text');
    });
  });

  describe('GET /api/posts - List Posts', () => {
    beforeEach(async () => {
      // Create multiple test posts
      await createTestPost(testUser.id, testCategory.id, {
        title: 'Post 1',
        content: '<p>Content 1</p>',
      });
      await createTestPost(testUser.id, testCategory.id, {
        title: 'Post 2',
        content: '<p>Content 2</p>',
      });
      await createTestPost(testUser.id, testCategory.id, {
        title: 'Post 3',
        content: '<p>Content 3</p>',
      });
    });

    it('should list posts with default pagination', async () => {
      const request = createMockRequest('GET', '/api/posts', {
        searchParams: { limit: '10', sort: 'new' },
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.posts).toBeDefined();
      expect(Array.isArray(data.posts)).toBe(true);
      expect(data.posts.length).toBeGreaterThan(0);
      expect(data.posts.length).toBeLessThanOrEqual(10);
    });

    it('should respect limit parameter', async () => {
      const request = createMockRequest('GET', '/api/posts', {
        searchParams: { limit: '2', sort: 'new' },
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.posts.length).toBeLessThanOrEqual(2);
    });

    it('should filter by category', async () => {
      const request = createMockRequest('GET', '/api/posts', {
        searchParams: {
          limit: '10',
          sort: 'new',
          categoryId: testCategory.id,
        },
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.posts.every((p: any) => p.category.id === testCategory.id)).toBe(true);
    });

    it('should sort posts by new (most recent first)', async () => {
      const request = createMockRequest('GET', '/api/posts', {
        searchParams: { limit: '10', sort: 'new' },
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);

      // Verify posts are sorted by creation date (newest first)
      for (let i = 1; i < data.posts.length; i++) {
        const prev = new Date(data.posts[i - 1].createdAt);
        const curr = new Date(data.posts[i].createdAt);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });

    it('should return pagination metadata', async () => {
      const request = createMockRequest('GET', '/api/posts', {
        searchParams: { limit: '2', sort: 'new' },
      });

      const response = await GET(request);
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.pagination).toBeDefined();
      expect(typeof data.pagination.hasMore).toBe('boolean');
    });
  });

  describe('GET /api/posts/:id - Get Post Details', () => {
    it('should get a single post by ID', async () => {
      const post = await createTestPost(testUser.id, testCategory.id, {
        title: 'Detailed Post',
        content: '<p>Detailed content</p>',
      });

      const request = createMockRequest('GET', `/api/posts/${post.id}`);
      const response = await getPost(request, { params: Promise.resolve({ id: post.id }) });
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.id).toBe(post.id);
      expect(data.title).toBe('Detailed Post');
      expect(data.content).toContain('Detailed content');
      expect(data.category).toBeDefined();
      expect(data.author).toBeDefined();
    });

    it('should return 404 for non-existent post', async () => {
      const request = createMockRequest('GET', '/api/posts/non-existent-id');
      const response = await getPost(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const data = await parseResponse(response);

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should hide author info for anonymous posts', async () => {
      const post = await createTestPost(testUser.id, testCategory.id, {
        title: 'Anonymous Post',
        content: '<p>Content</p>',
        isAnonymous: true,
      });

      const request = createMockRequest('GET', `/api/posts/${post.id}`);
      const response = await getPost(request, { params: Promise.resolve({ id: post.id }) });
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.isAnonymous).toBe(true);
      expect(data.author.username).toBe('Anonymous');
    });
  });

  describe('PATCH /api/posts/:id - Update Post', () => {
    it('should update post by author', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const post = await createTestPost(testUser.id, testCategory.id, {
        title: 'Original Title',
        content: '<p>Original content</p>',
      });

      const request = createMockRequest('PATCH', `/api/posts/${post.id}`, {
        body: {
          title: 'Updated Title',
          content: '<p>Updated content</p>',
        },
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: post.id }) });
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Title');
      expect(data.content).toContain('Updated content');

      // Verify in database
      const updatedPost = await prisma.post.findUnique({
        where: { id: post.id },
      });
      expect(updatedPost?.title).toBe('Updated Title');
    });

    it('should fail when user is not the author', async () => {
      const anotherUser = await createTestUser('another@example.com', 'password', 'another');
      vi.mocked(getServerSession).mockResolvedValue(createMockSession(anotherUser));

      const post = await createTestPost(testUser.id, testCategory.id, {
        title: 'Original Title',
        content: '<p>Original content</p>',
      });

      const request = createMockRequest('PATCH', `/api/posts/${post.id}`, {
        body: {
          title: 'Hacked Title',
        },
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: post.id }) });
      const data = await parseResponse(response);

      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('should fail when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const post = await createTestPost(testUser.id, testCategory.id, {
        title: 'Original Title',
        content: '<p>Original content</p>',
      });

      const request = createMockRequest('PATCH', `/api/posts/${post.id}`, {
        body: {
          title: 'Updated Title',
        },
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: post.id }) });
      const data = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });

  describe('DELETE /api/posts/:id - Soft Delete Post', () => {
    it('should soft delete post by author', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const post = await createTestPost(testUser.id, testCategory.id, {
        title: 'Post to Delete',
        content: '<p>Content</p>',
      });

      const request = createMockRequest('DELETE', `/api/posts/${post.id}`);
      const response = await DELETE(request, { params: Promise.resolve({ id: post.id }) });
      const data = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();

      // Verify soft delete in database
      const deletedPost = await prisma.post.findUnique({
        where: { id: post.id },
      });
      expect(deletedPost?.status).toBe('REMOVED');
    });

    it('should fail to delete when not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const post = await createTestPost(testUser.id, testCategory.id, {
        title: 'Post to Delete',
        content: '<p>Content</p>',
      });

      const request = createMockRequest('DELETE', `/api/posts/${post.id}`);
      const response = await DELETE(request, { params: Promise.resolve({ id: post.id }) });
      const data = await parseResponse(response);

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should fail to delete another users post', async () => {
      const anotherUser = await createTestUser('another2@example.com', 'password', 'another2');
      vi.mocked(getServerSession).mockResolvedValue(createMockSession(anotherUser));

      const post = await createTestPost(testUser.id, testCategory.id, {
        title: 'Post to Delete',
        content: '<p>Content</p>',
      });

      const request = createMockRequest('DELETE', `/api/posts/${post.id}`);
      const response = await DELETE(request, { params: Promise.resolve({ id: post.id }) });
      const data = await parseResponse(response);

      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();

      // Verify post was NOT deleted
      const notDeletedPost = await prisma.post.findUnique({
        where: { id: post.id },
      });
      expect(notDeletedPost?.status).toBe('ACTIVE');
    });
  });
});
