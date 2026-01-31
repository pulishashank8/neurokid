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
          },
        });

        // Create persistent Connection record
        // Sort IDs to ensure uniqueness constraint works (user_a < user_b usually preferred but unique constraint handles both if ordered)
        // Our constraint is unique([userA, userB]). We should sort.
        const [userA, userB] = [connectionRequest.senderId, connectionRequest.receiverId].sort();

        // Idempotent creation of Connection
        const existingConnection = await tx.connection.findUnique({
          where: { userA_userB: { userA, userB } }
        });

        if (!existingConnection) {
          await tx.connection.create({
            data: { userA, userB }
          });
        }

        // Check for existing conversation via participants
        const existingConversation = await tx.conversation.findFirst({
          where: {
            AND: [
              { participants: { some: { userId: connectionRequest.senderId } } },
              { participants: { some: { userId: connectionRequest.receiverId } } }
            ]
          }
        });

        if (!existingConversation) {
          await tx.conversation.create({
            data: {
              participants: {
                create: [
                  { userId: connectionRequest.senderId },
                  { userId: connectionRequest.receiverId }
                ]
              }
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
