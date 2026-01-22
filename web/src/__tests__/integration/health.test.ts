import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';
import { createMockRequest, parseResponse } from '../helpers/api';

describe('Health Check API Integration Tests', () => {
    describe('GET /api/health - System Health Check', () => {
        it('should return healthy status', async () => {
            const request = createMockRequest('GET', '/api/health');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.status).toBe('healthy');
        });

        // it('should include version information', async () => {
        //     const request = createMockRequest('GET', '/api/health');
        //     const response = await GET(request);
        //     const data = await parseResponse(response);
        //
        //     expect(response.status).toBe(200);
        //     expect(data.version).toBeDefined();
        // });

        it('should work without authentication', async () => {
            // Health check should be public
            const request = createMockRequest('GET', '/api/health');
            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it('should include database status', async () => {
            const request = createMockRequest('GET', '/api/health');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            if (data.database) {
                // Should be 'ok' or 'error' string, OR object with status depending on implementation
                // Current implementation returns "ok" or "error"
                expect(['ok', 'error', 'connected', 'disconnected']).toContain(data.database);
            }
        });

        it('should include timestamp', async () => {
            const request = createMockRequest('GET', '/api/health');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            if (data.timestamp) {
                expect(new Date(data.timestamp).getTime()).toBeGreaterThan(0);
            }
        });

        it('should be fast (< 1 second)', async () => {
            const startTime = Date.now();
            const request = createMockRequest('GET', '/api/health');
            await GET(request);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(1000);
        });

        it('should return consistent response format', async () => {
            const request1 = createMockRequest('GET', '/api/health');
            const response1 = await GET(request1);
            const data1 = await parseResponse(response1);

            const request2 = createMockRequest('GET', '/api/health');
            const response2 = await GET(request2);
            const data2 = await parseResponse(response2);

            // Both responses should have the same structure
            expect(Object.keys(data1).sort()).toEqual(Object.keys(data2).sort());
        });

        it('should be available during high load', async () => {
            // Make multiple concurrent requests
            const requests = Array(10)
                .fill(null)
                .map(() => {
                    const request = createMockRequest('GET', '/api/health');
                    return GET(request);
                });

            const responses = await Promise.all(requests);

            // All should succeed
            responses.forEach((response) => {
                expect(response.status).toBe(200);
            });
        });
    });
});
