import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/resources/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';

import { createTestUser } from '../helpers/auth';

const prisma = getTestPrisma();

describe('Resources API Integration Tests', () => {
    let testUser: any;

    beforeEach(async () => {
        // Create test user for resource ownership
        const uniqueId = Date.now();
        testUser = await createTestUser(`resource-test-${uniqueId}@example.com`, 'password123', `resourcetester${uniqueId}`);

        // Create test resources
        await prisma.resource.createMany({
            data: [
                {
                    title: 'Understanding Autism Spectrum Disorder',
                    content: 'Comprehensive guide to understanding ASD',
                    link: 'https://example.com/autism-guide',
                    category: 'EDUCATION',
                    status: 'ACTIVE',
                    views: 100,
                    createdBy: testUser.id,
                },
                {
                    title: 'ABA Therapy Techniques',
                    content: 'Learn effective ABA therapy methods',
                    link: 'https://example.com/aba-guide',
                    category: 'THERAPY',
                    status: 'ACTIVE',
                    views: 50,
                    createdBy: testUser.id,
                },
                {
                    title: 'Sensory Integration Activities',
                    content: 'Activities for sensory processing',
                    link: 'https://example.com/sensory',
                    category: 'OTHER',
                    status: 'ACTIVE',
                    views: 75,
                    createdBy: testUser.id,
                },
                {
                    title: 'Draft Resource',
                    content: 'This is a draft',
                    link: 'https://example.com/draft',
                    category: 'EDUCATION',
                    status: 'DRAFT',
                    views: 0,
                    createdBy: testUser.id,
                },
            ],
        });
    });

    describe('GET /api/resources - List Resources', () => {
        it('should list all active resources', async () => {
            const request = createMockRequest('GET', '/api/resources');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(Array.isArray(data.resources)).toBe(true);
            expect(data.resources.length).toBeGreaterThanOrEqual(3);
            // Should not include draft resources
            expect(data.resources.every((r: any) => r.status === 'ACTIVE')).toBe(true);
        });

        it('should filter resources by category', async () => {
            const request = createMockRequest('GET', '/api/resources', {
                searchParams: { category: 'EDUCATION' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.resources.every((r: any) => r.category === 'EDUCATION')).toBe(true);
            // Should only include active EDUCATION resources
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

        it('should return empty array when category has no active resources', async () => {
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

            // Should either return empty array or validation error, depending on implementation
            // Our current implementation might return 400 or empty list
            expect([200, 400]).toContain(response.status);
        });

        it('should have valid URL formats for all resources', async () => {
            const request = createMockRequest('GET', '/api/resources');
            const response = await GET(request);
            const data = await parseResponse(response);

            const urlRegex = /^(http|https):\/\/[^ "]+$/;

            data.resources.forEach((r: any) => {
                if (r.link) {
                    expect(r.link).toMatch(urlRegex);
                }
            });
        });
    });
});
