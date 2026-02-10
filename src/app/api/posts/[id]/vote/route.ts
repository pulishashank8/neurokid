import { NextResponse } from 'next/server';
import { container, TOKENS } from '@/lib/container';
import {
  withApiHandler,
  parseBody,
  AuthenticatedRequest,
  RateLimits,
} from '@/lib/api';
import { IPostService } from '@/domain/interfaces/services/IPostService';
import { ValidationError } from '@/domain/errors';
import { registerDependencies } from '@/lib/container-registrations';

registerDependencies();

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/posts/[id]/vote
export const POST = withApiHandler<RouteContext>(
  async (request: AuthenticatedRequest, context) => {
    const postService = container.resolve<IPostService>(TOKENS.PostService);
    const { id } = await context!.params;

    const body = await parseBody<{ value: number }>(request);

    if (typeof body.value !== 'number' || ![-1, 0, 1].includes(body.value)) {
      throw new ValidationError('Invalid vote value', {
        value: 'Must be -1, 0, or 1',
      });
    }

    const result = await postService.vote(
      id,
      request.session.user.id,
      body.value
    );

    return NextResponse.json(result);
  },
  {
    method: 'POST',
    routeName: 'POST /api/posts/[id]/vote',
    requireAuth: true,
    rateLimit: 'vote',
  }
);

// DELETE /api/posts/[id]/vote
export const DELETE = withApiHandler<RouteContext>(
  async (request: AuthenticatedRequest, context) => {
    const postService = container.resolve<IPostService>(TOKENS.PostService);
    const { id } = await context!.params;

    const result = await postService.removeVote(id, request.session.user.id);

    return NextResponse.json(result);
  },
  {
    method: 'DELETE',
    routeName: 'DELETE /api/posts/[id]/vote',
    requireAuth: true,
    rateLimit: 'vote',
  }
);
