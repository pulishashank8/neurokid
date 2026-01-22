import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, GET } from '@/app/api/reports/route';
import { PATCH } from '@/app/api/reports/[id]/route';
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

describe('Reports API Integration Tests', () => {
    let testUser: any;
    let moderatorUser: any;
    let testCategory: any;
    let testPost: any;

    beforeEach(async () => {
        testUser = await createTestUser('reporter@example.com', 'password123', 'reporter');
        moderatorUser = await createModeratorUser('moderator@example.com', 'password123', 'moderator');
        testCategory = await getSeededCategory('general-discussion');
        testPost = await createTestPost(testUser.id, testCategory.id, {
            title: 'Test Post to Report',
            content: '<p>Test content</p>',
        });
    });

    describe('POST /api/reports - Create Report', () => {
        it('should create a report for a post', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser));

            const request = createMockRequest('POST', '/api/reports', {
                body: {
                    targetType: 'POST',
                    targetId: testPost.id,
                    reason: 'SPAM',
                    description: 'This post is spam',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(201);
            expect(data.report).toBeDefined();
            expect(data.report.targetType).toBe('POST');
            expect(data.report.targetId).toBe(testPost.id);
            expect(data.report.reason).toBe('SPAM');

            // Verify in database
            const reportInDb = await prisma.report.findFirst({
                where: {
                    reporterId: testUser.id,
                    targetId: testPost.id,
                },
            });

            expect(reportInDb).toBeDefined();
            expect(reportInDb?.status).toBe('OPEN');
        });

        it('should fail when not authenticated', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);

            const request = createMockRequest('POST', '/api/reports', {
                body: {
                    targetType: 'POST',
                    targetId: testPost.id,
                    reason: 'SPAM',
                    description: 'This is spam',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
        });

        it('should fail with invalid target type', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser));

            const request = createMockRequest('POST', '/api/reports', {
                body: {
                    targetType: 'INVALID_TYPE',
                    targetId: testPost.id,
                    reason: 'SPAM',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });

        it('should fail with invalid reason', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser));

            const request = createMockRequest('POST', '/api/reports', {
                body: {
                    targetType: 'POST',
                    targetId: testPost.id,
                    reason: 'INVALID_REASON',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });

        it('should create report with all valid reasons', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser));

            const validReasons = ['SPAM', 'HARASSMENT', 'MISINFORMATION', 'INAPPROPRIATE'];

            for (const reason of validReasons) {
                const post = await createTestPost(testUser.id, testCategory.id, {
                    title: `Post for ${reason}`,
                    content: '<p>Content</p>',
                });

                const request = createMockRequest('POST', '/api/reports', {
                    body: {
                        targetType: 'POST',
                        targetId: post.id,
                        reason: reason,
                        description: `Testing ${reason}`,
                    },
                });

                const response = await POST(request);
                expect([200, 201]).toContain(response.status);
            }
        });
    });

    describe('GET /api/reports - List Reports (Moderator Only)', () => {
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
                        description: 'Spam report 1',
                    },
                    {
                        reporterId: testUser.id,
                        targetType: 'POST',
                        targetId: testPost.id,
                        reason: 'HARASSMENT',
                        status: 'OPEN',
                        description: 'Harassment report',
                    },
                ],
            });
        });

        it('should allow moderator to list reports', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(moderatorUser));

            const request = createMockRequest('GET', '/api/reports');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(Array.isArray(data.reports)).toBe(true);
            expect(data.reports.length).toBeGreaterThanOrEqual(2);
        });

        it('should fail when non-moderator tries to list reports', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser));

            const request = createMockRequest('GET', '/api/reports');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(403);
            expect(data.error).toBeDefined();
        });

        it('should fail when not authenticated', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);

            const request = createMockRequest('GET', '/api/reports');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
        });
    });

    describe('PATCH /api/reports/:id - Update Report Status (Moderator Only)', () => {
        let reportId: string;

        beforeEach(async () => {
            const report = await prisma.report.create({
                data: {
                    reporterId: testUser.id,
                    targetType: 'POST',
                    targetId: testPost.id,
                    reason: 'SPAM',
                    status: 'OPEN',
                    description: 'Test report',
                },
            });
            reportId = report.id;
        });

        it('should allow moderator to update report status (RESOLVE)', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(moderatorUser));

            const request = createMockRequest('PATCH', `/api/reports/${reportId}`, {
                body: {
                    action: 'RESOLVE',
                },
            });

            const response = await PATCH(request, { params: Promise.resolve({ id: reportId }) });
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.report.status).toBe('RESOLVED');

            // Verify in database
            const updatedReport = await prisma.report.findUnique({
                where: { id: reportId },
            });

            expect(updatedReport?.status).toBe('RESOLVED');
        });

        it('should fail when non-moderator tries to update report', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(testUser));

            const request = createMockRequest('PATCH', `/api/reports/${reportId}`, {
                body: {
                    action: 'RESOLVE',
                },
            });

            const response = await PATCH(request, { params: Promise.resolve({ id: reportId }) });
            const data = await parseResponse(response);

            expect(response.status).toBe(401); // The API returns 401 for unauthorized/unauthenticated in this check
            expect(data.error).toBeDefined();
        });

        it('should fail with invalid action', async () => {
            vi.mocked(getServerSession).mockResolvedValue(createMockSession(moderatorUser));

            const request = createMockRequest('PATCH', `/api/reports/${reportId}`, {
                body: {
                    action: 'INVALID_ACTION',
                },
            });

            const response = await PATCH(request, { params: Promise.resolve({ id: reportId }) });
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });
    });
});
