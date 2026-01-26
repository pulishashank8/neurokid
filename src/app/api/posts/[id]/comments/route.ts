import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validations/community";
import { canModerate } from "@/lib/rbac";
import { invalidateCache } from "@/lib/redis";
import { RATE_LIMITERS, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { createLogger } from "@/lib/logger";
import { getRequestId, withApiHandler } from "@/lib/apiHandler";
import { sanitizeHtml } from "@/lib/security";
import { successResponse, errorResponse, notFoundError, unauthorizedError } from "@/lib/apiResponse";
import { logSecurityEvent } from "@/lib/securityAudit";

// GET /api/posts/[id]/comments - Get threaded comments
export const GET = withApiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const requestId = getRequestId(request);
    const logger = createLogger({ requestId });

    // Rate limit: 100 reads per minute per IP (prevent scraping)
    const ip = getClientIp(request);
    const canProceed = await RATE_LIMITERS.readComments.checkLimit(ip);
    if (!canProceed) {
      const retryAfter = await RATE_LIMITERS.readComments.getRetryAfter(ip);
      logger.warn({ ip }, 'Read comments rate limit exceeded');
      return rateLimitResponse(retryAfter);
    }

    const { id } = await params;

    // Validate ID format (basic check to ensure it's not a path traversal attempt)
    if (!id || id.includes('/') || id.includes('\\')) {
      logger.warn({ id }, 'Invalid post ID format');
      return NextResponse.json({ error: "Invalid post ID format" }, { status: 400 });
    }

    logger.debug({ postId: id }, 'Fetching comments');

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
      logger.warn({ postId: id }, 'Post not found');
      return notFoundError("Post");
    }

    // Fetch comments for the post with safety limit
    const comments = await prisma.comment.findMany({
      where: {
        postId: id,
        status: { not: "REMOVED" },
      },
      include: {
        author: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 500, // Safety limit for threaded comments
    });

    // Build threaded structure
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create comment objects
    comments.forEach((comment) => {
      const formattedComment = {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: comment.isAnonymous
          ? {
            id: "anonymous",
            username: "Anonymous",
            avatarUrl: null,
          }
          : {
            id: comment.author.id,
            username: comment.author.profile?.username || "Unknown",
            avatarUrl: comment.author.profile?.avatarUrl || null,
          },
        voteScore: comment.voteScore,
        isAnonymous: comment.isAnonymous,
        parentCommentId: comment.parentCommentId,
        children: [],
      };
      commentMap.set(comment.id, formattedComment);
    });

    // Second pass: build tree structure
    commentMap.forEach((comment) => {
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.children.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    logger.info({ postId: id, commentCount: comments.length }, 'Comments fetched successfully');
    return successResponse({ comments: rootComments });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to load comments", 500);
  }
}, { method: 'GET', routeName: '/api/posts/[id]/comments' });

// POST /api/posts/[id]/comments - Create a comment (WITH CRASH PROTECTION)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedError();
    }

    const { id } = await params;
    const body = await request.json();

    const validation = createCommentSchema.safeParse({ ...body, postId: id });

    if (!validation.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid input", 400, validation.error.errors);
    }

    const canComment = await RATE_LIMITERS.createComment.checkLimit(session.user.id);
    if (!canComment) {
      const retryAfter = await RATE_LIMITERS.createComment.getRetryAfter(session.user.id);
      return rateLimitResponse(retryAfter);
    }

    const { content, parentCommentId, isAnonymous } = validation.data;

    const sanitizedContent = sanitizeHtml(content);

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content: sanitizedContent,
          authorId: session.user.id,
          postId: id,
          parentCommentId: parentCommentId || null,
          isAnonymous,
          status: "ACTIVE",
        },
        include: {
          author: {
            select: {
              id: true,
              profile: {
                select: { username: true, avatarUrl: true },
              },
            },
          },
        },
      }),
      prisma.post.update({
        where: { id },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    await invalidateCache(`comments:${id}:*`, { prefix: "posts" });

    return successResponse(comment, 201);
  } catch (outerError: any) {
    console.error("CRITICAL COMMENT ERROR:", outerError);
    return errorResponse("INTERNAL_ERROR", "Failed to create comment", 500);
  }
}
