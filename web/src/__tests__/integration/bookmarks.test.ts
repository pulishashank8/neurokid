import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/bookmarks/route';
import {
    createTestUser,
    createMockSession,
    getSeededCategory,
    createTestPost,
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

describe('Bookmarks API Integration Tests', () => {
    let testUser: any;
    let testCategory: any;
    let mockSession: any;
    let testPost: any;

    beforeEach(async () => {
        testUser = await createTestUser('bookmark-user@example.com', 'password123', 'bookmarkuser');
        testCategory = await getSeededCategory('general-discussion');
        testPost = await createTestPost(testUser.id, testCategory.id, {
            title: 'Test Post for Bookmarks',
            content: '<p>Content</p>',
        });
        mockSession = createMockSession(testUser);
    });

    describe('POST /api/bookmarks - Toggle Bookmark', () => {
        it('should add a bookmark to a post', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/bookmarks', {
                body: {
                    postId: testPost.id,
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.bookmarked).toBe(true);

            // Verify in database
            const bookmarkInDb = await prisma.bookmark.findUnique({
                where: {
                    userId_postId: {
                        userId: testUser.id,
                        postId: testPost.id,
                    },
                },
            });

            expect(bookmarkInDb).toBeDefined();
        });

        it('should remove an existing bookmark', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            // First add a bookmark
            await prisma.bookmark.create({
                data: {
                    userId: testUser.id,
                    postId: testPost.id,
                },
            });

            // Then remove it
            const request = createMockRequest('POST', '/api/bookmarks', {
                body: {
                    postId: testPost.id,
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.bookmarked).toBe(false);

            // Verify removed from database
            const bookmarkInDb = await prisma.bookmark.findUnique({
                where: {
                    userId_postId: {
                        userId: testUser.id,
                        postId: testPost.id,
                    },
                },
            });

            expect(bookmarkInDb).toBeNull();
        });

        it('should fail when not authenticated', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);

            const request = createMockRequest('POST', '/api/bookmarks', {
                body: {
                    postId: testPost.id,
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
        });

        it('should fail with invalid post ID', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/bookmarks', {
                body: {
                    postId: 'non-existent-post-id',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(404);
            expect(data.error).toBeDefined();
        });

        it('should fail with missing postId', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/bookmarks', {
                body: {},
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });
    });

    describe('GET /api/bookmarks - Get User Bookmarks', () => {
        beforeEach(async () => {
            // Create multiple posts and bookmark some
            const post1 = await createTestPost(testUser.id, testCategory.id, {
                title: 'Post 1',
                content: '<p>Content 1</p>',
            });
            const post2 = await createTestPost(testUser.id, testCategory.id, {
                title: 'Post 2',
                content: '<p>Content 2</p>',
            });
            await createTestPost(testUser.id, testCategory.id, {
                title: 'Post 3',
                content: '<p>Content 3</p>',
            });

            // Bookmark post1 and post2
            await prisma.bookmark.createMany({
                data: [
                    { userId: testUser.id, postId: post1.id },
                    { userId: testUser.id, postId: post2.id },
                ],
            });
        });

        it('should get all bookmarks for authenticated user', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('GET', '/api/bookmarks');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(Array.isArray(data.bookmarks)).toBe(true);
            expect(data.bookmarks.length).toBeGreaterThanOrEqual(2);
            expect(data.bookmarks[0].post).toBeDefined();
            expect(data.bookmarks[0].post.title).toBeDefined();
        });

        it('should return empty array when user has no bookmarks', async () => {
            const newUser = await createTestUser('nobookmarks@example.com', 'password', 'nobookmarks');
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(newUser));

            const request = createMockRequest('GET', '/api/bookmarks');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(Array.isArray(data.bookmarks)).toBe(true);
            expect(data.bookmarks.length).toBe(0);
        });

        it('should fail when not authenticated', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);

            const request = createMockRequest('GET', '/api/bookmarks');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
        });

        it('should include post details with bookmarks', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('GET', '/api/bookmarks');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            if (data.bookmarks.length > 0) {
                const bookmark = data.bookmarks[0];
                expect(bookmark.post).toBeDefined();
                expect(bookmark.post.title).toBeDefined();
                expect(bookmark.post.category).toBeDefined();
                expect(bookmark.post.author).toBeDefined();
            }
        });
    });
});
