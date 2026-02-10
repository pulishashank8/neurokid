import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { VoteType } from "@prisma/client";

const MAX_LIST = 30;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await context.params;
    const post = await prisma.post.findUnique({
      where: { id: postId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const [likes, dislikes, likeCount, dislikeCount] = await Promise.all([
      prisma.vote.findMany({
        where: { targetType: VoteType.POST, targetId: postId, value: 1 },
        orderBy: { createdAt: "desc" },
        take: MAX_LIST,
        select: {
          user: {
            select: {
              profile: {
                select: { username: true, displayName: true, avatarUrl: true },
              },
            },
          },
        },
      }),
      prisma.vote.findMany({
        where: { targetType: VoteType.POST, targetId: postId, value: -1 },
        orderBy: { createdAt: "desc" },
        take: MAX_LIST,
        select: {
          user: {
            select: {
              profile: {
                select: { username: true, displayName: true, avatarUrl: true },
              },
            },
          },
        },
      }),
      prisma.vote.count({
        where: { targetType: VoteType.POST, targetId: postId, value: 1 },
      }),
      prisma.vote.count({
        where: { targetType: VoteType.POST, targetId: postId, value: -1 },
      }),
    ]);

    const likers = likes.map((v) => ({
      username: v.user.profile?.username ?? "Unknown",
      displayName: v.user.profile?.displayName ?? null,
      avatarUrl: v.user.profile?.avatarUrl ?? null,
    }));
    const dislikers = dislikes.map((v) => ({
      username: v.user.profile?.username ?? "Unknown",
      displayName: v.user.profile?.displayName ?? null,
      avatarUrl: v.user.profile?.avatarUrl ?? null,
    }));

    return NextResponse.json({
      likeCount,
      dislikeCount,
      likers,
      dislikers,
    });
  } catch (error) {
    console.error("Error fetching vote details:", error);
    return NextResponse.json(
      { error: "Failed to fetch vote details" },
      { status: 500 }
    );
  }
}
