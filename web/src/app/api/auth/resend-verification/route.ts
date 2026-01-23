import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/mailer";
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
    // 1. Cooldown (1 min)
    const cooldown = await checkRateLimit(RATE_LIMITERS.verification, email);
    if (!cooldown.allowed) {
        return rateLimitResponse(cooldown.retryAfterSeconds || 60);
    }

    // 2. Daily limit (10 per day)
    const daily = await checkRateLimit(RATE_LIMITERS.verificationDaily, email);
    if (!daily.allowed) {
        return rateLimitResponse(daily.retryAfterSeconds || 86400);
    }

    // 3. Prevent enumeration - always return OK even if user missing or verified.
    // We process silently if user matches.

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // User not found - pretend success
        return NextResponse.json({ ok: true });
    }

    if (user.emailVerified) {
        // User already verified - pretend success (they are verified, so they can login)
        return NextResponse.json({ ok: true });
    }

    // 4. Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 60);

    // 5. Store token
    await prisma.emailVerificationToken.create({
        data: {
            userId: user.id,
            tokenHash,
            expiresAt: expiryDate,
        },
    });

    // 6. Send email
    try {
        await sendVerificationEmail(user.email, verificationToken);
        logger.info({ userId: user.id }, "Verification email resent");
    } catch (error) {
        logger.error({ error, userId: user.id }, "Failed to resend verification email");
        // We log but still return success to the client preventing leakage, 
        // though arguably a failure should be communicated. 
        // Given 'Prevent user enumeration' is a strong requirement, we mask it.
        // However, if Resend fails, it might be a system issue.
        // But distinguishing system error vs user not found is info leak?
        // User not found -> success.
        // User found + error -> error? -> Leaks user exists.
        // So verify strictness: "always return ok true even if email not found". 
        // It doesn't explicitly forbid returning error if system fails.
        // But for now I'll return success to be safe and consistent.
    }

    return NextResponse.json({ ok: true });

}, { method: 'POST', routeName: '/api/auth/resend-verification' });
