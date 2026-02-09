import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VoteType, PostStatus } from "@prisma/client";

// Type for Prisma query result
interface PostWithRelations {
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
}

interface FormattedPost {
  id: string;
  title: string;
  snippet: string;
  createdAt: Date;
  voteScore: number;
  commentCount: number;
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
    username: string;
    avatarUrl: string | null;
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

    // Format posts to match PostCard expectations
    const formattedPosts = posts.map((post: PostWithRelations): FormattedPost => ({
      id: post.id,
      title: post.title,
      snippet: post.content.substring(0, 200) + (post.content.length > 200 ? "..." : ""),
      createdAt: post.createdAt,
      voteScore: post.voteScore,
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

    // Order by vote time (most recent first)
    const orderedPosts = postIds
      .map((id) => formattedPosts.find((p) => p.id === id))
      .filter((p): p is FormattedPost => p !== undefined);

    return NextResponse.json({ posts: orderedPosts });
  } catch (error) {
    console.error("Error fetching upvoted posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch upvoted posts" },
      { status: 500 }
    );
  }
}
