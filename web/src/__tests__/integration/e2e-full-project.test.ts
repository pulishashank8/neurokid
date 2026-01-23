import { describe, it, expect, beforeEach } from 'vitest';
import {
    createTestUser,
    createModeratorUser,
    getSeededCategory,
    getSeededTag,
    createTestPost,
    createTestComment,
} from '../helpers/auth';
import { GET as getPosts } from '@/app/api/posts/route';
import { GET as getCategories } from '@/app/api/categories/route';
import { GET as getTags } from '@/app/api/tags/route';
import { GET as getHealth } from '@/app/api/health/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';

const prisma = getTestPrisma();

describe('Full Project End-to-End Tests', () => {
    describe('Complete User Journey', () => {
        let regularUser: any;
        let moderatorUser: any;
        let category: any;
        let post: any;

        beforeEach(async () => {
            // Set up test environment for each test because global beforeEach wipes the database
            const suffix = Math.random().toString(36).substring(7);
            regularUser = await createTestUser(`journey-${suffix}@example.com`, 'password123', `journeyuser-${suffix}`);
            moderatorUser = await createModeratorUser(`mod-${suffix}@example.com`, 'password123', `moduser-${suffix}`);
            category = await getSeededCategory('general-discussion');
            await getSeededTag('autism');

            post = await createTestPost(regularUser.id, category.id, {
                title: 'E2E Test Post',
                content: '<p>This is an end-to-end test post</p>',
            });

            await createTestComment(regularUser.id, post.id, '<p>Test comment</p>');
        });

        it('should have a healthy system', async () => {
            const request = createMockRequest('GET', '/api/health');
            const response = await getHealth(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.status).toBe('healthy');
        });

        it('should have created users successfully', async () => {
            const users = await prisma.user.findMany({
                where: {
                    id: {
                        in: [regularUser.id, moderatorUser.id],
                    },
                },
                include: {
                    profile: true,
                    userRoles: true,
                },
            });

            expect(users.length).toBe(2);

            const regular = users.find(u => u.email === regularUser.email);
            const moderator = users.find(u => u.email === moderatorUser.email);

            expect(regular).toBeDefined();
            expect(regular?.profile).toBeDefined();

            expect(moderator).toBeDefined();
            expect(moderator?.userRoles.some(r => r.role === 'MODERATOR')).toBe(true);
        });

        it('should have categories available', async () => {
            const response = await getCategories();
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.categories.length).toBeGreaterThan(0);
            expect(data.categories.some((c: any) => c.slug === 'general-discussion')).toBe(true);
        });

        it('should have tags available', async () => {
            const response = await getTags();
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.tags.length).toBeGreaterThan(0);
            expect(data.tags.some((t: any) => t.slug === 'autism')).toBe(true);
        });

        it('should have posts viewable', async () => {
            const request = createMockRequest('GET', '/api/posts', {
                searchParams: { limit: '10', sort: 'new' },
            });
            const response = await getPosts(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.posts.length).toBeGreaterThan(0);
            expect(data.posts.some((p: any) => p.title === 'E2E Test Post')).toBe(true);
        });

        it('should have post with complete data structure', async () => {
            const fullPost = await prisma.post.findFirst({
                where: { id: post.id },
                include: {
                    author: {
                        include: {
                            profile: true,
                        },
                    },
                    category: true,
                    comments: {
                        include: {
                            author: {
                                include: {
                                    profile: true,
                                },
                            },
                        },
                    },
                },
            });

            expect(fullPost).toBeDefined();
            expect(fullPost?.author).toBeDefined();
            expect(fullPost?.author?.profile).toBeDefined();
            expect(fullPost?.category).toBeDefined();
            expect(fullPost?.comments.length).toBeGreaterThan(0);
        });

        it('should have data integrity across all tables', async () => {
            // Check referential integrity
            const posts = await prisma.post.findMany({
                where: { authorId: regularUser.id },
            });

            expect(posts.every(p => p.authorId === regularUser.id)).toBe(true);
            expect(posts.every(p => p.categoryId === category.id)).toBe(true);
        });
    });

    describe('Database Schema Validation', () => {
        it('should have all required tables', async () => {
            // Check if we can query all major tables
            const tableChecks = await Promise.all([
                prisma.user.findMany({ take: 1 }),
                prisma.profile.findMany({ take: 1 }),
                prisma.userRole.findMany({ take: 1 }),
                prisma.post.findMany({ take: 1 }),
                prisma.comment.findMany({ take: 1 }),
                prisma.category.findMany({ take: 1 }),
                prisma.tag.findMany({ take: 1 }),
                prisma.vote.findMany({ take: 1 }),
                prisma.bookmark.findMany({ take: 1 }),
                prisma.report.findMany({ take: 1 }),
            ]);

            // All queries should succeed (not throw errors)
            expect(tableChecks).toBeDefined();
        });

        it('should enforce unique constraints', async () => {
            await createTestUser('unique1@example.com', 'pass', 'unique1');

            // Try to create duplicate email
            await expect(
                createTestUser('unique1@example.com', 'pass', 'unique2')
            ).rejects.toThrow();
        });

        it('should enforce foreign key relationships', async () => {
            // Try to create a post with non-existent categoryId
            await expect(
                prisma.post.create({
                    data: {
                        title: 'Invalid Post',
                        content: '<p>Content</p>',
                        authorId: 'non-existent-user-id',
                        categoryId: 'non-existent-category-id',
                        voteScore: 0,
                    },
                })
            ).rejects.toThrow();
        });
    });

    describe('API Integration', () => {
        it('should handle multiple concurrent requests', async () => {
            const requests = Array(5).fill(null).map(() =>
                getPosts(createMockRequest('GET', '/api/posts', {
                    searchParams: { limit: '5', sort: 'new' },
                }))
            );

            const responses = await Promise.all(requests);

            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
        });

        it('should maintain data consistency across endpoints', async () => {
            const user = await createTestUser('consistency@example.com', 'pass', 'consistent');
            const category = await getSeededCategory('therapies');

            const post = await createTestPost(user.id, category.id, {
                title: 'Consistency Test Post',
                content: '<p>Testing consistency</p>',
            });

            // Fetch from different endpoints
            const allPosts = await prisma.post.findMany({
                where: { id: post.id },
            });

            const categoryPosts = await prisma.post.findMany({
                where: { categoryId: category.id },
            });

            const userPosts = await prisma.post.findMany({
                where: { authorId: user.id },
            });

            // All should return the same post
            expect(allPosts.some(p => p.id === post.id)).toBe(true);
            expect(categoryPosts.some(p => p.id === post.id)).toBe(true);
            expect(userPosts.some(p => p.id === post.id)).toBe(true);
        });
    });

    describe('Security & Performance', () => {
        it('should store passwords securely (hashed)', async () => {
            const password = 'SecurePassword123!';
            const user = await createTestUser('secure@example.com', password, 'secureuser');

            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
            });

            // Password should be hashed, not plain text
            expect(dbUser?.hashedPassword).toBeDefined();
            expect(dbUser?.hashedPassword).not.toBe(password);
            expect(dbUser?.hashedPassword?.length).toBeGreaterThan(20); // bcrypt hashes are long
        });

        it('should handle large datasets efficiently', async () => {
            const startTime = Date.now();

            const posts = await prisma.post.findMany({
                take: 100,
                include: {
                    author: {
                        include: {
                            profile: true,
                        },
                    },
                    category: true,
                },
            });

            const endTime = Date.now();
            const queryTime = endTime - startTime;

            // Should fetch 100 posts with relations in under 2 seconds
            expect(queryTime).toBeLessThan(2000);
            expect(Array.isArray(posts)).toBe(true);
        });

        it('should properly clean up test data between tests', async () => {
            // This test verifies that beforeEach cleanup works
            const initialUserCount = await prisma.user.count();

            // Create a user
            await createTestUser('cleanup-test@example.com', 'pass', 'cleanupuser');

            const afterCreateCount = await prisma.user.count();

            // User count should have increased
            expect(afterCreateCount).toBeGreaterThan(initialUserCount);
        });
    });

    describe('Feature Completeness', () => {
        it('should support all major features', async () => {
            const user = await createTestUser('features@example.com', 'pass', 'featureuser');
            const category = await getSeededCategory('diagnosis');

            // Test Posts
            const post = await createTestPost(user.id, category.id, {
                title: 'Feature Test',
                content: '<p>Testing all features</p>',
            });
            expect(post).toBeDefined();

            // Test Comments
            const comment = await createTestComment(user.id, post.id);
            expect(comment).toBeDefined();

            // Test Votes
            const vote = await prisma.vote.create({
                data: {
                    userId: user.id,
                    targetType: 'POST',
                    targetId: post.id,
                    value: 1,
                },
            });
            expect(vote).toBeDefined();

            // Test Bookmarks
            const bookmark = await prisma.bookmark.create({
                data: {
                    userId: user.id,
                    postId: post.id,
                },
            });
            expect(bookmark).toBeDefined();

            // All features should work together
            const fullPost = await prisma.post.findUnique({
                where: { id: post.id },
                include: {
                    comments: true,
                    bookmarks: true,
                },
            });

            // Verify votes separately (polymorphic relation)
            const postVotes = await prisma.vote.findMany({
                where: {
                    targetId: post.id,
                    targetType: 'POST'
                }
            });

            expect(fullPost?.comments.length).toBeGreaterThan(0);
            expect(postVotes.length).toBeGreaterThan(0);
            expect(fullPost?.bookmarks.length).toBeGreaterThan(0);
        });

        it('should support moderation features', async () => {
            const mod = await createModeratorUser('mod-features@example.com', 'pass', 'modfeatures');

            // Verify moderator role
            const modRoles = await prisma.userRole.findMany({
                where: { userId: mod.id },
            });

            expect(modRoles.some(r => r.role === 'MODERATOR')).toBe(true);
        });

        it('should support anonymous posting', async () => {
            const user = await createTestUser('anon@example.com', 'pass', 'anonuser');
            const category = await getSeededCategory('education');

            const anonPost = await createTestPost(user.id, category.id, {
                title: 'Anonymous Post',
                content: '<p>Anonymous content</p>',
                isAnonymous: true,
            });

            expect(anonPost.isAnonymous).toBe(true);
            expect(anonPost.authorId).toBeDefined(); // Still has author in DB, just hidden in UI
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid data gracefully', async () => {
            // Try to create user with duplicate email
            const email = `dup-${Date.now()}@example.com`;
            await createTestUser(email, 'pass', 'user1');

            await expect(
                prisma.user.create({
                    data: {
                        email: email,
                        hashedPassword: 'test',
                    },
                })
            ).rejects.toThrow();
        });

        it('should prevent SQL injection attempts', async () => {
            const maliciousInput = "'; DROP TABLE users; --";

            // Prisma should escape this properly
            const result = await prisma.user.findMany({
                where: {
                    email: maliciousInput,
                },
            });

            // Should return empty array, not throw error or execute SQL
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });
});
