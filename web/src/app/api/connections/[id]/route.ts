import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;
    const { action } = await request.json();

    if (!["accept", "decline", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const connectionRequest = await prisma.connectionRequest.findUnique({
      where: { id },
    });

    if (!connectionRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "cancel") {
      if (connectionRequest.senderId !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      await prisma.connectionRequest.delete({
        where: { id },
      });

      return NextResponse.json({ success: true, message: "Request cancelled" });
    }

    if (connectionRequest.receiverId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (connectionRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been responded to" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      await prisma.$transaction(async (tx) => {
        await tx.connectionRequest.update({
          where: { id },
          data: {
            status: "ACCEPTED",
            respondedAt: new Date(),
          },
        });

        const [userAId, userBId] = [connectionRequest.senderId, connectionRequest.receiverId].sort();
        
        const existingConversation = await tx.conversation.findFirst({
          where: {
            OR: [
              { userAId: connectionRequest.senderId, userBId: connectionRequest.receiverId },
              { userAId: connectionRequest.receiverId, userBId: connectionRequest.senderId },
            ],
          },
        });

        if (!existingConversation) {
          await tx.conversation.create({
            data: {
              userAId,
              userBId,
            },
          });
        }
      });

      return NextResponse.json({ success: true, message: "Connection accepted" });
    }

    if (action === "decline") {
      await prisma.connectionRequest.update({
        where: { id },
        data: {
          status: "DECLINED",
          respondedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: "Connection declined" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating connection request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
