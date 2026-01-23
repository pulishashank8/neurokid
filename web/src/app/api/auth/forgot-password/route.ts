import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { withApiHandler, getRequestId } from "@/lib/apiHandler";
import { RATE_LIMITERS, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { createLogger } from "@/lib/logger";

export const POST = withApiHandler(async (request: NextRequest) => {
    const requestId = getRequestId(request);
    const logger = createLogger({ requestId });

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { email } = body;

    if (!email || typeof email !== "string") {
        return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Rate Limiting
    // 1. Cooldown
    const cooldown = await checkRateLimit(RATE_LIMITERS.forgotPassword, email);
    if (!cooldown.allowed) {
        return rateLimitResponse(cooldown.retryAfterSeconds || 60);
    }

    // 2. Daily limit
    const daily = await checkRateLimit(RATE_LIMITERS.forgotPasswordDaily, email);
    if (!daily.allowed) {
        return rateLimitResponse(daily.retryAfterSeconds || 86400);
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email },
        include: { userRoles: true }, // just in case we need role check later
    });

    // Always return true to prevent enumeration
    if (!user || user.hashedPassword === null) {
        // If user doesn't exist OR user has no password (e.g. Google-only user), do nothing but return ok.
        // Ideally for Google users we might send an email saying "You use Google login" but keeping it simple/secure.
        return NextResponse.json({ ok: true });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 60);

    // Store token
    await prisma.passwordResetToken.create({
        data: {
            userId: user.id,
            tokenHash,
            expiresAt: expiryDate,
        },
    });

    // Send email
    try {
        await sendPasswordResetEmail(user.email, resetToken);
        logger.info({ userId: user.id }, "Password reset email sent");
    } catch (error) {
        logger.error({ error, userId: user.id }, "Failed to send password reset email");
        // Fail silently to client
    }

    return NextResponse.json({ ok: true });
}, { method: 'POST', routeName: '/api/auth/forgot-password' });
