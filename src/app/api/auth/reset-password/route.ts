import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { withApiHandler, getRequestId } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { RATE_LIMITERS, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Validator for reset password
const ResetPasswordSchema = z.object({
    token: z.string(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const requestId = getRequestId(request);
    const logger = createLogger({ requestId });

    // Multi-layer rate limiting for brute force protection
    // 1. Global rate limit (DDoS protection)
    const globalLimit = await RATE_LIMITERS.resetPasswordGlobal.check('global');
    if (!globalLimit.allowed) {
        logger.warn('Reset password global rate limit exceeded');
        return NextResponse.json(
            { error: 'Service temporarily unavailable. Please try again later.' },
            { status: 503 }
        );
    }

    // 2. IP-based rate limit
    const ip = getClientIp(request);
    const ipLimit = await RATE_LIMITERS.resetPassword.check(ip);
    if (!ipLimit.allowed) {
        logger.warn({ ip }, 'Reset password IP rate limit exceeded');
        return rateLimitResponse(Math.ceil((ipLimit.resetTime.getTime() - Date.now()) / 1000));
    }

    // 3. Token-specific rate limit (prevents brute forcing tokens)
    // We'll check this after parsing the token from the body

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { token, password } = parsed.data;
    
    // 3. Token-specific rate limit (prevents brute forcing tokens)
    const tokenLimit = await RATE_LIMITERS.resetPasswordToken.check(token.substring(0, 16));
    if (!tokenLimit.allowed) {
        logger.warn({ tokenPrefix: token.substring(0, 8) }, 'Reset password token rate limit exceeded');
        return rateLimitResponse(Math.ceil((tokenLimit.resetTime.getTime() - Date.now()) / 1000));
    }
    
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Verify token
    const dbToken = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true }
    });

    if (!dbToken) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (dbToken.usedAt) {
        return NextResponse.json({ error: "Token already used" }, { status: 400 });
    }

    if (new Date() > dbToken.expiresAt) {
        return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    // Update password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Transaction: Update password, mark token used, and increment session version
    await prisma.$transaction([
        prisma.user.update({
            where: { id: dbToken.userId },
            data: { 
                hashedPassword,
                sessionVersion: { increment: 1 }, // Force re-authentication
            },
        }),
        prisma.passwordResetToken.update({
            where: { id: dbToken.id },
            data: { usedAt: new Date() },
        }),
    ]);

    // Delete all other reset tokens for this user for security
    await prisma.passwordResetToken.deleteMany({ 
        where: { 
            userId: dbToken.userId, 
            id: { not: dbToken.id } 
        } 
    });

    logger.info({ userId: dbToken.userId }, "Password reset successful - sessions rotated");

    return NextResponse.json({ ok: true });
}, { method: 'POST', routeName: '/api/auth/reset-password' });
