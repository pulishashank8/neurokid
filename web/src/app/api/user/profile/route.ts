import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/community";
import { RATE_LIMITERS, rateLimitResponse } from "@/lib/rateLimit";
import { withApiHandler, getRequestId } from "@/lib/apiHandler";
import { createLogger } from "@/lib/logger";
import sanitizeHtml from 'sanitize-html';

// GET /api/user/profile
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        userRoles: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        userRoles: user.userRoles,
      }
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile
export const PUT = withApiHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId });

  const session = await getServerSession();
  if (!session?.user?.id) {
    logger.warn('Unauthorized profile update attempt');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 10 profile updates per minute per user
  const canUpdate = await RATE_LIMITERS.updateProfile.checkLimit(session.user.id);
  if (!canUpdate) {
    const retryAfter = await RATE_LIMITERS.updateProfile.getRetryAfter(session.user.id);
    logger.warn({ userId: session.user.id }, 'Profile update rate limit exceeded');
    return rateLimitResponse(retryAfter);
  }

  const body = await request.json();

  // Use the new strict validation schema
  const validation = updateProfileSchema.safeParse(body);
  if (!validation.success) {
    logger.warn({ validationErrors: validation.error.errors }, 'Profile validation failed');
    return NextResponse.json(
      {
        error: "Validation failed",
        details: validation.error.errors,
      },
      { status: 400 }
    );
  }

  const { username, displayName, bio, avatarUrl, location, website } = validation.data;

  // Sanitize bio
  const sanitizedBio = bio ? sanitizeHtml(bio, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'a': ['href', 'name', 'target', 'rel']
    }
  }) : bio;

  logger.debug({ userId: session.user.id, username }, 'Updating profile');

  // Check if username is taken (if provided and different from current)
  if (username) {
    const existingProfile = await prisma.profile.findUnique({
      where: { username },
    });

    if (existingProfile && existingProfile.userId !== session.user.id) {
      logger.warn({ username }, 'Username already taken');
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
  }

  // Update profile
  const profile = await prisma.profile.update({
    where: { userId: session.user.id },
    data: {
      ...(username && { username }),
      ...(displayName && { displayName }),
      ...(sanitizedBio !== undefined && { bio: sanitizedBio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(location !== undefined && { location }),
      ...(website !== undefined && { website }),
    },
  });

  logger.info({ userId: session.user.id }, 'Profile updated successfully');
  return NextResponse.json({
    message: "Profile updated successfully",
    profile,
  });
}, { method: 'PUT', routeName: '/api/user/profile' });
