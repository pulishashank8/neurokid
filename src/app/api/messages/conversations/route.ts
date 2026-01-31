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

    // Find conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      include: {
        participants: {
          include: {
            user: {
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
            }
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
            imageUrl: true
          }
        }
      },
      // Order by latest message? Or conversation created_at if no messages?
      // Since we don't have updatedAt on Conversation anymore, we might need manual sorting in JS
      // or join. For now, let's sort by ID or just use DB default.
      // Ideally, we start with most recent.
      orderBy: {
        createdAt: 'desc'
      }
    });

    const blockedUserIds = await prisma.blockedUser.findMany({
      where: { blockerId: userId },
      select: { blockedId: true }
    });
    const blockedSet = new Set(blockedUserIds.map(b => b.blockedId));

    const formattedConversations = conversations.map(conv => {
      // Find other participant
      const otherParticipant = conv.participants.find(p => p.userId !== userId);
      const otherUser = otherParticipant ? otherParticipant.user : {
        id: "unknown",
        profile: { username: "Unknown", displayName: "Unknown User", avatarUrl: null }
      };

      const lastMessage = conv.messages[0] || null;
      const isBlocked = blockedSet.has(otherUser.id);

      // Sort helpers
      const lastActivity = lastMessage ? lastMessage.createdAt : conv.createdAt;

      return {
        id: conv.id,
        otherUser: {
          id: otherUser.id,
          username: otherUser.profile?.username || "Unknown",
          displayName: otherUser.profile?.displayName || "Unknown User",
          avatarUrl: otherUser.profile?.avatarUrl
        },
        lastMessage: lastMessage ? {
          content: lastMessage.content ? lastMessage.content.substring(0, 100) : (lastMessage.imageUrl ? "Sent an image" : ""),
          createdAt: lastMessage.createdAt,
          isFromMe: lastMessage.senderId === userId
        } : null,
        updatedAt: lastActivity, // Use last message time as effective updated time
        isBlocked
      };
    });

    // Sort by most recent activity
    formattedConversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

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

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: "Cannot start conversation with yourself" }, { status: 400 });
    }

    // Check if connected (Using NEW Connections table)
    const isConnected = await prisma.connection.findFirst({
      where: {
        OR: [
          { userA: userId, userB: targetUserId },
          { userB: userId, userA: targetUserId }
        ]
      }
    });

    if (!isConnected) {
      // Fallback check for ConnectionRequest ACCEPTED if migration didn't backfill Connections
      // But assuming we are strict now.
      return NextResponse.json({
        error: "You must be connected with this user to send messages. Send a connection request first."
      }, { status: 403 });
    }

    // Check if conversation already exists
    // We need to find a conversation that has BOTH participants
    const existingConversations = await prisma.conversation.findMany({
      where: {
        AND: [
          { participants: { some: { userId: userId } } },
          { participants: { some: { userId: targetUserId } } }
        ]
      },
      take: 1
    });

    if (existingConversations.length > 0) {
      return NextResponse.json({ conversation: { id: existingConversations[0].id }, created: false });
    }

    const canCreate = await checkRateLimit(userId, "conversation", 5, 24 * 60);
    if (!canCreate) {
      return NextResponse.json({ error: "Too many conversations created. Please wait before starting new ones." }, { status: 429 });
    }

    // Create new conversation with participants
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: userId },
            { userId: targetUserId }
          ]
        }
      }
    });

    await logRateLimit(userId, "conversation");

    // We need to return structure expected by frontend (with otherUser)
    // Fetch newly created to get structure or mock it
    // Efficiently just return ID and let frontend fetch details or just minimal info
    // But Frontend expects 'otherUser' object in response to direct navigation?
    // Let's look at MessagesClient 'handleOpenChat': expects 'conversation.id' and 'conversation.otherUser'.

    const otherUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        profile: { select: { username: true, displayName: true, avatarUrl: true } }
      }
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser: {
          id: otherUser?.id || targetUserId,
          username: otherUser?.profile?.username || "Unknown",
          displayName: otherUser?.profile?.displayName || "Unknown",
          avatarUrl: otherUser?.profile?.avatarUrl
        }
      },
      created: true
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
