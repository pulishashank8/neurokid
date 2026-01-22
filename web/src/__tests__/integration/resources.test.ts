import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/resources/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';

const prisma = getTestPrisma();

describe('Resources API Integration Tests', () => {
    beforeEach(async () => {
        // Create test resources
        await prisma.resource.createMany({
            data: [
                {
                    title: 'Understanding Autism Spectrum Disorder',
                    content: 'Comprehensive guide to understanding ASD',
                    link: 'https://example.com/autism-guide',
                    category: 'EDUCATION',
                    status: 'PUBLISHED',
                    views: 100,
                },
                {
                    title: 'ABA Therapy Techniques',
                    content: 'Learn effective ABA therapy methods',
                    link: 'https://example.com/aba-guide',
                    category: 'THERAPY',
                    status: 'PUBLISHED',
                    views: 50,
                },
                {
                    title: 'Sensory Integration Activities',
                    content: 'Activities for sensory processing',
                    link: 'https://example.com/sensory',
                    category: 'ACTIVITIES',
                    status: 'PUBLISHED',
                    views: 75,
                },
                {
                    title: 'Draft Resource',
                    content: 'This is a draft',
                    link: 'https://example.com/draft',
                    category: 'EDUCATION',
                    status: 'DRAFT',
                    views: 0,
                },
            ],
        });
    });

    describe('GET /api/resources - List Resources', () => {
        it('should list all published resources', async () => {
            const request = createMockRequest('GET', '/api/resources');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(Array.isArray(data.resources)).toBe(true);
            expect(data.resources.length).toBeGreaterThanOrEqual(3);
            // Should not include draft resources
            expect(data.resources.every((r: any) => r.status === 'PUBLISHED')).toBe(true);
        });

        it('should filter resources by category', async () => {
            const request = createMockRequest('GET', '/api/resources', {
                searchParams: { category: 'EDUCATION' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.resources.every((r: any) => r.category === 'EDUCATION')).toBe(true);
            // Should only include published EDUCATION resources
            expect(data.resources.length).toBe(1);
        });

        it('should filter by therapy category', async () => {
            const request = createMockRequest('GET', '/api/resources', {
                searchParams: { category: 'THERAPY' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.resources.every((r: any) => r.category === 'THERAPY')).toBe(true);
        });

        it('should return resources with all required fields', async () => {
            const request = createMockRequest('GET', '/api/resources');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            const resource = data.resources[0];
            expect(resource.id).toBeDefined();
            expect(resource.title).toBeDefined();
            expect(resource.content).toBeDefined();
            expect(resource.category).toBeDefined();
            expect(resource.link).toBeDefined();
        });

        it('should work without authentication (public endpoint)', async () => {
            const request = createMockRequest('GET', '/api/resources');
            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it('should return empty array when category has no published resources', async () => {
            const request = createMockRequest('GET', '/api/resources', {
                searchParams: { category: 'LEGAL' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(Array.isArray(data.resources)).toBe(true);
        });

        it('should sort resources by views (most viewed first)', async () => {
            const request = createMockRequest('GET', '/api/resources', {
                searchParams: { sortBy: 'views' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);

            // Check if sorted by views (descending)
            for (let i = 1; i < data.resources.length; i++) {
                const prev = data.resources[i - 1].views || 0;
                const curr = data.resources[i].views || 0;
                expect(prev).toBeGreaterThanOrEqual(curr);
            }
        });

        it('should support pagination with limit', async () => {
            const request = createMockRequest('GET', '/api/resources', {
                searchParams: { limit: '2' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.resources.length).toBeLessThanOrEqual(2);
        });

        it('should handle invalid category gracefully', async () => {
            const request = createMockRequest('GET', '/api/resources', {
                searchParams: { category: 'INVALID_CATEGORY' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            // Should either return empty array or validation error
            expect([200, 400]).toContain(response.status);
        });
    });
});
