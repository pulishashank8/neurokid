import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PostStatus, VoteType } from "@prisma/client";

interface BookmarkWithPost {
  post: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    voteScore: number;
    isAnonymous: boolean;
    isPinned: boolean;
    isLocked: boolean;
    status: PostStatus;
    images: string[];
    category: {
      id: string;
      name: string;
      slug: string;
    };
    tags: {
      id: string;
      name: string;
      slug: string;
    }[];
    author: {
      id: string;
      profile: {
        username: string;
        avatarUrl: string | null;
      } | null;
    } | null;
    _count: {
      comments: number;
    };
  };
}

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

    // Only the profile owner can see their saved posts (private, like Instagram)
    if (session.user.id !== user.id) {
      return NextResponse.json({ error: "Forbidden. You can only view your own saved posts." }, { status: 403 });
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

    const postIds = bookmarks.map((b) => b.post.id);
    const [likeCounts, dislikeCounts] =
      postIds.length > 0
        ? await Promise.all([
            prisma.vote.groupBy({
              by: ["targetId"],
              where: { targetType: VoteType.POST, targetId: { in: postIds }, value: 1 },
              _count: { id: true },
            }),
            prisma.vote.groupBy({
              by: ["targetId"],
              where: { targetType: VoteType.POST, targetId: { in: postIds }, value: -1 },
              _count: { id: true },
            }),
          ])
        : [[], []];
    const likeMap = new Map(likeCounts.map((r) => [r.targetId, r._count.id]));
    const dislikeMap = new Map(dislikeCounts.map((r) => [r.targetId, r._count.id]));

    // Format posts to match PostCard expectations (with like/dislike counts)
    const posts = bookmarks.map((b: BookmarkWithPost) => ({
      id: b.post.id,
      title: b.post.title,
      snippet: b.post.content.substring(0, 200) + (b.post.content.length > 200 ? "..." : ""),
      createdAt: b.post.createdAt,
      voteScore: b.post.voteScore,
      likeCount: likeMap.get(b.post.id) ?? 0,
      dislikeCount: dislikeMap.get(b.post.id) ?? 0,
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
