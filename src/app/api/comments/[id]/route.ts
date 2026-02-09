import { NextResponse } from 'next/server';
import { container, TOKENS } from '@/lib/container';
import {
  withApiHandler,
  parseBody,
  AuthenticatedRequest,
  RateLimits,
} from '@/lib/api';
import { ICommentService } from '@/domain/interfaces/services/ICommentService';
import { ValidationError } from '@/domain/errors';
import { registerDependencies } from '@/lib/container-registrations';

// Ensure dependencies are registered
registerDependencies();

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PUT /api/comments/[id] - Update comment
export const PUT = withApiHandler<RouteContext>(
  async (request: AuthenticatedRequest, context) => {
    const commentService = container.resolve<ICommentService>(TOKENS.CommentService);
    const { id } = await context!.params;

    const body = await parseBody<{ content: string }>(request);

    if (!body.content || body.content.trim().length === 0) {
      throw new ValidationError('Content is required', {
        content: 'Cannot be empty',
      });
    }

    const comment = await commentService.updateComment(
      id,
      { content: body.content },
      request.session.user.id
    );

    return NextResponse.json(comment);
  },
  {
    method: 'PUT',
    routeName: 'PUT /api/comments/[id]',
    requireAuth: true,
    rateLimit: 'createComment',
  }
);

// DELETE /api/comments/[id] - Delete comment
export const DELETE = withApiHandler<RouteContext>(
  async (request: AuthenticatedRequest, context) => {
    const commentService = container.resolve<ICommentService>(TOKENS.CommentService);
    const { id } = await context!.params;

    await commentService.deleteComment(id, request.session.user.id);

    return NextResponse.json({ message: 'Comment deleted successfully' });
  },
  {
    method: 'DELETE',
    routeName: 'DELETE /api/comments/[id]',
    requireAuth: true,
  }
);
