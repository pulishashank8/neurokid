import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    const session = await getServerSession(authOptions);

    const profile = await prisma.profile.findUnique({
      where: { username },
      select: {
        userId: true,
        username: true,
        displayName: true,
        user: {
          select: {
            id: true,
            createdAt: true,
          }
        }
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = {
      id: profile.user.id,
      username: profile.username,
      displayName: profile.displayName,
      createdAt: profile.user.createdAt,
    };

    let connectionStatus: { status: string; requestId?: string } = { status: "none" };

    if (session?.user?.id && session.user.id !== user.id) {
      const existingRequest = await prisma.connectionRequest.findFirst({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: user.id },
            { senderId: user.id, receiverId: session.user.id },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingRequest) {
        if (existingRequest.status === "ACCEPTED") {
          connectionStatus = { status: "connected", requestId: existingRequest.id };
        } else if (existingRequest.status === "PENDING") {
          if (existingRequest.senderId === session.user.id) {
            connectionStatus = { status: "pending_sent", requestId: existingRequest.id };
          } else {
            connectionStatus = { status: "pending_received", requestId: existingRequest.id };
          }
        }
      }
    }

    return NextResponse.json({ user, connectionStatus });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
