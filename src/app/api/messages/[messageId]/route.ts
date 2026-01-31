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

    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        deletedAt: true,
        conversation: {
          select: {
            userAId: true,
            userBId: true
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.conversation.userAId !== userId && message.conversation.userBId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (message.senderId !== userId) {
      return NextResponse.json({ error: "You can only delete your own messages" }, { status: 403 });
    }

    if (message.deletedAt) {
      return NextResponse.json({ error: "Message already deleted" }, { status: 400 });
    }

    await prisma.directMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() }
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
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        deletedAt: true,
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.senderId !== userId) {
      return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });
    }

    if (message.deletedAt) {
      return NextResponse.json({ error: "Cannot edit a deleted message" }, { status: 400 });
    }

    const updatedMessage = await prisma.directMessage.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        // We could add an 'editedAt' field if the schema supports it, but for now just updating content is fine.
        // If the schema has an 'isEdited' boolean, we can set that too.
      }
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}
