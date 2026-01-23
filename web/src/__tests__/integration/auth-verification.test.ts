import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { GET as verifyHandler } from '@/app/api/auth/verify-email/route';
import { POST as resendHandler } from '@/app/api/auth/resend-verification/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';
import crypto from 'crypto';

const prisma = getTestPrisma();

// Mock Mailer
vi.mock('@/lib/mailer', () => ({
    sendVerificationEmail: vi.fn(),
}));

import { sendVerificationEmail } from '@/lib/mailer';

describe('Auth Verification Integration', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Use unique emails for tests to avoid collision or cleanup
    });

    const cleanUser = async (email: string) => {
        await prisma.user.deleteMany({ where: { email } });
    };

    it('should create unverified user and send email', async () => {
        const email = 'verify-flow@example.com';
        await cleanUser(email);

        const req = createMockRequest('POST', '/api/auth/register', {
            body: {
                email,
                password: 'Password123!',
                confirmPassword: 'Password123!',
                username: 'verifyflow',
                displayName: 'Verify Flow'
            }
        });

        const res = await registerHandler(req);
        expect(res.status).toBe(201);

        const user = await prisma.user.findUnique({ where: { email } });
        expect(user).toBeDefined();
        // emailVerified defaults to false in schema
        expect(user?.emailVerified).toBe(false);

        expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
        expect(sendVerificationEmail).toHaveBeenCalledWith(email, expect.any(String));

        const token = await prisma.emailVerificationToken.findFirst({ where: { userId: user!.id } });
        expect(token).toBeDefined();
    });

    it('should verify user with valid token', async () => {
        const email = 'valid-token@example.com';
        await cleanUser(email);

        // Setup user 
        const user = await prisma.user.create({
            data: {
                email,
                profile: { create: { username: 'validtokenuser', displayName: 'Valid Token User' } },
                userRoles: { create: { role: 'PARENT' } }
            }
        });

        const tokenRaw = 'validtoken123';
        const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');

        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 60);

        await prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                tokenHash: tokenHash,
                expiresAt: expiry
            }
        });

        const req = createMockRequest('GET', `/api/auth/verify-email?token=${tokenRaw}`);
        const res = await verifyHandler(req);

        expect(res.status).toBe(200);
        const data = await parseResponse(res);
        expect(data.success).toBe(true);

        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
        expect(updatedUser?.emailVerified).toBe(true);
        expect(updatedUser?.emailVerifiedAt).not.toBeNull();

        const token = await prisma.emailVerificationToken.findFirst({ where: { userId: user.id } });
        expect(token).toBeNull();
    });

    it('should fail with invalid token', async () => {
        const req = createMockRequest('GET', `/api/auth/verify-email?token=invalid`);
        const res = await verifyHandler(req);

        // It redirects or returns JSON depending on impl.
        // We implemented JSON return for success, but what about failure?
        // route.ts: return NextResponse.redirect(new URL("/login?error=InvalidToken", request.url));
        // Note: The mocked request URL needs to be valid absolute URL for URL constructor
        // createMockRequest uses http://localhost usually.

        // Actually if it redirects, response status is 307/308 or we check headers/redirect url.
        expect(res.status).toBeGreaterThanOrEqual(300);
        expect(res.status).toBeLessThan(400);

        const location = res.headers.get('location');
        expect(location).toContain('error=InvalidToken');
    });

    it('should resend verification email', async () => {
        const email = 'resend-test@example.com';
        await cleanUser(email);

        const user = await prisma.user.create({
            data: {
                email,
                profile: { create: { username: 'resenduser', displayName: 'Resend User' } },
                userRoles: { create: { role: 'PARENT' } }
            }
        });

        const req = createMockRequest('POST', '/api/auth/resend-verification', {
            body: { email }
        });

        const res = await resendHandler(req);
        expect(res.status).toBe(200);
        const data = await parseResponse(res);
        expect(data.ok).toBe(true);

        expect(sendVerificationEmail).toHaveBeenCalled();

        const token = await prisma.emailVerificationToken.findFirst({ where: { userId: user.id } });
        expect(token).toBeDefined();
    });
});
