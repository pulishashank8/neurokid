import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validations/community";
import { canModerate } from "@/lib/rbac";
// import sanitizeHtml from 'sanitize-html';
import { invalidateCache } from "@/lib/redis";
import { rateLimitResponse, RATE_LIMITERS } from "@/lib/rateLimit";
import { createLogger } from "@/lib/logger";
import { getRequestId } from "@/lib/apiHandler";

function enforceSafeLinks(html: string): string {
  return html.replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
    const hasRel = /\brel\s*=/.test(attrs);
    const normalizedAttrs = hasRel ? attrs : `${attrs} rel="noopener noreferrer"`;
    return `<a ${normalizedAttrs}>`;
  });
}

// GET /api/posts/[id]/comments - Get threaded comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!post) {
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

    return NextResponse.json({ comments: rootComments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

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
    const sanitizedContent = enforceSafeLinks(content);

    // Create comment
    const comment = await prisma.comment.create({
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
    });

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
