import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/providers/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';

const prisma = getTestPrisma();

describe('Providers API Integration Tests', () => {
    beforeEach(async () => {
        // Create test providers
        await prisma.provider.createMany({
            data: [
                {
                    name: 'ABC Therapy Center',
                    phone: '555-0101',
                    email: 'contact@abctherapy.com',
                    address: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001',
                    latitude: 40.7128,
                    longitude: -74.0060,
                    specialties: ['ABA', 'OT'],
                    rating: 4.5,
                    totalReviews: 10,
                    isVerified: true,
                },
                {
                    name: 'XYZ Speech Therapy',
                    phone: '555-0102',
                    email: 'info@xyzspeech.com',
                    address: '456 Oak Ave',
                    city: 'Los Angeles',
                    state: 'CA',
                    zipCode: '90001',
                    latitude: 34.0522,
                    longitude: -118.2437,
                    specialties: ['SLP', 'OT'],
                    rating: 4.8,
                    totalReviews: 15,
                    isVerified: true,
                },
                {
                    name: 'Autism Support Center',
                    phone: '555-0103',
                    email: 'support@autismcenter.com',
                    address: '789 Pine Rd',
                    city: 'Chicago',
                    state: 'IL',
                    zipCode: '60601',
                    latitude: 41.8781,
                    longitude: -87.6298,
                    specialties: ['ABA', 'SLP', 'OT'],
                    rating: 4.7,
                    totalReviews: 20,
                    isVerified: false,
                },
            ],
        });
    });

    describe('GET /api/providers - Search Providers', () => {
        it('should list all providers without filters', async () => {
            const request = createMockRequest('GET', '/api/providers');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(Array.isArray(data.providers)).toBe(true);
            expect(data.providers.length).toBeGreaterThanOrEqual(3);
        });

        it('should filter providers by city', async () => {
            const request = createMockRequest('GET', '/api/providers', {
                searchParams: { city: 'New York' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.providers.every((p: any) => p.city === 'New York')).toBe(true);
        });

        it('should filter providers by state', async () => {
            const request = createMockRequest('GET', '/api/providers', {
                searchParams: { state: 'CA' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.providers.every((p: any) => p.state === 'CA')).toBe(true);
        });

        it('should filter providers by specialty', async () => {
            const request = createMockRequest('GET', '/api/providers', {
                searchParams: { specialty: 'SLP' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.providers.every((p: any) => p.specialties.includes('SLP'))).toBe(true);
        });

        it('should filter providers by multiple criteria', async () => {
            const request = createMockRequest('GET', '/api/providers', {
                searchParams: {
                    state: 'IL',
                    specialty: 'ABA',
                },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(
                data.providers.every((p: any) => p.state === 'IL' && p.specialties.includes('ABA'))
            ).toBe(true);
        });

        it('should filter verified providers only', async () => {
            const request = createMockRequest('GET', '/api/providers', {
                searchParams: { verified: 'true' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.providers.every((p: any) => p.isVerified === true)).toBe(true);
        });

        it('should return providers with all required fields', async () => {
            const request = createMockRequest('GET', '/api/providers');
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            const provider = data.providers[0];
            expect(provider.id).toBeDefined();
            expect(provider.name).toBeDefined();
            expect(provider.specialties).toBeDefined();
            expect(Array.isArray(provider.specialties)).toBe(true);
            expect(provider.rating).toBeDefined();
        });

        it('should work without authentication (public endpoint)', async () => {
            const request = createMockRequest('GET', '/api/providers');
            const response = await GET(request);

            expect(response.status).toBe(200);
        });

        it('should return empty array when no providers match criteria', async () => {
            const request = createMockRequest('GET', '/api/providers', {
                searchParams: { city: 'NonExistentCity' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(Array.isArray(data.providers)).toBe(true);
            expect(data.providers.length).toBe(0);
        });

        it('should sort providers by rating', async () => {
            const request = createMockRequest('GET', '/api/providers', {
                searchParams: { sortBy: 'rating' },
            });
            const response = await GET(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);

            // Check if sorted by rating (descending)
            for (let i = 1; i < data.providers.length; i++) {
                const prev = data.providers[i - 1].rating || 0;
                const curr = data.providers[i].rating || 0;
                expect(prev).toBeGreaterThanOrEqual(curr);
            }
        });
    });
});
