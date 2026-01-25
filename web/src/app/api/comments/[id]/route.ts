import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { updateCommentSchema } from "@/lib/validations/community";
import { canModerate } from "@/lib/rbac";


function enforceSafeLinks(html: string): string {
  return html.replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
    const hasRel = /\brel\s*=/.test(attrs);
    const normalizedAttrs = hasRel ? attrs : `${attrs} rel="noopener noreferrer"`;
    return `<a ${normalizedAttrs}>`;
  });
}

// SUPER STABLE SANITIZER (No external dependencies)
function simpleSanitize(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:[^"']*/gi, "");
}

// PATCH /api/comments/[id] - Update comment
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
    const validation = updateCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        authorId: true,
        createdAt: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check permissions - author or moderator can edit
    const isModerator = await canModerate(session.user.id);
    const isAuthor = comment.authorId === session.user.id;

    if (!isAuthor && !isModerator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check 30-minute edit window for authors (moderators can always edit)
    if (isAuthor && !isModerator) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (comment.createdAt < thirtyMinutesAgo) {
        return NextResponse.json(
          { error: "Comment can only be edited within 30 minutes of posting" },
          { status: 403 }
        );
      }
    }

    const { content } = validation.data;

    // Sanitize content
    const sanitizedContent = simpleSanitize(content);

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: sanitizedContent,
        updatedAt: new Date(),
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

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Soft delete comment
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

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check permissions - author or moderator can delete
    const isModerator = await canModerate(session.user.id);
    if (comment.authorId !== session.user.id && !isModerator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete by changing status
    await prisma.comment.update({
      where: { id },
      data: { status: "REMOVED" },
    });

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
