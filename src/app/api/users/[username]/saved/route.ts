import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: user.id,
        post: {
          status: "ACTIVE",
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        post: {
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
        },
      },
    });

    // Format posts to match PostCard expectations
    const posts = bookmarks.map((b: any) => ({
      id: b.post.id,
      title: b.post.title,
      snippet: b.post.content.substring(0, 200) + (b.post.content.length > 200 ? "..." : ""),
      createdAt: b.post.createdAt,
      voteScore: b.post.voteScore,
      likeCount: b.post.likeCount ?? 0,
      dislikeCount: b.post.dislikeCount ?? 0,
      userVote: 0,
      commentCount: b.post._count.comments,
      isAnonymous: b.post.isAnonymous,
      isPinned: b.post.isPinned,
      isLocked: b.post.isLocked,
      status: b.post.status,
      images: b.post.images || [],
      category: b.post.category,
      tags: b.post.tags || [],
      author: b.post.isAnonymous || !b.post.author
        ? { id: "anonymous", username: "Anonymous", avatarUrl: null }
        : {
            id: b.post.author.id,
            username: b.post.author.profile?.username || "Unknown",
            avatarUrl: b.post.author.profile?.avatarUrl || null,
          },
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching saved posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved posts" },
      { status: 500 }
    );
  }
}
