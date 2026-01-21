import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { updatePostSchema } from "@/lib/validations/community";
import { canModerate } from "@/lib/rbac";
import { RATE_LIMITERS, getClientIp, rateLimitResponse } from "@/lib/rateLimit";
import { withApiHandler, getRequestId } from "@/lib/apiHandler";
import { createLogger } from "@/lib/logger";
// import sanitizeHtml from 'sanitize-html';

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
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId });

  // Rate limit: 200 reads per minute per IP (prevent scraping)
  const ip = getClientIp(request);
  const canProceed = await RATE_LIMITERS.readPost.checkLimit(ip);
  if (!canProceed) {
    const retryAfter = await RATE_LIMITERS.readPost.getRetryAfter(ip);
    logger.warn({ ip }, 'Read post rate limit exceeded');
    return rateLimitResponse(retryAfter);
  }

  const { id } = await params;

  // Validate ID format (basic check to ensure it's not a path traversal attempt)
  if (!id || id.includes('/') || id.includes('\\')) {
    logger.warn({ id }, 'Invalid post ID format');
    return NextResponse.json({ error: "Invalid post ID format" }, { status: 400 });
  }

  logger.debug({ postId: id }, 'Fetching post');

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
    logger.warn({ postId: id }, 'Post not found');
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Format response - hide author if anonymous
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

  logger.info({ postId: id }, 'Post fetched successfully');
  return NextResponse.json(formattedPost);
}, { method: 'GET', routeName: '/api/posts/[id]' });

// PATCH /api/posts/[id] - Update post
export async function PATCH(
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
    const validation = updatePostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check permissions - author or moderator can edit
    const isModerator = await canModerate(session.user.id);
    if (post.authorId !== session.user.id && !isModerator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, content, categoryId, tagIds } = validation.data;

    // Sanitize content if provided
    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) {
      updateData.content = enforceSafeLinks(content);
    }
    if (categoryId) updateData.categoryId = categoryId;

    // Handle tags update
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
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check permissions - author or moderator can delete
    const isModerator = await canModerate(session.user.id);
    if (post.authorId !== session.user.id && !isModerator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete by changing status
    await prisma.post.update({
      where: { id },
      data: { status: "REMOVED" },
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
