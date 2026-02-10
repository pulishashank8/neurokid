import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { canModerate } from "@/lib/rbac";
import { invalidateCache } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await canModerate(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { postId, isLocked, reason } = body;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    await prisma.post.update({
      where: { id: postId },
      data: { isLocked },
    });

    await prisma.modActionLog.create({
      data: {
        actionType: isLocked ? "LOCK" : "UNPIN",
        targetType: "POST",
        targetId: postId,
        moderatorId: session.user.id,
        targetTitle: post.title,
        reason,
      },
    });

    await invalidateCache("posts:*", { prefix: "posts" });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error locking post:", e);
    return NextResponse.json({ error: "Failed to lock post" }, { status: 500 });
  }
}
