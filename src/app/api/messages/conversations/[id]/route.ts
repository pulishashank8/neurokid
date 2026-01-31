import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

async function checkRateLimit(userId: string, actionType: string, maxCount: number, windowMinutes: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const count = await prisma.messageRateLimit.count({
    where: {
      userId,
      actionType,
      createdAt: { gte: windowStart }
    }
  });

  return count < maxCount;
}

async function logRateLimit(userId: string, actionType: string): Promise<void> {
  await prisma.messageRateLimit.create({
    data: { userId, actionType }
  });
}

async function verifyConversationAccess(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userAId: true, userBId: true }
  });

  if (!conversation) {
    return { authorized: false, error: "Conversation not found", status: 404 };
  }

  if (conversation.userAId !== userId && conversation.userBId !== userId) {
    return { authorized: false, error: "Access denied", status: 403 };
  }

  return { authorized: true, conversation };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: conversationId } = await params;

    const access = await verifyConversationAccess(conversationId, userId);
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        userA: {
          select: {
            id: true,
            lastActiveAt: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        userB: {
          select: {
            id: true,
            lastActiveAt: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    const otherUser = conversation!.userAId === userId ? conversation!.userB : conversation!.userA;

    // Mark messages as read
    await prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: otherUser.id,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    const messages = await prisma.directMessage.findMany({
      where: {
        conversationId,
        deletedAt: null,
        OR: [
          { senderId: userId, deletedBySender: false },
          { senderId: { not: userId }, deletedByReceiver: false }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: {
        id: true,
        content: true,
        senderId: true,
        createdAt: true,
        readAt: true,
        attachmentUrl: true,
        attachmentType: true
      }
    });

    const hasMore = messages.length > limit;
    const paginatedMessages = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? paginatedMessages[paginatedMessages.length - 1]?.id : null;

    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUser.id },
          { blockerId: otherUser.id, blockedId: userId }
        ]
      }
    });

    return NextResponse.json({
      conversation: {
        id: conversation!.id,
        otherUser: {
          id: otherUser.id,
          username: otherUser.profile?.username || "Unknown",
          displayName: otherUser.profile?.displayName || "Unknown User",
          avatarUrl: otherUser.profile?.avatarUrl,
          lastActiveAt: otherUser.lastActiveAt
        },
        isBlocked: !!isBlocked
      },
      messages: paginatedMessages.reverse().map(msg => ({
        id: msg.id,
        content: msg.content,
        isFromMe: msg.senderId === userId,
        createdAt: msg.createdAt,
        readAt: msg.readAt
      })),
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: conversationId } = await params;

    const access = await verifyConversationAccess(conversationId, userId);
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const conversation = access.conversation!;
    const otherUserId = conversation.userAId === userId ? conversation.userBId : conversation.userAId;

    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId }
        ]
      }
    });

    if (isBlocked) {
      return NextResponse.json({ error: "Cannot send messages in this conversation" }, { status: 403 });
    }

    const canSend = await checkRateLimit(userId, "message", 20, 1);
    if (!canSend) {
      return NextResponse.json({ error: "Too many messages. Please slow down." }, { status: 429 });
    }

    const body = await request.json();
    const { content, attachmentUrl, attachmentType } = body;

    // Content is required UNLESS there is an attachment
    if ((!content || typeof content !== "string" || content.trim().length === 0) && !attachmentUrl) {
      return NextResponse.json({ error: "Message content or attachment is required" }, { status: 400 });
    }

    if (content && content.length > 5000) {
      return NextResponse.json({ error: "Message is too long (max 5000 characters)" }, { status: 400 });
    }

    const message = await prisma.directMessage.create({
      data: {
        conversationId,
        senderId: userId,
        content: content ? content.trim() : null,
        attachmentUrl,
        attachmentType
      },
      select: {
        id: true,
        content: true,
        createdAt: true
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    await logRateLimit(userId, "message");

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        isFromMe: true,
        createdAt: message.createdAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
