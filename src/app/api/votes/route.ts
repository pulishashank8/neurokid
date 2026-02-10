import { NextResponse } from 'next/server';
import { container, TOKENS } from '@/lib/container';
import {
  withApiHandler,
  parseBody,
  AuthenticatedRequest,
} from '@/lib/api';
import { IVoteService } from '@/domain/interfaces/services/IVoteService';
import { ValidationError } from '@/domain/errors';
import { registerDependencies } from '@/lib/container-registrations';
import { createVoteSchema } from '@/lib/validations/community';

// Ensure dependencies are registered
registerDependencies();

// POST /api/votes - Create/update/remove vote
export const POST = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const voteService = container.resolve<IVoteService>(TOKENS.VoteService);

    const body = await parseBody<{
      targetType: 'POST' | 'COMMENT';
      targetId: string;
      value: number;
    }>(request);

    // Validate input using schema
    const validation = createVoteSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError('Invalid input', Object.fromEntries(
        validation.error.errors.map(e => [e.path.join('.'), e.message])
      ));
    }

    const { targetType, targetId, value } = validation.data;

    const result = await voteService.vote(
      request.session.user.id,
      targetType,
      targetId,
      value
    );

    return NextResponse.json({
      success: true,
      voteScore: result.voteScore,
      userVote: result.userVote,
      likeCount: result.likeCount,
      dislikeCount: result.dislikeCount,
    });
  },
  {
    method: 'POST',
    routeName: 'POST /api/votes',
    requireAuth: true,
    rateLimit: 'vote',
  }
);
