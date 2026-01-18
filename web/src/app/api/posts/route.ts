import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createPostSchema, getPostsSchema } from "@/lib/validations/community";
import DOMPurify from "isomorphic-dompurify";
import { getCached, setCached, invalidateCache, rateLimit, RATE_LIMITS, CACHE_TTL, cacheKey } from "@/lib/redis";
import {
  RATE_LIMITERS,
  rateLimitResponse,
} from "@/lib/rateLimit";

// Reddit-style Hot algorithm: time-decayed score based on votes
function calculateHotScore(voteScore: number, createdAt: Date): number {
  const sign = voteScore > 0 ? 1 : voteScore < 0 ? -1 : 0;
  const magnitude = Math.log10(Math.max(Math.abs(voteScore), 1) + 1);
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const decay = Math.pow(0.8, ageHours / 2); // 50% decay per 2 hours
  return sign * magnitude * decay;
}

// GET /api/posts - List posts with cursor pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validation = getPostsSchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { cursor, limit, sort, categoryId, tag, search, page } = validation.data;
    const useCursor = !!cursor;
    const take = limit + 1; // Fetch one extra to determine if there's a next page

    // Check cache
    const cacheKeyStr = cacheKey([
      "posts",
      useCursor ? `cursor:${cursor}` : `page:${page}`,
      String(limit),
      sort || "new",
      categoryId || "all",
      tag || "all",
      search || "all"
    ]);
    const cached = await getCached(cacheKeyStr, { prefix: "posts", ttl: CACHE_TTL.POSTS_FEED });
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build where clause
    const where: any = {
      status: "ACTIVE",
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tag) {
      where.tags = {
        some: {
          id: tag,
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    // Parse cursor for pagination
    const cursorObject = useCursor && cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString()) : null;

    // Build orderBy clause
    let orderBy: any = {};
    switch (sort) {
      case "new":
        orderBy = { createdAt: "desc" };
        break;
      case "top":
        orderBy = [{ voteScore: "desc" }, { createdAt: "desc" }];
        break;
      case "hot":
        // Hot sorting by creation time, then apply algorithm in JS
        orderBy = { createdAt: "desc" };
        break;
    }

    // Build query
    const query: any = {
      where,
      orderBy,
      take,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        isAnonymous: true,
        isPinned: true,
        isLocked: true,
        status: true,
        voteScore: true,
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
    };

    // Add cursor/pagination
    if (useCursor && cursorObject) {
      query.skip = 1; // Skip the cursor itself
      query.cursor = { id: cursorObject.id };
    } else if (!useCursor && page) {
      query.skip = (page - 1) * limit;
    }

    const posts = await prisma.post.findMany(query) as any[];

    // Apply hot algorithm if needed
    let sortedPosts = posts;
    if (sort === "hot") {
      sortedPosts = posts.sort((a, b) => {
        const scoreA = calculateHotScore(a.voteScore, a.createdAt);
        const scoreB = calculateHotScore(b.voteScore, b.createdAt);
        return scoreB - scoreA;
      });
    }

    // Determine if there are more results
    const hasMore = sortedPosts.length > limit;
    const displayPosts = sortedPosts.slice(0, limit);
    const nextCursor = hasMore && displayPosts.length > 0
      ? Buffer.from(JSON.stringify({ id: displayPosts[displayPosts.length - 1].id })).toString('base64')
      : null;

    // Format posts
    const formattedPosts = displayPosts.map((post) => {
      return {
        id: post.id,
        title: post.title,
        snippet: post.content.substring(0, 200) + (post.content.length > 200 ? "..." : ""),
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        category: post.category ? {
          id: post.category.id,
          name: post.category.name,
          slug: post.category.slug,
        } : null,
        tags: post.tags,
        author: post.isAnonymous || !post.author
          ? {
              id: "anonymous",
              username: "Anonymous",
              avatarUrl: null,
            }
          : {
              id: post.author.id,
              username: post.author.profile?.username || "Unknown",
              avatarUrl: post.author.profile?.avatarUrl || null,
            },
        voteScore: post.voteScore,
        commentCount: post._count.comments,
        isPinned: post.isPinned,
        isLocked: post.isLocked,
        status: post.status,
      };
    });

    const response = {
      posts: formattedPosts,
      pagination: useCursor
        ? {
            nextCursor,
            hasMore,
            limit,
          }
        : {
            page,
            limit,
          },
    };

    // Cache the response
    await setCached(cacheKeyStr, response, { prefix: "posts", ttl: CACHE_TTL.POSTS_FEED });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 5 posts per minute per user
    const canCreatePost = await RATE_LIMITERS.createPost.checkLimit(session.user.id);
    if (!canCreatePost) {
      const retryAfter = await RATE_LIMITERS.createPost.getRetryAfter(session.user.id);
      return rateLimitResponse(retryAfter);
    }

    const body = await request.json();
    const validation = createPostSchema.safeParse(body);

    if (!validation.success) {
      // Return field-level errors
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      return NextResponse.json(
        { 
          error: "Validation failed", 
          fieldErrors,
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { title, content, categoryId, tagIds, isAnonymous } = validation.data;

    // ===== ANTI-SPAM CHECKS =====
    
    // Check for excessive links (max 2 links per post)
    const linkRegex = /https?:\/\/[^\s]+/gi;
    const linkMatches = content.match(linkRegex) || [];
    if (linkMatches.length > 2) {
      return NextResponse.json(
        { error: "Too many links. Maximum 2 links per post allowed." },
        { status: 400 }
      );
    }
    
    // Check for duplicate posts from same author in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentPost = await prisma.post.findFirst({
      where: {
        authorId: session.user.id,
        title: title,
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
    });
    
    if (recentPost) {
      return NextResponse.json(
        { error: "Duplicate post detected. Please wait before posting similar content." },
        { status: 400 }
      );
    }

    // Sanitize content to prevent XSS
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li", "blockquote", "code", "pre"],
      ALLOWED_ATTR: ["href", "target", "rel"],
    });

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          fieldErrors: { categoryId: "Category not found" }
        }, 
        { status: 400 }
      );
    }

    // Verify tags exist if provided
    if (tagIds && tagIds.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: { id: { in: tagIds } },
        select: { id: true },
      });
      
      if (existingTags.length !== tagIds.length) {
        return NextResponse.json(
          { 
            error: "Validation failed",
            fieldErrors: { tagIds: "One or more tags not found" }
          }, 
          { status: 400 }
        );
      }
    }

    // Create post with tags
    const post = await prisma.post.create({
      data: {
        title,
        content: sanitizedContent,
        authorId: session.user.id,
        categoryId,
        isAnonymous,
        status: "ACTIVE",
        tags: tagIds && tagIds.length > 0 ? {
          connect: tagIds.map((tagId) => ({ id: tagId })),
        } : undefined,
      },
      include: {
        category: true,
        tags: true,
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
      },
    });

    // Invalidate feed cache
    await invalidateCache("posts:*", { prefix: "posts" });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
