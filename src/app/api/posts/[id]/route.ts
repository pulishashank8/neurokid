import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { updatePostSchema } from "@/lib/validations/community";
import { canModerate } from "@/lib/rbac";
import { withApiHandler } from "@/lib/api/apiHandler";
import { sanitizeHtml } from "@/lib/security";
import { successResponse, errorResponse, forbiddenError, notFoundError, unauthorizedError } from "@/lib/api/apiResponse";
import { logSecurityEvent } from "@/lib/securityAudit";

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
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse("VALIDATION_ERROR", "Post ID missing", 400);
    }

    if (id.length > 50) {
      return errorResponse("VALIDATION_ERROR", "Invalid ID", 400);
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        isAnonymous: true,
        isPinned: true,
        isLocked: true,
        status: true,
        voteScore: true,
        likeCount: true,
        dislikeCount: true,
        images: true,
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
          select: { comments: true },
        },
      },
    });

    const postWithVote = post ? {
      ...post,
      likeCount: post.likeCount ?? 0,
      dislikeCount: post.dislikeCount ?? 0,
    } : null;

    let userVote = 0;
    if (postWithVote) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        const vote = await prisma.vote.findUnique({
          where: {
            userId_targetId_targetType: {
              userId: session.user.id,
              targetId: id,
              targetType: "POST",
            },
          },
          select: { value: true },
        });
        userVote = vote?.value ?? 0;
      }
    }

    const postToFormat = postWithVote || post;
    if (!postToFormat) {
      return notFoundError("Post");
    }

    // Format response
    const formattedPost = {
      id: postToFormat.id,
      title: postToFormat.title,
      content: postToFormat.content,
      createdAt: postToFormat.createdAt,
      updatedAt: postToFormat.updatedAt,
      category: postToFormat.category,
      tags: postToFormat.tags,
      author: postToFormat.isAnonymous || !postToFormat.author
        ? {
          id: "anonymous",
          username: "Anonymous",
          avatarUrl: null,
          bio: null,
        }
        : {
          id: postToFormat.author.id,
          username: postToFormat.author.profile?.username || "Unknown",
          avatarUrl: postToFormat.author.profile?.avatarUrl || null,
          bio: postToFormat.author.profile?.bio || null,
        },
      voteScore: postToFormat.voteScore,
      likeCount: (postToFormat as any).likeCount ?? 0,
      dislikeCount: (postToFormat as any).dislikeCount ?? 0,
      userVote,
      commentCount: postToFormat._count.comments,
      isPinned: postToFormat.isPinned,
      isLocked: postToFormat.isLocked,
      status: postToFormat.status,
      isAnonymous: postToFormat.isAnonymous,
    };

    return successResponse(formattedPost);
  } catch (error: any) {
    console.error("Error fetching post:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
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

    const updateData: any = {};
    if (title) updateData.title = sanitizeHtml(title);
    if (content) {
      updateData.content = sanitizeHtml(enforceSafeLinks(content));
    }
    if (categoryId) updateData.categoryId = categoryId;
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
