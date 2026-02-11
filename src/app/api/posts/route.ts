import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createPostSchema, getPostsSchema } from "@/lib/validations/community";
import { getCached, setCached, invalidateCache, CACHE_TTL, cacheKey } from "@/lib/redis";
import { rateLimitResponse, RATE_LIMITERS } from "@/lib/rateLimit";
import { withApiHandler, getRequestId } from "@/lib/api/apiHandler";
import { createLogger } from "@/lib/logger";
import { apiErrors } from "@/lib/api/apiError";
import { sortByHot } from "@/services/rankingService";

// SUPER STABLE SANITIZER (No external dependencies)
function simpleSanitize(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:[^"']*/gi, "");
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

  const { cursor, limit, sort, categoryId: categoryIdParam, category: categoryName, tag, search, page, authorId } = validation.data;
  const useCursor = !!cursor;
  const take = limit + 1; // Fetch one extra to determine if there's a next page

  // Resolve category: use categoryId if provided, else look up by category name/slug
  let categoryId = categoryIdParam;
  if (!categoryId && categoryName && categoryName !== "All Categories") {
    const slug = categoryName.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and");
    const cat = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: categoryName, mode: "insensitive" } },
          { slug: { equals: slug, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (cat) categoryId = cat.id;
  }

  logger.debug({ cursor, limit, sort, categoryId, tag, search, authorId }, 'Fetching posts');

  // Check cache
  const cacheKeyStr = cacheKey([
    "posts",
    useCursor ? `cursor:${cursor}` : `page:${page}`,
    String(limit),
    sort || "new",
    categoryId || "all",
    tag || "all",
    search || "all",
    authorId || "all"
  ]);
  const cached = await getCached(cacheKeyStr, { prefix: "posts", ttl: CACHE_TTL.POSTS_FEED });
  if (cached) {
    logger.debug('Cache hit');
    const session = await getServerSession(authOptions);
    if (session?.user?.id && cached.posts?.length > 0) {
      const postIds = cached.posts.map((p: any) => p.id);
      const votes = await prisma.vote.findMany({
        where: {
          userId: session.user.id,
          targetType: "POST",
          targetId: { in: postIds },
        },
        select: { targetId: true, value: true },
      });
      const userVoteMap: Record<string, number> = {};
      votes.forEach((v: { targetId: string; value: number }) => {
        userVoteMap[v.targetId] = v.value;
      });
      cached.posts = cached.posts.map((p: any) => ({
        ...p,
        userVote: userVoteMap[p.id] ?? 0,
        likeCount: p.likeCount ?? 0,
        dislikeCount: p.dislikeCount ?? 0,
      }));
    }
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

  if (authorId) {
    where.authorId = authorId;
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
      likeCount: true,
      dislikeCount: true,
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

  // Apply hot algorithm if needed (using configurable ranking service)
  let sortedPosts = posts;
  if (sort === "hot") {
    sortedPosts = sortByHot(posts);
  }

  // Determine if there are more results
  const hasMore = sortedPosts.length > limit;
  const displayPosts = sortedPosts.slice(0, limit);
  const nextCursor = hasMore && displayPosts.length > 0
    ? Buffer.from(JSON.stringify({ id: displayPosts[displayPosts.length - 1].id })).toString('base64')
    : null;

  const postIds = displayPosts.map((p: any) => p.id);
  let userVoteMap: Record<string, number> = {};
  const session = await getServerSession(authOptions);
  if (session?.user?.id && postIds.length > 0) {
    const votes = await prisma.vote.findMany({
      where: {
        userId: session.user.id,
        targetType: "POST",
        targetId: { in: postIds },
      },
      select: { targetId: true, value: true },
    });
    votes.forEach((v) => {
      userVoteMap[v.targetId] = v.value;
    });
  }

  // Format posts
  const formattedPosts = displayPosts.map((post: any) => {
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
      likeCount: post.likeCount ?? 0,
      dislikeCount: post.dislikeCount ?? 0,
      userVote: userVoteMap[post.id] ?? 0,
      commentCount: post._count.comments,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      images: post.images || [],
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
  const sanitizedContent = simpleSanitize(content);

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
      images: validation.data.images || [],
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
