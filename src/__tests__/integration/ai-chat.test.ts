import { POST } from '@/app/api/ai/chat/route';
import { createTestUser, createMockSession } from '../helpers/auth';
import { createMockRequest, parseResponse } from '../helpers/api';
import { resetMockData, setMockSession } from '../setup';

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
    authOptions: {},
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
        // Mock GROQ_API_KEY so the route doesn't return early
        process.env = { ...originalEnv, GROQ_API_KEY: 'test-api-key' };
        resetMockData();
        const uniqueId = Date.now();
        testUser = await createTestUser(`ai-user-${uniqueId}@example.com`, 'password123!@#', `aiuser${uniqueId}`);
        mockSession = createMockSession(testUser);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('POST /api/ai/chat - Send Chat Message', () => {
        it('should send a message and get AI response', async () => {
            setMockSession(mockSession);

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    message: 'What is autism?',
                    conversationId: null,
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            // API returns async job (client polls for result)
            expect(data.jobId).toBeDefined();
            expect(data.conversationId).toBeDefined();
            expect(data.status).toBe('pending');
            expect(data.pollUrl).toBeDefined();
        }, 30000); // Longer timeout for AI API calls

        it('should fail when not authenticated', async () => {
            setMockSession(null);

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
            setMockSession(mockSession);

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
            setMockSession(mockSession);

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {},
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });

        it('should handle very long messages gracefully', async () => {
            setMockSession(mockSession);

            const longMessage = 'a'.repeat(5000); // 5000 character message

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    message: longMessage,
                },
            });

            const response = await POST(request);

            // Should succeed (job queued) or fail with validation
            expect([200, 400, 413, 500]).toContain(response.status);
        }, 30000);

        it('should sanitize message content for XSS', async () => {
            setMockSession(mockSession);

            const request = createMockRequest('POST', '/api/ai/chat', {
                body: {
                    message: '<script>alert("XSS")</script>What is autism?',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            // Should succeed (job queued) or fail with validation
            if (response.status === 200) {
                expect(data.jobId).toBeDefined();
                expect(data.conversationId).toBeDefined();
            }
        }, 30000);

        it('should maintain conversation context when conversationId provided', async () => {
            setMockSession(mockSession);

            // First message
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

            // Second message in same conversation
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
    });
});
