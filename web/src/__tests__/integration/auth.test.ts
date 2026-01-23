import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';

const prisma = getTestPrisma();

describe('Auth API Integration Tests', () => {
    describe('POST /api/auth/register - User Registration', () => {
        it('should register a new user successfully', async () => {
            const request = createMockRequest('POST', '/api/auth/register', {
                body: {
                    email: 'newuser@example.com',
                    password: 'SecurePassword123!',
                    confirmPassword: 'SecurePassword123!',
                    username: 'newuser123',
                    displayName: 'New User',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(201);
            expect(data.user).toBeDefined();
            expect(data.user.email).toBe('newuser@example.com');
            expect(data.user.profile.username).toBe('newuser123');

            // Verify user was created in database
            const userInDb = await prisma.user.findUnique({
                where: { email: 'newuser@example.com' },
                include: { profile: true, userRoles: true },
            });

            expect(userInDb).toBeDefined();
            expect(userInDb?.profile?.username).toBe('newuser123');
            expect(userInDb?.userRoles.some(r => r.role === 'PARENT')).toBe(true);
            expect(userInDb?.hashedPassword).toBeDefined();
            expect(userInDb?.hashedPassword).not.toBe('SecurePassword123!'); // Should be hashed
        });

        it('should fail with duplicate email', async () => {
            // Create a user first
            const firstRequest = createMockRequest('POST', '/api/auth/register', {
                body: {
                    email: 'duplicate@example.com',
                    password: 'Password123!',
                    confirmPassword: 'Password123!',
                    username: 'duplicateuser',
                    displayName: 'First User',
                },
            });
            await POST(firstRequest);

            // Try to register with same email
            const secondRequest = createMockRequest('POST', '/api/auth/register', {
                body: {
                    email: 'duplicate@example.com',
                    password: 'Password456!',
                    confirmPassword: 'Password456!',
                    username: 'differentuser',
                    displayName: 'Second User',
                },
            });

            const response = await POST(secondRequest);
            const data = await parseResponse(response);

            if (response.status !== 409) {
                console.log('Duplicate Email Test Failed:', {
                    status: response.status,
                    error: data.error,
                    details: data.details
                });
            }

            expect(response.status).toBe(409); // Conflict status
            expect(data.error).toBeDefined();
            expect(data.error.toLowerCase()).toContain('email');
        });

        it('should fail with duplicate username', async () => {
            // Create a user first
            const firstRequest = createMockRequest('POST', '/api/auth/register', {
                body: {
                    email: 'user1@example.com',
                    password: 'Password123!',
                    confirmPassword: 'Password123!',
                    username: 'sameusername',
                    displayName: 'First User',
                },
            });
            await POST(firstRequest);

            // Try to register with same username
            const secondRequest = createMockRequest('POST', '/api/auth/register', {
                body: {
                    email: 'user2@example.com',
                    password: 'Password456!',
                    confirmPassword: 'Password456!',
                    username: 'sameusername',
                    displayName: 'Second User',
                },
            });

            const response = await POST(secondRequest);
            const data = await parseResponse(response);

            expect(response.status).toBe(409); // Conflict status
            expect(data.error).toBeDefined();
        });

        it('should fail with invalid email format', async () => {
            const request = createMockRequest('POST', '/api/auth/register', {
                body: {
                    email: 'not-an-email',
                    password: 'Password123!',
                    confirmPassword: 'Password123!',
                    username: 'testuser',
                    displayName: 'Test User',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });

        it('should fail with weak password', async () => {
            const request = createMockRequest('POST', '/api/auth/register', {
                body: {
                    email: 'weakpass@example.com',
                    password: '123', // Too short
                    confirmPassword: '123',
                    username: 'weakuser',
                    displayName: 'Weak User',
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });

        it('should fail with missing required fields', async () => {
            const request = createMockRequest('POST', '/api/auth/register', {
                body: {
                    email: 'incomplete@example.com',
                    // Missing password, username, displayName
                },
            });

            const response = await POST(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });

        it('should sanitize username (remove spaces and special chars)', async () => {
            const request = createMockRequest('POST', '/api/auth/register', {
                body: {
                    email: 'sanitize@example.com',
                    password: 'Password123!',
                    confirmPassword: 'Password123!',
                    username: 'user name@#$',
                    displayName: 'Sanitize User',
                },
            });

            const response = await POST(request);

            // Should either succeed with sanitized username or fail with validation error
            if (response.status === 201) {
                const data = await parseResponse(response);
                expect(data.user.profile.username).not.toContain(' ');
                expect(data.user.profile.username).not.toContain('@');
            } else {
                expect(response.status).toBe(400);
            }
        });
    });
});
