import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { checkProfileComplete } from "@/lib/auth-utils";

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const isProfileComplete = await checkProfileComplete(userId);
    if (!isProfileComplete) {
      return NextResponse.json({ error: "Please complete your profile first" }, { status: 403 });
    }

    const acceptedConnections = await prisma.connectionRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" }
        ]
      },
      select: {
        senderId: true,
        receiverId: true,
      }
    });

    const connectedUserIds = acceptedConnections.map(c => 
      c.senderId === userId ? c.receiverId : c.senderId
    );

    if (connectedUserIds.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userAId: userId, userBId: { in: connectedUserIds } },
          { userBId: userId, userAId: { in: connectedUserIds } }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
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
            profile: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const blockedUserIds = await prisma.blockedUser.findMany({
      where: { blockerId: userId },
      select: { blockedId: true }
    });
    const blockedSet = new Set(blockedUserIds.map(b => b.blockedId));

    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.userAId === userId ? conv.userB : conv.userA;
      const lastMessage = conv.messages[0] || null;
      const isBlocked = blockedSet.has(otherUser.id);

      return {
        id: conv.id,
        otherUser: {
          id: otherUser.id,
          username: otherUser.profile?.username || "Unknown",
          displayName: otherUser.profile?.displayName || "Unknown User",
          avatarUrl: otherUser.profile?.avatarUrl
        },
        lastMessage: lastMessage ? {
          content: lastMessage.content.substring(0, 100),
          createdAt: lastMessage.createdAt,
          isFromMe: lastMessage.senderId === userId
        } : null,
        updatedAt: conv.updatedAt,
        isBlocked
      };
    });

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const isProfileComplete = await checkProfileComplete(userId);
    if (!isProfileComplete) {
      return NextResponse.json({ error: "Please complete your profile first" }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: "Cannot start conversation with yourself" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: userId }
        ]
      }
    });

    if (isBlocked) {
      return NextResponse.json({ error: "Cannot message this user" }, { status: 403 });
    }

    const hasAcceptedConnection = await prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUserId, status: "ACCEPTED" },
          { senderId: targetUserId, receiverId: userId, status: "ACCEPTED" }
        ]
      }
    });

    if (!hasAcceptedConnection) {
      return NextResponse.json({ 
        error: "You must be connected with this user to send messages. Send a connection request first." 
      }, { status: 403 });
    }

    const [userAId, userBId] = [userId, targetUserId].sort();

    let conversation = await prisma.conversation.findUnique({
      where: {
        userAId_userBId: { userAId, userBId }
      }
    });

    if (conversation) {
      return NextResponse.json({ conversation: { id: conversation.id }, created: false });
    }

    const canCreate = await checkRateLimit(userId, "conversation", 5, 24 * 60);
    if (!canCreate) {
      return NextResponse.json({ error: "Too many conversations created. Please wait before starting new ones." }, { status: 429 });
    }

    conversation = await prisma.conversation.create({
      data: { userAId, userBId }
    });

    await logRateLimit(userId, "conversation");

    return NextResponse.json({ conversation: { id: conversation.id }, created: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
