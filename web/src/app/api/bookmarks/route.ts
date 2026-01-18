import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { toggleBookmarkSchema } from "@/lib/validations/community";

// GET /api/bookmarks - Get user's bookmarks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          post: {
            include: {
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
                select: {
                  comments: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.bookmark.count({
        where: {
          userId: session.user.id,
        },
      }),
    ]);

    // Format bookmarks
    const formattedBookmarks = bookmarks.map((bookmark) => ({
      id: bookmark.id,
      createdAt: bookmark.createdAt,
      post: {
        id: bookmark.post.id,
        title: bookmark.post.title,
        snippet: bookmark.post.content.substring(0, 200) + (bookmark.post.content.length > 200 ? "..." : ""),
        createdAt: bookmark.post.createdAt,
        category: bookmark.post.category,
        tags: bookmark.post.tags,
        author: bookmark.post.isAnonymous || !bookmark.post.author
          ? {
              id: "anonymous",
              username: "Anonymous",
              avatarUrl: null,
            }
          : {
              id: bookmark.post.author.id,
              username: bookmark.post.author.profile?.username || "Unknown",
              avatarUrl: bookmark.post.author.profile?.avatarUrl || null,
            },
        commentCount: bookmark.post._count.comments,
      },
    }));

    return NextResponse.json({
      bookmarks: formattedBookmarks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

// POST /api/bookmarks - Toggle bookmark
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = toggleBookmarkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { postId } = validation.data;

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if bookmark exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId,
          },
        },
      });

      return NextResponse.json({
        bookmarked: false,
        message: "Bookmark removed",
      });
    } else {
      // Create bookmark
      await prisma.bookmark.create({
        data: {
          userId: session.user.id,
          postId,
        },
      });

      return NextResponse.json({
        bookmarked: true,
        message: "Post bookmarked",
      });
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 }
    );
  }
}
