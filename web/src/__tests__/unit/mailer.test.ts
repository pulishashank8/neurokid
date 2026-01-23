import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Mailer', () => {
    let sendVerificationEmail: any;
    let sendPasswordResetEmail: any;
    let mockSend: any;

    beforeEach(async () => {
        vi.resetModules();

        mockSend = vi.fn().mockResolvedValue({ data: { id: '123' }, error: null });

        // Use doMock to provide a fresh mock for each test run
        // identifying precisely which instance of Resend is used
        vi.doMock('resend', () => {
            return {
                Resend: class MockResend {
                    emails = { send: mockSend }
                }
            };
        });

        // Ensure strict environment for testing
        process.env.RESEND_API_KEY = 're_123';
        process.env.EMAIL_FROM = 'test@example.com';
        process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

        // Dynamic import to pick up the mock
        const mailer = await import('../../lib/mailer');
        sendVerificationEmail = mailer.sendVerificationEmail;
        sendPasswordResetEmail = mailer.sendPasswordResetEmail;
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete process.env.RESEND_API_KEY;
    });

    describe('sendVerificationEmail', () => {
        it('should send an email with the correct parameters', async () => {
            await sendVerificationEmail('user@example.com', 'token123');

            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
                from: 'test@example.com',
                to: 'user@example.com',
                subject: 'Welcome to NeuroKind! Please verify your email',
                // Loose matching
                html: expect.stringMatching(/http:\/\/localhost:3000\/verify-email\?token=token123/),
            }));
        });

        it('should handle errors gracefully', async () => {
            mockSend.mockResolvedValueOnce({ data: null, error: { message: 'Failed' } });

            await expect(sendVerificationEmail('user@example.com', 'token123'))
                .rejects.toThrow('Failed to send verification email');
        });

        it('should log and return if RESEND_API_KEY is missing', async () => {
            // We must reset modules again to change env var effectively if we want the module to see it as changed
            // although we fixed mailer.ts to read it dynamically, so simple delete works?
            // Yes, because we read process.env.RESEND_API_KEY inside the function now.

            delete process.env.RESEND_API_KEY;
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => { });

            await sendVerificationEmail('user@example.com', 'token123');

            expect(mockSend).not.toHaveBeenCalled();
            expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('RESEND_API_KEY is not set'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Verification URL for user@example.com'));
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should send a reset email with the correct parameters', async () => {
            await sendPasswordResetEmail('forgot@example.com', 'resetToken456');

            expect(mockSend).toHaveBeenCalledTimes(1);
            expect(mockSend).toHaveBeenCalledWith({
                from: 'test@example.com',
                to: 'forgot@example.com',
                subject: 'Reset your NeuroKind password',
                html: expect.stringMatching(/http:\/\/localhost:3000\/reset-password\?token=resetToken456/),
            });
        });

        it('should log and return if RESEND_API_KEY is missing for reset', async () => {
            delete process.env.RESEND_API_KEY;
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => { });

            await sendPasswordResetEmail('forgot@example.com', 'resetToken456');

            expect(mockSend).not.toHaveBeenCalled();
            expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('RESEND_API_KEY is not set'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Reset URL for forgot@example.com'));
        });
    });
});
