import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { checkProfileComplete } from "@/lib/auth-utils";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const isProfileComplete = await checkProfileComplete(userId);
    if (!isProfileComplete) {
      return NextResponse.json({ error: "Please complete your profile first" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username || username.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const searchTerm = username.toLowerCase().trim();

    const profiles = await prisma.profile.findMany({
      where: {
        username: {
          contains: searchTerm,
          mode: "insensitive",
        },
        userId: {
          not: userId,
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
      take: 10,
    });

    const users = profiles.map((profile) => {
      const allRequests = [
        ...profile.user.sentConnectionRequests,
        ...profile.user.receivedConnectionRequests,
      ];

      const relevantRequest = allRequests.find(
        (r) =>
          (r.senderId === userId && r.receiverId === profile.userId) ||
          (r.receiverId === userId && r.senderId === profile.userId)
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
        id: profile.userId,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        connectionStatus,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
