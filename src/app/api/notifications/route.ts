import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [unreadConnectionRequests, unreadMessages, inAppNotifications] = await Promise.all([
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
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, type: true, payload: true, readAt: true, createdAt: true },
      }),
    ]);

    const inAppUnread = inAppNotifications.filter((n) => !n.readAt).length;

    const formatted = inAppNotifications.map((n) => {
      const payload = (n.payload || {}) as Record<string, unknown>;
      return {
        id: n.id,
        type: n.type,
        title: payload.title ?? "Notification",
        message: payload.message ?? "",
        link: payload.link ?? null,
        readAt: n.readAt,
        createdAt: n.createdAt,
      };
    });

    return NextResponse.json({
      unreadConnectionRequests,
      unreadMessages,
      inAppNotifications: formatted,
      inAppUnread,
      totalUnread: unreadConnectionRequests + unreadMessages,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
