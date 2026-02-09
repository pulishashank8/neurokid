import { NextResponse } from 'next/server';
import { container, TOKENS } from '@/lib/container';
import {
  withApiHandler,
  parseBody,
  AuthenticatedRequest,
  RateLimits,
} from '@/lib/api';
import { ICommentService } from '@/domain/interfaces/services/ICommentService';
import { IPostService } from '@/domain/interfaces/services/IPostService';
import { ValidationError, NotFoundError } from '@/domain/errors';
import { registerDependencies } from '@/lib/container-registrations';

// Ensure dependencies are registered
registerDependencies();

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id]/comments - Get threaded comments
export const GET = withApiHandler<RouteContext>(
  async (request: AuthenticatedRequest, context) => {
    const commentService = container.resolve<ICommentService>(TOKENS.CommentService);
    const { id } = await context!.params;

    // Validate post exists
    const postService = container.resolve<IPostService>(TOKENS.PostService);
    const post = await postService.getPost(id);
    if (!post) {
      throw new NotFoundError('Post', id);
    }

    const currentUserId = request.session?.user?.id;

    // Get all comments for the post (flat structure, client can thread)
    const result = await commentService.listComments(
      id,
      null, // Get all root-level comments
      500, // Safety limit
      0,
      currentUserId
    );

    return NextResponse.json({ comments: result.data });
  },
  {
    method: 'GET',
    routeName: 'GET /api/posts/[id]/comments',
    requireAuth: false,
    rateLimit: 'readComments',
  }
);

// POST /api/posts/[id]/comments - Create a comment
export const POST = withApiHandler<RouteContext>(
  async (request: AuthenticatedRequest, context) => {
    const commentService = container.resolve<ICommentService>(TOKENS.CommentService);
    const postService = container.resolve<IPostService>(TOKENS.PostService);
    const { id } = await context!.params;

    // Verify post exists
    const post = await postService.getPost(id);
    if (!post) {
      throw new NotFoundError('Post', id);
    }

    const body = await parseBody<{
      content: string;
      parentCommentId?: string;
      isAnonymous?: boolean;
    }>(request);

    if (!body.content || body.content.trim().length === 0) {
      throw new ValidationError('Content is required', {
        content: 'Cannot be empty',
      });
    }

    const comment = await commentService.createComment(
      {
        content: body.content,
        postId: id,
        parentCommentId: body.parentCommentId,
        isAnonymous: body.isAnonymous,
      },
      request.session.user.id
    );

    return NextResponse.json(comment, { status: 201 });
  },
  {
    method: 'POST',
    routeName: 'POST /api/posts/[id]/comments',
    requireAuth: true,
    rateLimit: 'createComment',
  }
);
