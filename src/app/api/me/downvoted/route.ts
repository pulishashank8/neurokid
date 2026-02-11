import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VoteType } from "@prisma/client";

/** GET /api/me/downvoted - Posts the current user has disliked (uses session, no username needed) */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const votes = await prisma.vote.findMany({
      where: {
        userId: session.user.id,
        targetType: VoteType.POST,
        value: -1,
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
        likeCount: true,
        dislikeCount: true,
        isAnonymous: true,
        isPinned: true,
        isLocked: true,
        status: true,
        images: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        author: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    const formattedPosts = posts.map((post: any) => ({
      id: post.id,
      title: post.title,
      snippet: post.content.substring(0, 200) + (post.content.length > 200 ? "..." : ""),
      createdAt: post.createdAt,
      voteScore: post.voteScore,
      likeCount: post.likeCount ?? 0,
      dislikeCount: post.dislikeCount ?? 0,
      userVote: -1,
      commentCount: post._count.comments,
      isAnonymous: post.isAnonymous,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      status: post.status,
      images: post.images || [],
      category: post.category,
      tags: post.tags || [],
      author: post.isAnonymous || !post.author
        ? { id: "anonymous", username: "Anonymous", avatarUrl: null }
        : {
            id: post.author.id,
            username: post.author.profile?.username || "Unknown",
            avatarUrl: post.author.profile?.avatarUrl || null,
          },
    }));

    const orderedPosts = postIds
      .map((id) => formattedPosts.find((p: any) => p.id === id))
      .filter(Boolean);

    return NextResponse.json({ posts: orderedPosts });
  } catch (error) {
    console.error("Error fetching downvoted posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch downvoted posts" },
      { status: 500 }
    );
  }
}
