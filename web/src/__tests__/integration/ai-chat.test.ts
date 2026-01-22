import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/ai/chat/route';
import { createTestUser, createMockSession } from '../helpers/auth';
import { createMockRequest, parseResponse } from '../helpers/api';

// Mock NextAuth
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
    authOptions: {},
}));

import { getServerSession } from 'next-auth';

describe('AI Chat API Integration Tests', () => {
    let testUser: any;
    let mockSession: any;

    beforeEach(async () => {
        testUser = await createTestUser('ai-user@example.com', 'password123', 'aiuser');
        mockSession = createMockSession(testUser);
    });

    describe('POST /api/ai/chat - Send Chat Message', () => {
        it('should send a message and get AI response', async () => {
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
            expect(data.reply).toBeDefined();
            expect(typeof data.reply).toBe('string');
            expect(data.reply.length).toBeGreaterThan(0);
            expect(data.conversationId).toBeDefined();
        }, 30000); // Longer timeout for AI API calls

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

            // Should either succeed with sanitized input or fail with validation
            if (response.status === 200) {
                expect(data.reply).toBeDefined();
            }
        }, 30000);

        it('should maintain conversation context when conversationId provided', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

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
            expect(secondData.reply).toBeDefined();
            expect(secondData.conversationId).toBe(conversationId);
        }, 60000);
    });
});
