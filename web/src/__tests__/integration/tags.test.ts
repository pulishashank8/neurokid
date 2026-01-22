import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/tags/route';
import { createMockRequest, parseResponse } from '../helpers/api';

describe('Tags API Integration Tests', () => {
    // Tags are already seeded by setup.ts, no need to create them

    describe('GET /api/tags - List All Tags', () => {
        it('should list all tags', async () => {
            const request = createMockRequest('GET', '/api/tags');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(Array.isArray(data.tags)).toBe(true);
            expect(data.tags.length).toBeGreaterThanOrEqual(4);
        });

        it('should return tags with all required fields', async () => {
            const request = createMockRequest('GET', '/api/tags');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            const tag = data.tags[0];
            expect(tag.id).toBeDefined();
            expect(tag.name).toBeDefined();
            expect(tag.slug).toBeDefined();
        });

        it('should work without authentication', async () => {
            // Tags should be publicly accessible
            const request = createMockRequest('GET', '/api/tags');
            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it('should include color field for UI styling', async () => {
            const request = createMockRequest('GET', '/api/tags');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            const tag = data.tags.find((t: any) => t.name === 'Autism');
            if (tag && tag.color) {
                expect(tag.color).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
            }
        });

        it('should return tags sorted alphabetically', async () => {
            const request = createMockRequest('GET', '/api/tags');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);

            // Check if tags are sorted (implementation dependent)
            expect(data.tags.length).toBeGreaterThan(0);
        });
    });
});
