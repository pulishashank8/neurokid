import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [unreadConnectionRequests, unreadMessages] = await Promise.all([
      prisma.connectionRequest.count({
        where: {
          receiverId: userId,
          status: "PENDING",
        },
      }),
      prisma.message.count({
        where: {
          conversation: {
            participants: {
              some: { userId }
            }
          },
          senderId: { not: userId },
        },
      }),
    ]);

    return NextResponse.json({
      unreadConnectionRequests,
      unreadMessages,
      totalUnread: unreadConnectionRequests + unreadMessages,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
