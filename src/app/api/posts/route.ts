import { NextResponse } from 'next/server';
import { container, TOKENS } from '@/lib/container';
import {
  withApiHandler,
  parseBody,
  getPaginationParams,
  AuthenticatedRequest,
  RateLimits,
} from '@/lib/api';
import { IPostService } from '@/domain/interfaces/services/IPostService';
import { ValidationError } from '@/domain/errors';
import { registerDependencies } from '@/lib/container-registrations';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';

// Ensure dependencies are registered
registerDependencies();

// GET /api/posts - List posts with cursor pagination
export const GET = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const postService = container.resolve<IPostService>(TOKENS.PostService);

    const searchParams = request.nextUrl.searchParams;
    const { limit, cursor } = getPaginationParams(request);
    const sort = (searchParams.get('sort') || 'new') as 'new' | 'top' | 'hot';
    const categoryId = searchParams.get('categoryId') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;
    const authorId = searchParams.get('authorId') || undefined;

    // Validate sort parameter
    if (!['new', 'top', 'hot'].includes(sort)) {
      throw new ValidationError('Invalid sort parameter', {
        sort: 'Must be new, top, or hot',
      });
    }

    // Additional rate limiting for search queries (expensive operation)
    if (search) {
      const ip = getClientIp(request);
      const identifier = request.session?.user?.id || ip;
      const searchLimit = await enforceRateLimit(RateLimits.searchPosts, identifier);
      if (searchLimit) return searchLimit;
      
      const globalSearchLimit = await enforceRateLimit(RateLimits.searchPostsGlobal, 'global');
      if (globalSearchLimit) return globalSearchLimit;
    }

    const currentUserId = request.session?.user?.id;

    const result = await postService.listPosts(
      {
        cursor,
        limit,
        sort,
        categoryId,
        tag,
        search,
        authorId,
      },
      currentUserId
    );

    // Transform to legacy response format for backward compatibility
    return NextResponse.json({
      posts: result.data,
      pagination: result.pagination,
    });
  },
  {
    method: 'GET',
    routeName: 'GET /api/posts',
    requireAuth: false,
    rateLimit: 'readPost',
  }
);

// POST /api/posts - Create a new post
export const POST = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const postService = container.resolve<IPostService>(TOKENS.PostService);

    const body = await parseBody<{
      title: string;
      content: string;
      categoryId: string;
      tagIds?: string[];
      isAnonymous?: boolean;
      images?: string[];
    }>(request);

    const post = await postService.createPost(
      {
        title: body.title,
        content: body.content,
        categoryId: body.categoryId,
        tagIds: body.tagIds,
        isAnonymous: body.isAnonymous,
        images: body.images,
      },
      request.session.user.id
    );

    return NextResponse.json(post, { status: 201 });
  },
  {
    method: 'POST',
    routeName: 'POST /api/posts',
    requireAuth: true,
    rateLimit: 'createPost',
  }
);
