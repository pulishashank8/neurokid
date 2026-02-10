import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

const NOTIFICATIONS_LIST_LIMIT = 20;

function safeNotificationsResponse(userId: string, unreadConnectionRequests: number, unreadMessages: number) {
  return NextResponse.json({
    unreadConnectionRequests,
    unreadMessages,
    notificationUnreadCount: 0,
    totalUnread: unreadConnectionRequests + unreadMessages,
    notifications: [],
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const includeList = searchParams.get("list") !== "false";

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
              some: { userId },
            },
          },
          senderId: { not: userId },
        },
      }),
    ]);

    let notificationUnreadCount = 0;
    let notificationsList: Array<{ id: string; type: string; payload: unknown; readAt: Date | null; createdAt: Date }> = [];

    try {
      [notificationUnreadCount, notificationsList] = await Promise.all([
        prisma.notification.count({
          where: { userId, readAt: null },
        }),
        includeList
          ? prisma.notification.findMany({
              where: { userId },
              orderBy: { createdAt: "desc" },
              take: NOTIFICATIONS_LIST_LIMIT,
              select: {
                id: true,
                type: true,
                payload: true,
                readAt: true,
                createdAt: true,
              },
            })
          : Promise.resolve([]),
      ]);
    } catch (error_) {
      console.error("Error fetching notification list (fallback to counts only):", error_);
      return safeNotificationsResponse(userId, unreadConnectionRequests, unreadMessages);
    }

    const totalUnread = notificationUnreadCount > 0
      ? notificationUnreadCount
      : unreadConnectionRequests + unreadMessages;

    return NextResponse.json({
      unreadConnectionRequests,
      unreadMessages,
      notificationUnreadCount,
      totalUnread,
      notifications: notificationsList.map((n) => ({
        id: n.id,
        type: n.type,
        payload: (n.payload ?? {}) as Record<string, unknown>,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
