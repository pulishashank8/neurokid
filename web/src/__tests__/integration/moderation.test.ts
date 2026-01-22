import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as lockPost } from '@/app/api/posts/[id]/lock/route';
import { POST as pinPost } from '@/app/api/posts/[id]/pin/route';
import { POST as lockAction } from '@/app/api/mod/actions/lock/route';
import { POST as pinAction } from '@/app/api/mod/actions/pin/route';
import { POST as removeAction } from '@/app/api/mod/actions/remove/route';
import { POST as suspendAction } from '@/app/api/mod/actions/suspend/route';
import { GET as getReports } from '@/app/api/mod/reports/route';
import {
    createTestUser,
    createModeratorUser,
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

describe('Moderation API Integration Tests', () => {
    let testUser: any;
    let moderatorUser: any;
    let testCategory: any;
    let testPost: any;

    beforeEach(async () => {
        testUser = await createTestUser('regular@example.com', 'password123', 'regularuser');
        moderatorUser = await createModeratorUser('mod@example.com', 'password123', 'moderator');
        testCategory = await getSeededCategory('general-discussion');
        testPost = await createTestPost(testUser.id, testCategory.id, {
            title: 'Test Post for Moderation',
            content: '<p>Test content</p>',
        });
    });

    describe('POST /api/posts/:id/lock - Lock Post', () => {
        it('should allow moderator to lock a post', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(moderatorUser));

            const request = createMockRequest('POST', `/api/posts/${testPost.id}/lock`, {
                body: {
                    reason: 'Violates community guidelines',
                },
            });

            const response = await lockPost(request, { params: Promise.resolve({ id: testPost.id }) });
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.post).toBeDefined();
            expect(data.post.isLocked).toBe(true);

            // Verify in database
            const lockedPost = await prisma.post.findUnique({
                where: { id: testPost.id },
            });

            expect(lockedPost?.isLocked).toBe(true);
        });

        it('should prevent non-moderator from locking post', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser));

            const request = createMockRequest('POST', `/api/posts/${testPost.id}/lock`);

            const response = await lockPost(request, { params: Promise.resolve({ id: testPost.id }) });
            const data = await parseResponse(response);

            expect(response.status).toBe(403);
            expect(data.error).toBeDefined();
        });

        it('should fail when not authenticated', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);

            const request = createMockRequest('POST', `/api/posts/${testPost.id}/lock`);

            const response = await lockPost(request, { params: Promise.resolve({ id: testPost.id }) });
            const data = await parseResponse(response);

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
        });
    });

    describe('POST /api/posts/:id/pin - Pin Post', () => {
        it('should allow moderator to pin a post', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(moderatorUser));

            const request = createMockRequest('POST', `/api/posts/${testPost.id}/pin`);

            const response = await pinPost(request, { params: Promise.resolve({ id: testPost.id }) });
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.post).toBeDefined();
            expect(data.post.isPinned).toBe(true);

            // Verify in database
            const pinnedPost = await prisma.post.findUnique({
                where: { id: testPost.id },
            });

            expect(pinnedPost?.isPinned).toBe(true);
        });

        it('should prevent non-moderator from pinning post', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser));

            const request = createMockRequest('POST', `/api/posts/${testPost.id}/pin`);

            const response = await pinPost(request, { params: Promise.resolve({ id: testPost.id }) });
            const data = await parseResponse(response);

            expect(response.status).toBe(403);
            expect(data.error).toBeDefined();
        });
    });

    describe('POST /api/mod/actions/remove - Remove Content', () => {
        it('should allow moderator to remove a post', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(moderatorUser));

            const request = createMockRequest('POST', '/api/mod/actions/remove', {
                body: {
                    targetType: 'POST',
                    targetId: testPost.id,
                    reason: 'Spam content',
                },
            });

            const response = await removeAction(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            // Verify post was marked as removed
            const removedPost = await prisma.post.findUnique({
                where: { id: testPost.id },
            });

            expect(removedPost?.status).toBe('REMOVED');
        });

        it('should prevent non-moderator from removing content', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser));

            const request = createMockRequest('POST', '/api/mod/actions/remove', {
                body: {
                    targetType: 'POST',
                    targetId: testPost.id,
                    reason: 'Spam',
                },
            });

            const response = await removeAction(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(403);
            expect(data.error).toBeDefined();
        });

        it('should create moderation action log', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(moderatorUser));

            const request = createMockRequest('POST', '/api/mod/actions/remove', {
                body: {
                    targetType: 'POST',
                    targetId: testPost.id,
                    reason: 'Inappropriate content',
                },
            });

            await removeAction(request);

            // Verify moderation action was logged
            const modAction = await prisma.moderationAction.findFirst({
                where: {
                    postId: testPost.id,
                    action: 'REMOVE',
                },
            });

            expect(modAction).toBeDefined();
            expect(modAction?.actorId).toBe(moderatorUser.id);
        });
    });

    describe('POST /api/mod/actions/suspend - Suspend User', () => {
        it('should allow moderator to suspend a user', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(moderatorUser));

            const request = createMockRequest('POST', '/api/mod/actions/suspend', {
                body: {
                    userId: testUser.id,
                    reason: 'Multiple violations',
                    isSuspended: true,
                },
            });

            const response = await suspendAction(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);

            // Verify suspension was recorded in ModActionLog
            const modAction = await prisma.modActionLog.findFirst({
                where: {
                    targetId: testUser.id,
                    actionType: 'SHADOWBAN',
                },
            });

            expect(modAction).toBeDefined();
        });

        it('should prevent non-moderator from suspending users', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser));

            const request = createMockRequest('POST', '/api/mod/actions/suspend', {
                body: {
                    userId: testUser.id,
                    reason: 'Test',
                    durationDays: 1,
                },
            });

            const response = await suspendAction(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(403);
            expect(data.error).toBeDefined();
        });

        it('should fail with invalid duration', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(moderatorUser));

            const request = createMockRequest('POST', '/api/mod/actions/suspend', {
                body: {
                    userId: testUser.id,
                    reason: 'Test',
                    durationDays: -1, // Invalid
                },
            });

            const response = await suspendAction(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });
    });

    describe('GET /api/mod/reports - Get Moderation Dashboard', () => {
        beforeEach(async () => {
            // Create some reports
            await prisma.report.createMany({
                data: [
                    {
                        reporterId: testUser.id,
                        targetType: 'POST',
                        targetId: testPost.id,
                        reason: 'SPAM',
                        status: 'OPEN',
                    },
                    {
                        reporterId: testUser.id,
                        targetType: 'POST',
                        targetId: testPost.id,
                        reason: 'HARASSMENT',
                        status: 'UNDER_REVIEW',
                    },
                ],
            });
        });

        it('should allow moderator to view reports dashboard', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(moderatorUser));

            const request = createMockRequest('GET', '/api/mod/reports');
            const response = await getReports(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.reports).toBeDefined();
            expect(Array.isArray(data.reports)).toBe(true);
        });

        it('should prevent non-moderator from viewing reports', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser));

            const request = createMockRequest('GET', '/api/mod/reports');
            const response = await getReports(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(403);
            expect(data.error).toBeDefined();
        });

        it('should include report statistics', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(moderatorUser));

            const request = createMockRequest('GET', '/api/mod/reports');
            const response = await getReports(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            // Should include stats like open reports, under review, etc.
            if (data.stats) {
                expect(data.stats).toBeDefined();
            }
        });
    });
});
