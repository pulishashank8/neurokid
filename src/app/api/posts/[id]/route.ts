import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { updatePostSchema } from "@/lib/validations/community";
import { canModerate } from "@/lib/rbac";
import { RATE_LIMITERS, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { withApiHandler, getRequestId } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import { sanitizeHtml } from "@/lib/security";
import { successResponse, errorResponse, forbiddenError, notFoundError, unauthorizedError } from "@/lib/apiResponse";
import { logSecurityEvent } from "@/lib/securityAudit";
import { Prisma } from "@prisma/client";

function enforceSafeLinks(html: string): string {
  return html.replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
    const hasRel = /\brel\s*=/.test(attrs);
    const normalizedAttrs = hasRel ? attrs : `${attrs} rel="noopener noreferrer"`;
    return `<a ${normalizedAttrs}>`;
  });
}

// GET /api/posts/[id] - Get single post
export const GET = withApiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const logger = createLogger({ context: 'GET /api/posts/[id]' });
  try {
    const { id } = await params;

    logger.debug({ postId: id }, 'Starting request');

    if (!id) {
      return errorResponse("VALIDATION_ERROR", "Post ID missing", 400);
    }

    if (id.length > 50) {
      return errorResponse("VALIDATION_ERROR", "Invalid ID", 400);
    }

    logger.debug({ postId: id }, 'Fetching from Prisma');
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        author: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!post) {
      logger.debug({ postId: id }, 'Post not found');
      return notFoundError("Post");
    }

    logger.debug({ postId: id, title: post.title }, 'Post found');

    // Format response
    const formattedPost = {
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      category: post.category,
      tags: post.tags,
      author: post.isAnonymous || !post.author
        ? {
          id: "anonymous",
          username: "Anonymous",
          avatarUrl: null,
          bio: null,
        }
        : {
          id: post.author.id,
          username: post.author.profile?.username || "Unknown",
          avatarUrl: post.author.profile?.avatarUrl || null,
          bio: post.author.profile?.bio || null,
        },
      voteScore: post.voteScore,
      commentCount: post._count.comments,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      status: post.status,
      isAnonymous: post.isAnonymous,
    };

    logger.debug({ postId: id }, 'Sending response');
    return successResponse(formattedPost);
  } catch (error) {
    console.error(`[GET /api/posts/FAILED] Error:`, error);
    console.error(`Stack:`, error instanceof Error ? error.stack : 'No stack trace');
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}, {
  method: 'GET',
  routeName: 'GET /api/posts/[id]',
  requireAuth: false,
});

// PATCH /api/posts/[id] - Update post
export async function PATCH(
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
    const validation = updatePostSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid input", 400, validation.error.errors);
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return notFoundError("Post");
    }

    const isModerator = await canModerate(session.user.id);
    if (post.authorId !== session.user.id && !isModerator) {
      await logSecurityEvent({
        action: 'PERMISSION_DENIED',
        userId: session.user.id,
        resource: 'post',
        resourceId: id,
        details: { action: 'update_attempt' },
      });
      return forbiddenError();
    }

    const { title, content, categoryId, tagIds, isAnonymous } = validation.data;

    const updateData: Prisma.PostUpdateInput = {};
    if (title) updateData.title = sanitizeHtml(title);
    if (content) {
      updateData.content = sanitizeHtml(enforceSafeLinks(content));
    }
    if (categoryId) updateData.category = { connect: { id: categoryId } };
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;

    if (tagIds) {
      updateData.tags = {
        set: tagIds.map((tagId) => ({ id: tagId })),
      };
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        tags: true,
        author: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    const formattedPost = {
      id: updatedPost.id,
      title: updatedPost.title,
      content: updatedPost.content,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
      category: updatedPost.category,
      tags: updatedPost.tags,
      author: updatedPost.isAnonymous || !updatedPost.author
        ? {
          id: "anonymous",
          username: "Anonymous",
          avatarUrl: null,
          bio: null,
        }
        : {
          id: updatedPost.author.id,
          username: updatedPost.author.profile?.username || "Unknown",
          avatarUrl: updatedPost.author.profile?.avatarUrl || null,
          bio: updatedPost.author.profile?.bio || null,
        },
      voteScore: updatedPost.voteScore,
      commentCount: updatedPost._count.comments,
      isPinned: updatedPost.isPinned,
      isLocked: updatedPost.isLocked,
      status: updatedPost.status,
      isAnonymous: updatedPost.isAnonymous,
    };

    return successResponse(formattedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to update post", 500);
  }
}

// DELETE /api/posts/[id] - Soft delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedError();
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return notFoundError("Post");
    }

    const isModerator = await canModerate(session.user.id);
    if (post.authorId !== session.user.id && !isModerator) {
      await logSecurityEvent({
        action: 'PERMISSION_DENIED',
        userId: session.user.id,
        resource: 'post',
        resourceId: id,
        details: { action: 'delete_attempt' },
      });
      return forbiddenError();
    }

    await prisma.post.update({
      where: { id },
      data: { status: "REMOVED" },
    });

    await logSecurityEvent({
      action: 'MODERATION_ACTION',
      userId: session.user.id,
      resource: 'post',
      resourceId: id,
      details: { action: 'deleted' },
    });

    return successResponse({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to delete post", 500);
  }
}
