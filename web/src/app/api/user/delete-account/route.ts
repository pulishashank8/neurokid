import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Anonymize user's posts and comments before deletion
    await prisma.post.updateMany({
      where: { authorId: session.user.id },
      data: { isAnonymous: true },
    });

    await prisma.comment.updateMany({
      where: { authorId: session.user.id },
      data: { isAnonymous: true },
    });

    // Delete user (cascading deletes will handle related records)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
