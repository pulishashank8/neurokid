import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VoteType } from "@prisma/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await context.params;

    const user = await prisma.user.findFirst({
      where: {
        profile: {
          username: { equals: username, mode: "insensitive" },
        }
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (session.user.id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const votes = await prisma.vote.findMany({
      where: {
        userId: user.id,
        targetType: VoteType.POST,
        value: 1,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { targetId: true },
    });

    const postIds = votes.map((v) => v.targetId);

    if (postIds.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    const posts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
        status: "ACTIVE",
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        voteScore: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    const orderedPosts = postIds
      .map((id) => posts.find((p) => p.id === id))
      .filter(Boolean);

    return NextResponse.json({ posts: orderedPosts });
  } catch (error) {
    console.error("Error fetching upvoted posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch upvoted posts" },
      { status: 500 }
    );
  }
}
