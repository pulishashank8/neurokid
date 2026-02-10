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
    const { targetUserId } = body;

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetUserId
        }
      }
    });

    if (existingBlock) {
      return NextResponse.json({ error: "User already blocked" }, { status: 400 });
    }

    await prisma.blockedUser.create({
      data: {
        blockerId: userId,
        blockedId: targetUserId
      }
    });

    return NextResponse.json({ success: true, message: "User blocked successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error blocking user:", error);
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetUserId
        }
      }
    });

    if (!existingBlock) {
      return NextResponse.json({ error: "User is not blocked" }, { status: 400 });
    }

    await prisma.blockedUser.delete({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetUserId
        }
      }
    });

    return NextResponse.json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.error("Error unblocking user:", error);
    return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 });
  }
}
