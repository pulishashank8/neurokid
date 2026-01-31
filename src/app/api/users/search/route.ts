import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { checkProfileComplete } from "@/lib/auth-utils";
import { RATE_LIMITERS, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const canSearch = await RATE_LIMITERS.userSearch.checkLimit(userId);
    if (!canSearch) {
      const retryAfter = await RATE_LIMITERS.userSearch.getRetryAfter(userId);
      return rateLimitResponse(retryAfter);
    }

    const isProfileComplete = await checkProfileComplete(userId);
    if (!isProfileComplete) {
      return NextResponse.json({ error: "Please complete your profile first" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || searchParams.get("username"))?.toLowerCase().trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search using UserFinder
    const results = await prisma.userFinder.findMany({
      where: {
        keywords: {
          contains: query,
        },
        user: {
          blockedUsers: {
            none: {
              blockedId: userId,
            },
          },
          blockedByUsers: {
            none: {
              blockerId: userId,
            },
          },
        },
      },
      include: {
        user: {
          include: {
            sentConnectionRequests: {
              where: {
                OR: [
                  { receiverId: userId },
                  { senderId: userId },
                ],
              },
            },
            receivedConnectionRequests: {
              where: {
                OR: [
                  { receiverId: userId },
                  { senderId: userId },
                ],
              },
            },
          },
        },
      },
      take: 20,
    });

    const users = results.map((finder) => {
      const allRequests = [
        ...finder.user.sentConnectionRequests,
        ...finder.user.receivedConnectionRequests,
      ];

      const relevantRequest = allRequests.find(
        (r) =>
          (r.senderId === userId && r.receiverId === finder.userId) ||
          (r.receiverId === userId && r.senderId === finder.userId)
      );

      let connectionStatus: "none" | "pending_sent" | "pending_received" | "connected" = "none";

      if (relevantRequest) {
        if (relevantRequest.status === "ACCEPTED") {
          connectionStatus = "connected";
        } else if (relevantRequest.status === "PENDING") {
          connectionStatus = relevantRequest.senderId === userId ? "pending_sent" : "pending_received";
        }
      }

      return {
        id: finder.userId,
        username: finder.username,
        displayName: finder.displayName,
        avatarUrl: finder.avatarUrl,
        connectionStatus,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
