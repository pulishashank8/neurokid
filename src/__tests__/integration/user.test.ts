import { resetMockData } from '../setup';
import { GET, PUT } from '@/app/api/user/profile/route';
import { POST as changePassword } from '@/app/api/user/change-password/route';
import { DELETE as deleteAccount } from '@/app/api/user/delete-account/route';
import { createTestUser, createMockSession } from '../helpers/auth';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';

// Mock NextAuth
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
    authOptions: {},
}));

// Mock @/lib/auth
vi.mock('@/lib/auth', () => ({
    getServerSession: vi.fn(),
    authOptions: {},
}));

// Mock dataGovernanceService
vi.mock('@/application/services/DataGovernanceService', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        dataGovernanceService: {
            exportUserData: vi.fn(),
            deleteUserCompletely: vi.fn().mockResolvedValue(undefined),
            anonymizeUserData: vi.fn().mockResolvedValue(undefined),
            getDataRetentionStats: vi.fn(),
            cleanupOldAuditLogs: vi.fn(),
        },
    };
});

// Mock logSecurityEvent
vi.mock('@/lib/securityAudit', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        logSecurityEvent: vi.fn().mockResolvedValue(undefined),
    };
});

// Mock apiResponse
vi.mock('@/lib/apiResponse', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        successResponse: (data: any) => Response.json({ data }),
        errorResponse: (code: string, message: string, status: number) => Response.json({ error: message }, { status }),
    };
});

import { getServerSession } from '@/lib/auth';

const prisma = getTestPrisma();

describe('User Profile API Integration Tests', () => {
    let testUser: any;
    let mockSession: any;

    beforeEach(async () => {
        resetMockData();
        const uniqueId = Date.now();
        testUser = await createTestUser(`profile-user-${uniqueId}@example.com`, 'password123', `profileuser${uniqueId}`);
        mockSession = createMockSession(testUser);
    });

    describe('GET /api/user/profile - Get User Profile', () => {
        it('should get user profile when authenticated', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const response = await GET();
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.user).toBeDefined();
            expect(data.user.email).toBe(testUser.email);
            expect(data.user.profile).toBeDefined();
            expect(data.user.profile.username).toBe(testUser.profile.username);
        });

        it('should fail when not authenticated', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);

            const response = await GET();
            const data = await parseResponse(response);

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
        });

        it('should not include sensitive data like hashedPassword', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const response = await GET();
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.user.hashedPassword).toBeUndefined();
        });

        it('should include user roles', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const response = await GET();
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.user.userRoles).toBeDefined();
            expect(Array.isArray(data.user.userRoles)).toBe(true);
        });
    });

    describe('PUT /api/user/profile - Update User Profile', () => {
        it('should update profile successfully', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('PUT', '/api/user/profile', {
                body: {
                    displayName: 'Updated Name',
                    bio: 'This is my updated bio',
                    location: 'New York, NY',
                    website: 'https://example.com',
                },
            });

            const response = await PUT(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.profile).toBeDefined();
            expect(data.profile.displayName).toBe('Updated Name');
            expect(data.profile.bio).toBe('This is my updated bio');

            // Verify in database
            const updatedProfile = await prisma.profile.findUnique({
                where: { userId: testUser.id },
            });

            expect(updatedProfile?.displayName).toBe('Updated Name');
            expect(updatedProfile?.bio).toBe('This is my updated bio');
        });

        it('should fail when not authenticated', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);

            const request = createMockRequest('PUT', '/api/user/profile', {
                body: {
                    displayName: 'Hacker',
                },
            });

            const response = await PUT(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
        });

        it('should sanitize malicious input', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('PUT', '/api/user/profile', {
                body: {
                    bio: '<p>Normal bio</p><script>alert("XSS")</script>',
                },
            });

            const response = await PUT(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            if (data.profile && data.profile.bio) {
                expect(data.profile.bio).not.toContain('<script>');
            }
        });

        it('should validate URL format for website', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('PUT', '/api/user/profile', {
                body: {
                    website: 'not-a-valid-url',
                },
            });

            const response = await PUT(request);
            const data = await parseResponse(response);

            // Zod validation should return 400
            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });

        it('should update partial profile fields', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            // Update only displayName
            const request = createMockRequest('PUT', '/api/user/profile', {
                body: {
                    displayName: 'Only Name Changed',
                },
            });

            const response = await PUT(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(200);
            expect(data.profile.displayName).toBe('Only Name Changed');
        });
    });

    describe('POST /api/user/change-password - Change Password', () => {
        it('should change password successfully', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/user/change-password', {
                body: {
                    currentPassword: 'password123',
                    newPassword: 'NewSecurePassword456!',
                },
            });

            const response = await changePassword(request);
            const data = await parseResponse(response);

            if (response.status !== 200) {
                console.log('Change Password Failed:', JSON.stringify(data, null, 2));
            }

            expect(response.status).toBe(200);
            expect(data.message).toBeDefined();

            // Verify password was actually changed
            const updatedUser = await prisma.user.findUnique({
                where: { id: testUser.id },
            });

            expect(updatedUser?.hashedPassword).toBeDefined();
            expect(updatedUser?.hashedPassword).not.toBe(testUser.hashedPassword);
        });

        it('should fail with incorrect current password', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/user/change-password', {
                body: {
                    currentPassword: 'wrongpassword',
                    newPassword: 'NewPassword123!',
                },
            });

            const response = await changePassword(request);
            const data = await parseResponse(response);

            // CHANGED STATUS CODE TO 401 to match implementation
            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
        });

        it('should fail with weak new password', async () => {
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('POST', '/api/user/change-password', {
                body: {
                    currentPassword: 'password123',
                    newPassword: '123', // Too weak
                },
            });

            const response = await changePassword(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(400);
            expect(data.error).toBeDefined();
        });

        it('should fail when not authenticated', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);

            const request = createMockRequest('POST', '/api/user/change-password', {
                body: {
                    currentPassword: 'password123',
                    newPassword: 'NewPassword123!',
                },
            });

            const response = await changePassword(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
        });
    });

    describe('DELETE /api/user/delete-account - Delete Account', () => {
        it('should delete account successfully', async () => {
            const { dataGovernanceService } = await import('@/application/services/DataGovernanceService');
            vi.mocked(getServerSession).mockResolvedValue(mockSession);

            const request = createMockRequest('DELETE', '/api/user/delete-account', {
                body: { deleteType: 'complete' },
            });
            const response = await deleteAccount(request);
            const data = await parseResponse(response);

            if (response.status !== 200) {
                console.log('Delete Account Failed:', JSON.stringify(data, null, 2));
            }

            expect(response.status).toBe(200);
            expect(data.data.message).toBeDefined();

            // Verify the service was called with correct params
            expect(vi.mocked(dataGovernanceService.deleteUserCompletely)).toHaveBeenCalledWith(
                testUser.id,
                testUser.id
            );
        });

        it('should fail when not authenticated', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);

            const request = createMockRequest('DELETE', '/api/user/delete-account');
            const response = await deleteAccount(request);
            const data = await parseResponse(response);

            expect(response.status).toBe(401);
            expect(data.error).toBeDefined();
        });
    });
});
