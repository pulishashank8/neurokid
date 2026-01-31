import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
  // Check if user is a participant
  const isParticipant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId }
  });

  if (!isParticipant) {
    return { authorized: false, error: "Access denied", status: 403 };
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
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
      }
    }
  });

  if (!conversation) {
    return { authorized: false, error: "Conversation not found", status: 404 };
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

    const conversation = access.conversation!;
    // Identify other user (assuming 1-on-1 for now, or just pick the first other one)
    const otherParticipant = conversation.participants.find(p => p.userId !== userId);
    const otherUser = otherParticipant ? otherParticipant.user : {
      id: "unknown",
      profile: { username: "Unknown", displayName: "Unknown User", avatarUrl: null },
      lastActiveAt: null
    };

    // Fetch messages using NEW schema
    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: {
        id: true,
        content: true,
        senderId: true,
        createdAt: true,
        imageUrl: true
      }
    });

    const hasMore = messages.length > limit;
    const paginatedMessages = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? paginatedMessages[paginatedMessages.length - 1]?.id : null;

    // Check block status
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
        id: conversation.id,
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
        attachmentUrl: msg.imageUrl,
        attachmentType: msg.imageUrl ? "image" : null
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
    const otherParticipant = conversation.participants.find(p => p.userId !== userId);
    const otherUserId = otherParticipant?.userId || "unknown";

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

    // Handle Multipart Form Data
    const formData = await request.formData();
    const content = formData.get("content")?.toString() || "";
    const file = formData.get("image") as File | null; // Frontend field name 'image'

    if (!content.trim() && !file) {
      return NextResponse.json({ error: "Message content or image is required" }, { status: 400 });
    }

    let imageUrl: string | null = null;

    if (file) {
      // Validate file
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, WEBP allowed." }, { status: 400 });
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
      }

      const fileBuffer = await file.arrayBuffer();
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const filePath = `messages/${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content.trim() || null,
        imageUrl: imageUrl
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        imageUrl: true
      }
    });

    // We don't need to manually update conversation updated_at because 
    // we can rely on message created_at sort order, but it's good practice for sorting conversations list.
    // However, the new schema does NOT have 'updatedAt' column on Conversation (only created_at).
    // So skipping that update.

    await logRateLimit(userId, "message");

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        isFromMe: true,
        createdAt: message.createdAt,
        attachmentUrl: message.imageUrl,
        attachmentType: message.imageUrl ? "image" : null
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
