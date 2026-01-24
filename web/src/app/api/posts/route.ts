import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createPostSchema, getPostsSchema } from "@/lib/validations/community";
import sanitizeHtml from 'sanitize-html';
import { getCached, setCached, invalidateCache, CACHE_TTL, cacheKey } from "@/lib/redis";
import { rateLimitResponse, RATE_LIMITERS } from "@/lib/rateLimit";
import { withApiHandler, getRequestId } from "@/lib/apiHandler";
import { createLogger } from "@/lib/logger";
import { apiErrors } from "@/lib/apiError";

// Reddit-style Hot algorithm: time-decayed score based on votes
function calculateHotScore(voteScore: number, createdAt: Date): number {
  const sign = voteScore > 0 ? 1 : voteScore < 0 ? -1 : 0;
  const magnitude = Math.log10(Math.max(Math.abs(voteScore), 1) + 1);
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const decay = Math.pow(0.8, ageHours / 2); // 50% decay per 2 hours
  return sign * magnitude * decay;
}

function enforceSafeLinks(html: string): string {
  return html.replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
    const hasRel = /\brel\s*=/.test(attrs);
    const normalizedAttrs = hasRel ? attrs : `${attrs} rel="noopener noreferrer"`;
    return `<a ${normalizedAttrs}>`;
  });
}

// GET /api/posts - List posts with cursor pagination
export const GET = withApiHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId });

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const validation = getPostsSchema.safeParse(searchParams);

  if (!validation.success) {
    logger.warn({ validationErrors: validation.error.errors }, 'Invalid query parameters');
    return NextResponse.json(
      { error: "Invalid query parameters", details: validation.error.errors },
      { status: 400 }
    );
  }

  const { cursor, limit, sort, categoryId, tag, search, page } = validation.data;
  const useCursor = !!cursor;
  const take = limit + 1; // Fetch one extra to determine if there's a next page

  logger.debug({ cursor, limit, sort, categoryId, tag, search }, 'Fetching posts');

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
    logger.debug('Cache hit');
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
        hasMore,
      },
  };

  // Cache the response
  await setCached(cacheKeyStr, response, { prefix: "posts", ttl: CACHE_TTL.POSTS_FEED });

  logger.info({ postCount: formattedPosts.length, hasMore }, 'Posts fetched successfully');
  return NextResponse.json(response);
}, { method: 'GET', routeName: '/api/posts' });

// POST /api/posts - Create a new post
export const POST = withApiHandler(async (request: NextRequest) => {
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId });

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    logger.warn('Unauthorized post creation attempt');
    throw apiErrors.unauthorized();
  }

  // Rate limit: 5 posts per minute per user
  const canCreatePost = await RATE_LIMITERS.createPost.checkLimit(session.user.id);
  if (!canCreatePost) {
    const retryAfter = await RATE_LIMITERS.createPost.getRetryAfter(session.user.id);
    logger.warn({ userId: session.user.id }, 'Rate limit exceeded for post creation');
    return rateLimitResponse(retryAfter);
  }

  const body = await request.json();
  const validation = createPostSchema.safeParse(body);

  if (!validation.success) {
    logger.warn({ validationErrors: validation.error.errors }, 'Invalid post data');
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

  logger.debug({ userId: session.user.id, categoryId, isAnonymous }, 'Creating new post');

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
  // sanitize-html removes malicious scripts and handling safe links
  const dirty = enforceSafeLinks(content);
  const sanitizedContent = sanitizeHtml(dirty, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'a': ['href', 'name', 'target', 'rel']
    }
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
      logger.warn({ tagIds, foundCount: existingTags.length }, 'Invalid tags provided');
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

  // Format validation response to match GET response structure (hide author if anonymous)
  const safePost = {
    ...post,
    author: post.isAnonymous
      ? {
        id: "anonymous",
        username: "Anonymous",
        avatarUrl: null,
      }
      : {
        id: post.author?.id || session.user.id,
        username: post.author?.profile?.username || "Unknown",
        avatarUrl: post.author?.profile?.avatarUrl || null,
      }
  };

  logger.info({ postId: post.id, userId: session.user.id }, 'Post created successfully');
  return NextResponse.json(safePost, { status: 201 });
}, { method: 'POST', routeName: '/api/posts' });
