import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { checkProfileComplete } from "@/lib/auth-utils";
import { RATE_LIMITERS, rateLimitResponse } from "@/lib/rateLimit";
import { z } from "zod";

const connectionRequestSchema = z.object({
  receiverId: z.string().min(1).optional(),
  receiverUsername: z.string().min(1).optional(),
  message: z.string().max(300, "Message too long").optional(),
}).refine(data => data.receiverId || data.receiverUsername, {
  message: "Either receiverId or receiverUsername is required"
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const canFetch = await RATE_LIMITERS.connectionRequest.checkLimit(userId);
    if (!canFetch) {
      const retryAfter = await RATE_LIMITERS.connectionRequest.getRetryAfter(userId);
      return rateLimitResponse(retryAfter);
    }

    const isProfileComplete = await checkProfileComplete(userId);
    if (!isProfileComplete) {
      return NextResponse.json({ error: "Please complete your profile first" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const LIMIT = 50; // Safety limit for connection lists

    if (type === "pending-received") {
      const requests = await prisma.connectionRequest.findMany({
        where: {
          receiverId: userId,
          status: "PENDING",
        },
        include: {
          sender: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
      });

      return NextResponse.json({
        requests: requests.map((r) => ({
          id: r.id,
          message: r.message,
          createdAt: r.createdAt,
          sender: {
            id: r.sender.id,
            username: r.sender.profile?.username,
            displayName: r.sender.profile?.displayName,
            avatarUrl: r.sender.profile?.avatarUrl,
          },
        })),
      });
    }

    if (type === "pending-sent") {
      const requests = await prisma.connectionRequest.findMany({
        where: {
          senderId: userId,
          status: "PENDING",
        },
        include: {
          receiver: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: LIMIT,
      });

      return NextResponse.json({
        requests: requests.map((r) => ({
          id: r.id,
          message: r.message,
          createdAt: r.createdAt,
          receiver: {
            id: r.receiver.id,
            username: r.receiver.profile?.username,
            displayName: r.receiver.profile?.displayName,
            avatarUrl: r.receiver.profile?.avatarUrl,
          },
        })),
      });
    }

    if (type === "accepted") {
      const acceptedRequests = await prisma.connectionRequest.findMany({
        where: {
          OR: [
            { senderId: userId, status: "ACCEPTED" },
            { receiverId: userId, status: "ACCEPTED" },
          ],
        },
        include: {
          sender: { include: { profile: true } },
          receiver: { include: { profile: true } },
        },
        orderBy: { createdAt: "desc" }, // responded_at replaced by createdAt of Connection? Or we rely on request createdAt/updatedAt
        take: LIMIT,
      });

      const connections = acceptedRequests.map((r) => {
        const otherUser = r.senderId === userId ? r.receiver : r.sender;
        return {
          id: r.id,
          // Use updated at if available or created at
          connectedAt: r.createdAt,
          user: {
            id: otherUser.id,
            username: otherUser.profile?.username,
            displayName: otherUser.profile?.displayName,
            avatarUrl: otherUser.profile?.avatarUrl,
          },
        };
      });

      return NextResponse.json({ connections });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const senderId = (session.user as { id: string }).id;

    const canRequest = await RATE_LIMITERS.connectionRequest.checkLimit(senderId);
    if (!canRequest) {
      const retryAfter = await RATE_LIMITERS.connectionRequest.getRetryAfter(senderId);
      return rateLimitResponse(retryAfter);
    }

    const isProfileComplete = await checkProfileComplete(senderId);
    if (!isProfileComplete) {
      return NextResponse.json({ error: "Please complete your profile first" }, { status: 403 });
    }

    const body = await request.json();
    const validation = connectionRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { receiverId, receiverUsername, message } = validation.data;

    let receiver;
    if (receiverId) {
      receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        include: { profile: true },
      });
    } else if (receiverUsername) {
      const profile = await prisma.profile.findUnique({
        where: { username: receiverUsername },
        include: { user: true },
      });
      receiver = profile?.user ? { ...profile.user, profile } : null;
    }

    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const actualReceiverId = receiver.id;

    if (senderId === actualReceiverId) {
      return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 });
    }

    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: actualReceiverId },
          { blockerId: actualReceiverId, blockedId: senderId },
        ],
      },
    });

    if (isBlocked) {
      return NextResponse.json({ error: "Cannot send connection request" }, { status: 403 });
    }

    const existingRequest = await prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId: actualReceiverId },
          { senderId: actualReceiverId, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return NextResponse.json(
          { error: "A connection request already exists" },
          { status: 409 }
        );
      }
      if (existingRequest.status === "ACCEPTED") {
        return NextResponse.json(
          { error: "You are already connected" },
          { status: 409 }
        );
      }
      if (existingRequest.status === "DECLINED") {
        await prisma.connectionRequest.update({
          where: { id: existingRequest.id },
          data: {
            senderId,
            receiverId: actualReceiverId,
            message: message?.trim() || null,
            status: "PENDING",
            // respondedAt removed, use standard updated/created
          },
        });

        return NextResponse.json({ success: true, message: "Connection request sent" });
      }
    }

    await prisma.connectionRequest.create({
      data: {
        senderId,
        receiverId: actualReceiverId,
        message: message?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, message: "Connection request sent" });
  } catch (error: any) {
    console.error("Error sending connection request:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A connection request already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
