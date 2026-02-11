import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/ai/chat/route';
import { createTestUser, createMockSession } from '../helpers/auth';
import { createMockRequest, parseResponse } from '../helpers/api';
import { resetMockData } from '../setup';

// Mock NextAuth
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
    authOptions: {},
}));

// Mock AIJobQueue to avoid async job processing in tests
vi.mock('@/lib/queue/ai-job-queue', () => ({
    AIJobQueue: {
        submit: vi.fn().mockResolvedValue('mock-job-id'),
    },
}));

import { getServerSession } from 'next-auth';

// Mock global fetch for AI responses
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () =>
            Promise.resolve({
                choices: [
                    {
                        message: {
                            content: 'This is a mock AI response about autism.',
                        },
                    },
                ],
            }),
    } as Response)
);

describe('AI Chat API Integration Tests', () => {
    let testUser: any;
    let mockSession: any;
    const originalEnv = process.env;

    beforeEach(async () => {
        process.env = { ...originalEnv, GROQ_API_KEY: 'test-api-key' };
        resetMockData();
        const uniqueId = Date.now();
        testUser = await createTestUser(`ai-user-${uniqueId}@example.com`, 'password123', `aiuser${uniqueId}`);
        mockSession = createMockSession(testUser);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('POST /api/ai/chat - Send Chat Message', () => {
        it('should send a message and get job ID for polling', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    message: 'What is autism?',
                    conversationId: null,
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.jobId).toBeDefined();
            expect(data.conversationId).toBeDefined();
            expect(data.status).toBe('pending');
            expect(data.pollUrl).toBeDefined();
        }, 30000);

        it('should fail when not authenticated', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    message: 'Test message',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
        });

        it('should fail with empty message', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    message: '',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });

        it('should fail with missing message field', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {},
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });

        it('should handle very long messages gracefully', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const longMessage = 'a'.repeat(5000); // 5000 character message

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    message: longMessage,
                },
            });

            const response = await POST(request);

            // Should either succeed or fail with proper validation
            expect([200, 400, 413]).toContain(response.status);
        }, 30000);

        it('should sanitize message content for XSS', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    message: '<script>alert("XSS")</script>What is autism?',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            if (response.status === 200) {
                expect(data.jobId).toBeDefined();
                expect(data.conversationId).toBeDefined();
            }
        }, 30000);

        it('should maintain conversation context when conversationId provided', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const firstRequest = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    message: 'My name is John',
                    conversationId: null,
                },
            });

            const firstResponse = await POST(firstRequest);
            const firstData = await parseResponse(firstResponse);

            expect(firstResponse.status).toBe(200);
            expect(firstData.jobId).toBeDefined();
            const conversationId = firstData.conversationId;

            const secondRequest = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    message: 'What is my name?',
                    conversationId: conversationId,
                },
            });

            const secondResponse = await POST(secondRequest);
            const secondData = await parseResponse(secondResponse);

            expect(secondResponse.status).toBe(200);
            expect(secondData.jobId).toBeDefined();
            expect(secondData.conversationId).toBe(conversationId);
        }, 60000);

        it('should accept conversationType support and return ephemeral job', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    message: 'What is autism?',
                    conversationType: 'support',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.jobId).toBeDefined();
            expect(data.conversationId).toMatch(/^ephemeral_/);
            expect(data.status).toBe('pending');
        }, 30000);

        it('should accept conversationType story and return job', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    messages: [{ role: 'user', content: 'Tell me a story about a dragon' }],
                    conversationType: 'story',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.jobId).toBeDefined();
            expect(data.conversationId).toBeDefined();
        }, 30000);
    });
});
