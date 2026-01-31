import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { messageId } = await params;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        conversation: {
          select: {
            participants: {
              select: { userId: true }
            }
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user is a participant
    const isParticipant = message.conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const deleteType = searchParams.get("type") || "everyone";

    // For now, consistent message schema supports "hard delete" (Unsend)
    // We strictly allow sender to delete their own message.
    if (message.senderId !== userId) {
      return NextResponse.json({ error: "You can only delete your own messages" }, { status: 403 });
    }

    // Future: Implement 'deletedBy' array for 'delete for me'
    if (deleteType === "me") {
      return NextResponse.json({ error: "Delete for me is not yet supported in this version. Use Delete for Everyone." }, { status: 501 });
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { messageId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      // Allow empty content if there is an image? 
      // The current update logic is usually just for text. 
      // If we want to allow removing text but keeping image, we might need to relax this.
      // But typically "Edit" means editing the text.
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.senderId !== userId) {
      return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
      }
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}
