import { NextResponse } from 'next/server';
import { container, TOKENS } from '@/lib/container';
import {
  withApiHandler,
  parseBody,
  AuthenticatedRequest,
} from '@/lib/api';
import { BookmarkService } from '@/application/services/BookmarkService';
import { ValidationError } from '@/domain/errors';
import { registerDependencies } from '@/lib/container-registrations';
import { toggleBookmarkSchema } from '@/lib/validations/community';

// Ensure dependencies are registered
registerDependencies();

// GET /api/bookmarks - Get user's bookmarks
export const GET = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const bookmarkService = container.resolve<BookmarkService>(TOKENS.BookmarkService);

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);

    const result = await bookmarkService.getUserBookmarksWithPosts(
      request.session.user.id,
      page,
      limit
    );

    return NextResponse.json(result);
  },
  {
    method: 'GET',
    routeName: 'GET /api/bookmarks',
    requireAuth: true,
  }
);

// POST /api/bookmarks - Toggle bookmark
export const POST = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const bookmarkService = container.resolve<BookmarkService>(TOKENS.BookmarkService);

    const body = await parseBody<{ postId: string }>(request);

    // Validate input
    const validation = toggleBookmarkSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError('Invalid input', {
        postId: validation.error.errors.map(e => e.message).join(', '),
      });
    }

    const { postId } = validation.data;

    const result = await bookmarkService.toggleBookmark(
      request.session.user.id,
      postId
    );

    return NextResponse.json(result);
  },
  {
    method: 'POST',
    routeName: 'POST /api/bookmarks',
    requireAuth: true,
  }
);
