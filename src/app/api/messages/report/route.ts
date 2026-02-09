import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { reportedUserId, conversationId, reason, description } = body;

    if (!reportedUserId || typeof reportedUserId !== "string") {
      return NextResponse.json({ error: "Reported user ID is required" }, { status: 400 });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    if (reason.length > 255) {
      return NextResponse.json({ error: "Reason is too long (max 255 characters)" }, { status: 400 });
    }

    if (reportedUserId === userId) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }

    const reportedUser = await prisma.user.findUnique({
      where: { id: reportedUserId },
      select: { id: true }
    });

    if (!reportedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: {
          participants: {
            select: { userId: true }
          }
        }
      });

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      const participantIds = conversation.participants.map(p => p.userId);

      if (!participantIds.includes(userId)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      if (!participantIds.includes(reportedUserId)) {
        return NextResponse.json({ error: "Reported user is not part of this conversation" }, { status: 400 });
      }
    }

    const existingReport = await prisma.messageReport.findFirst({
      where: {
        reporterId: userId,
        reportedUserId,
        status: "OPEN",
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existingReport) {
      return NextResponse.json({ error: "You have already reported this user recently" }, { status: 400 });
    }

    await prisma.messageReport.create({
      data: {
        reporterId: userId,
        reportedUserId,
        conversationId: conversationId || null,
        reason: reason.trim(),
        description: description?.trim() || null
      }
    });

    return NextResponse.json({ success: true, message: "Report submitted successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error reporting user:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
