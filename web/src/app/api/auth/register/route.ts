import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegisterSchemaWithConfirm } from "@/lib/validators";
import bcryptjs from "bcryptjs";
import {
  RATE_LIMITERS,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { withApiHandler, getRequestId } from "@/lib/apiHandler";
import { createLogger } from "@/lib/logger";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/mailer";

export const POST = withApiHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId });

  const body = await request.json();

  // Validate input first (don't count invalid requests against rate limit)
  const parsed = RegisterSchemaWithConfirm.safeParse(body);
  if (!parsed.success) {
    logger.warn({ validationErrors: parsed.error.errors }, 'Registration validation failed');
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.errors,
      },
      { status: 400 }
    );
  }

  const { email, password, username, displayName } = parsed.data;

  // Rate limit: 5 registrations per hour per IP (after validation passes)
  const ip = getClientIp(request);
  const canRegister = await RATE_LIMITERS.register.checkLimit(ip);

  if (!canRegister) {
    const retryAfter = await RATE_LIMITERS.register.getRetryAfter(ip);
    logger.warn({ ip }, 'Registration rate limit exceeded');
    return rateLimitResponse(retryAfter);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    logger.warn({ email: email.substring(0, 3) + '***' }, 'Registration attempt with existing email');
    return NextResponse.json(
      { error: "User already exists with this email" },
      { status: 409 }
    );
  }

  // Check if username is already taken
  const existingUsername = await prisma.profile.findUnique({
    where: { username },
  });

  if (existingUsername) {
    logger.warn({ username }, 'Registration attempt with existing username');
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  // Create email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + 60); // 60 mins expiry

  // Hash password
  const hashedPassword = await bcryptjs.hash(password, 10);

  // Create user with profile
  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword,
      profile: {
        create: {
          username,
          displayName,
        },
      },
      // Assign PARENT role by default
      userRoles: {
        create: {
          role: "PARENT",
        },
      },
    },
    include: {
      profile: true,
      userRoles: true,
    },
  });

  // Store verification token
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: expiryDate,
    },
  });

  // Send verification email
  try {
    await sendVerificationEmail(user.email, verificationToken);
  } catch (emailError) {
    logger.error({ error: emailError, userId: user.id }, 'Failed to send verification email');
    // Note: We don't rollback user creation, but user will be unverified.
    // Client can request resend.
  }

  logger.info({ userId: user.id, username }, 'User registered successfully');
  return NextResponse.json(
    {
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        roles: user.userRoles.map((ur) => ur.role),
      },
    },
    { status: 201 }
  );
}, { method: 'POST', routeName: '/api/auth/register' });
