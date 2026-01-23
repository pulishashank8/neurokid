import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as forgotPasswordHandler } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordHandler } from '@/app/api/auth/reset-password/route';
import { createMockRequest, parseResponse } from '../helpers/api';
import { getTestPrisma } from '../helpers/database';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';

const prisma = getTestPrisma();

// Mock Mailer
vi.mock('@/lib/mailer', () => ({
    sendPasswordResetEmail: vi.fn(),
}));

import { sendPasswordResetEmail } from '@/lib/mailer';

describe('Auth Forgot Password Integration', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
    });

    const cleanUser = async (email: string) => {
        await prisma.user.deleteMany({ where: { email } });
    };

    it('should generate token and send email for existing user', async () => {
        const email = 'forgot-flow@example.com';
        await cleanUser(email);

        const hashedPassword = await bcryptjs.hash('OldPass1!', 10);
        const user = await prisma.user.create({
            data: {
                email,
                hashedPassword,
                profile: { create: { username: 'forgotflow', displayName: 'Forgot Flow' } },
                userRoles: { create: { role: 'PARENT' } }
            }
        });

        const req = createMockRequest('POST', '/api/auth/forgot-password', {
            body: { email }
        });

        const res = await forgotPasswordHandler(req);
        expect(res.status).toBe(200);
        const data = await parseResponse(res);
        expect(data.ok).toBe(true);

        expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
        expect(sendPasswordResetEmail).toHaveBeenCalledWith(email, expect.any(String));

        const token = await prisma.passwordResetToken.findFirst({ where: { userId: user.id } });
        expect(token).toBeDefined();
    });

    it('should return success but do nothing for non-existing user', async () => {
        const email = 'nonexistent@example.com';
        await cleanUser(email);

        const req = createMockRequest('POST', '/api/auth/forgot-password', {
            body: { email }
        });

        const res = await forgotPasswordHandler(req);
        expect(res.status).toBe(200);
        const data = await parseResponse(res);
        expect(data.ok).toBe(true);

        expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should reset password with valid token', async () => {
        const email = 'reset-flow@example.com';
        await cleanUser(email);

        const oldHash = await bcryptjs.hash('OldPass1!', 10);
        const user = await prisma.user.create({
            data: {
                email,
                hashedPassword: oldHash,
                profile: { create: { username: 'resetflow', displayName: 'Reset Flow' } },
                userRoles: { create: { role: 'PARENT' } }
            }
        });

        const tokenRaw = 'validresettoken123';
        const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 60);

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: expiry
            }
        });

        const newPassword = 'NewPassword1!';
        const req = createMockRequest('POST', '/api/auth/reset-password', {
            body: {
                token: tokenRaw,
                password: newPassword,
                confirmPassword: newPassword
            }
        });

        const res = await resetPasswordHandler(req);
        expect(res.status).toBe(200);

        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
        const isValid = await bcryptjs.compare(newPassword, updatedUser!.hashedPassword!);
        expect(isValid).toBe(true);
        expect(isValid).not.toBe(await bcryptjs.compare('OldPass1!', updatedUser!.hashedPassword!));

        const usedToken = await prisma.passwordResetToken.findFirst({ where: { userId: user.id } });
        expect(usedToken?.usedAt).not.toBeNull();
    });

    it('should fail reset with expired token', async () => {
        const email = 'expired-reset@example.com';
        await cleanUser(email);

        const user = await prisma.user.create({
            data: {
                email,
                profile: { create: { username: 'expiredreset', displayName: 'Expired Reset' } },
                userRoles: { create: { role: 'PARENT' } }
            }
        });

        const tokenRaw = 'expiredtoken';
        const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() - 10); // Expired

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: expiry
            }
        });

        const req = createMockRequest('POST', '/api/auth/reset-password', {
            body: {
                token: tokenRaw,
                password: 'NewPassword1!',
                confirmPassword: 'NewPassword1!'
            }
        });

        const res = await resetPasswordHandler(req);
        expect(res.status).toBe(400);
        const data = await parseResponse(res);
        expect(data.error).toBe('Token expired');
    });

    it('should fail if passwords do not match', async () => {
        const req = createMockRequest('POST', '/api/auth/reset-password', {
            body: {
                token: 'sometoken',
                password: 'Password1!',
                confirmPassword: 'Password2!'
            }
        });

        const res = await resetPasswordHandler(req);
        expect(res.status).toBe(400);
        const data = await parseResponse(res);
        expect(data.error).toBe("Passwords don't match");
    });
});
