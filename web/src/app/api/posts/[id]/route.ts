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
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;

  try {
    const { id } = params;

    if (!id) {
      console.error("GET /api/posts/[id]: ID is missing");
      return NextResponse.json({ error: "Post ID missing" }, { status: 400 });
    }

    // Validate ID format (CUIDs are alphanumeric collision-resistant specific ids)
    // Basic sanity check to avoid database errors
    if (id.length > 50) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    console.log(`Fetching post with ID: ${id}`);

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
      console.warn(`Post not found in DB: ${id}`);
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

    return NextResponse.json(formattedPost);
  } catch (error: any) {
    console.error("Error in GET /api/posts/[id]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
