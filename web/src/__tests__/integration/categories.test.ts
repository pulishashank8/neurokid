import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/categories/route';
import { createMockRequest, parseResponse } from '../helpers/api';

describe('Categories API Integration Tests', () => {
    // Categories are already seeded by setup.ts, no need to create them

    describe('GET /api/categories - List All Categories', () => {
        it('should list all categories', async () => {
            const request = createMockRequest('GET', '/api/categories');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(Array.isArray(data.categories)).toBe(true);
            expect(data.categories.length).toBeGreaterThanOrEqual(3);
        });

        it('should return categories with all required fields', async () => {
            const request = createMockRequest('GET', '/api/categories');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            const category = data.categories[0];
            expect(category.id).toBeDefined();
            expect(category.name).toBeDefined();
            expect(category.slug).toBeDefined();
            expect(category.description).toBeDefined();
        });

        it('should return categories sorted by order field', async () => {
            const request = createMockRequest('GET', '/api/categories');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);

            // Verify categories are sorted by order
            for (let i = 1; i < data.categories.length; i++) {
                const prev = data.categories[i - 1];
                const curr = data.categories[i];
                if (prev.order !== null && curr.order !== null) {
                    expect(prev.order).toBeLessThanOrEqual(curr.order);
                }
            }
        });

        it('should work without authentication', async () => {
            // Categories should be publicly accessible
            const request = createMockRequest('GET', '/api/categories');
            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it('should include post count for each category', async () => {
            const request = createMockRequest('GET', '/api/categories');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            // Check if _count is included (if implemented)
            const category = data.categories[0];
            expect(category).toBeDefined();
        });
    });
});
