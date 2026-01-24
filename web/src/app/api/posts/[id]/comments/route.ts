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
import DOMPurify from 'isomorphic-dompurify';

function enforceSafeLinks(html: string): string {
  return html.replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
    const hasRel = /\brel\s*=/.test(attrs);
    const normalizedAttrs = hasRel ? attrs : `${attrs} rel="noopener noreferrer"`;
    return `<a ${normalizedAttrs}>`;
  });
}

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
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch all comments for the post
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
    return NextResponse.json({ comments: rootComments });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}, { method: 'GET', routeName: '/api/posts/[id]/comments' });

// POST /api/posts/[id]/comments - Create a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Add postId to body for validation
    const validation = createCommentSchema.safeParse({ ...body, postId: id });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Rate limit: 10 comments per minute per user
    const canComment = await RATE_LIMITERS.createComment.checkLimit(
      session.user.id
    );
    if (!canComment) {
      const retryAfter = await RATE_LIMITERS.createComment.getRetryAfter(
        session.user.id
      );
      return rateLimitResponse(retryAfter);
    }

    const { content, parentCommentId, isAnonymous } = validation.data;

    // Check if post exists and is not locked
    const post = await prisma.post.findUnique({
      where: { id },
      select: { isLocked: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // If post is locked, only moderators can comment
    if (post.isLocked) {
      const isModerator = await canModerate(session.user.id);
      if (!isModerator) {
        return NextResponse.json(
          { error: "This post is locked. Only moderators can comment." },
          { status: 403 }
        );
      }
    }

    // If replying to a comment, verify parent exists
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
        select: { postId: true },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      if (parentComment.postId !== id) {
        return NextResponse.json(
          { error: "Parent comment does not belong to this post" },
          { status: 400 }
        );
      }
    }

    // Sanitize content
    const dirty = enforceSafeLinks(content);
    const sanitizedContent = DOMPurify.sanitize(dirty);

    // Create comment and increment post comment count
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content: sanitizedContent,
          authorId: session.user.id,
          postId: id,
          parentCommentId: parentCommentId || null,
          isAnonymous,
          status: "ACTIVE", // Auto-approve
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
      }),
      prisma.post.update({
        where: { id },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    // Format response
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
      postId: comment.postId,
      parentCommentId: comment.parentCommentId,
      children: [],
    };

    // Invalidate post comments cache
    await invalidateCache(`comments:${id}:*`, { prefix: "posts" });

    return NextResponse.json(formattedComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
