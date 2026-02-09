import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { IVoteService, VoteResult } from '@/domain/interfaces/services/IVoteService';
import { IVoteRepository } from '@/domain/interfaces/repositories/IVoteRepository';
import { IPostRepository } from '@/domain/interfaces/repositories/IPostRepository';
import { ICommentRepository } from '@/domain/interfaces/repositories/ICommentRepository';
import { NotFoundError, ValidationError } from '@/domain/errors';
import { invalidateCache } from '@/lib/redis';

@injectable()
export class VoteService implements IVoteService {
  constructor(
    @inject(TOKENS.VoteRepository) private voteRepository: IVoteRepository,
    @inject(TOKENS.PostRepository) private postRepository: IPostRepository,
    @inject(TOKENS.CommentRepository) private commentRepository: ICommentRepository
  ) {}

  async vote(
    userId: string,
    targetType: 'POST' | 'COMMENT',
    targetId: string,
    value: number
  ): Promise<VoteResult> {
    // Validate vote value
    if (![-1, 0, 1].includes(value)) {
      throw new ValidationError('Invalid vote value', {
        value: 'Must be -1, 0, or 1',
      });
    }

    // Handle vote removal (value = 0)
    if (value === 0) {
      return this.removeVote(userId, targetType, targetId);
    }

    // Verify target exists
    await this.verifyTargetExists(targetType, targetId);

    // Get existing vote to calculate score change
    const existingVote = await this.voteRepository.findByUserAndTarget(
      userId,
      targetType,
      targetId
    );

    const oldValue = existingVote?.value || 0;
    const scoreChange = value - oldValue;

    // Create or update vote
    await this.voteRepository.upsert({
      userId,
      targetType,
      targetId,
      value,
    });

    // Update target vote score
    const updatedVoteScore = await this.updateTargetVoteScore(
      targetType,
      targetId,
      scoreChange
    );

    // Invalidate caches for posts
    if (targetType === 'POST') {
      await invalidateCache('posts:*', { prefix: 'posts' });
    }

    return {
      voteScore: updatedVoteScore,
      userVote: value,
    };
  }

  async removeVote(
    userId: string,
    targetType: 'POST' | 'COMMENT',
    targetId: string
  ): Promise<VoteResult> {
    // Check if vote exists
    const existingVote = await this.voteRepository.findByUserAndTarget(
      userId,
      targetType,
      targetId
    );

    let updatedVoteScore = 0;

    if (existingVote) {
      // Delete the vote
      await this.voteRepository.delete(userId, targetType, targetId);

      // Calculate score change
      const scoreChange = -existingVote.value;

      // Update target vote score
      updatedVoteScore = await this.updateTargetVoteScore(
        targetType,
        targetId,
        scoreChange
      );
    } else {
      // If no existing vote, get current score
      updatedVoteScore = await this.getCurrentVoteScore(targetType, targetId);
    }

    // Invalidate caches for posts
    if (targetType === 'POST') {
      await invalidateCache('posts:*', { prefix: 'posts' });
    }

    return {
      voteScore: updatedVoteScore,
      userVote: 0,
    };
  }

  async getUserVote(
    userId: string,
    targetType: 'POST' | 'COMMENT',
    targetId: string
  ): Promise<number> {
    const vote = await this.voteRepository.findByUserAndTarget(
      userId,
      targetType,
      targetId
    );
    return vote?.value || 0;
  }

  private async verifyTargetExists(
    targetType: 'POST' | 'COMMENT',
    targetId: string
  ): Promise<void> {
    if (targetType === 'POST') {
      const post = await this.postRepository.findById(targetId);
      if (!post) {
        throw new NotFoundError('Post', targetId);
      }
    } else if (targetType === 'COMMENT') {
      const comment = await this.commentRepository.findById(targetId);
      if (!comment) {
        throw new NotFoundError('Comment', targetId);
      }
    }
  }

  private async updateTargetVoteScore(
    targetType: 'POST' | 'COMMENT',
    targetId: string,
    scoreChange: number
  ): Promise<number> {
    if (targetType === 'POST') {
      await this.postRepository.updateVoteScore(targetId, scoreChange);
      const post = await this.postRepository.findById(targetId);
      return post?.voteScore || 0;
    } else {
      await this.commentRepository.updateVoteScore(targetId, scoreChange);
      const comment = await this.commentRepository.findById(targetId);
      return comment?.voteScore || 0;
    }
  }

  private async getCurrentVoteScore(
    targetType: 'POST' | 'COMMENT',
    targetId: string
  ): Promise<number> {
    if (targetType === 'POST') {
      const post = await this.postRepository.findById(targetId);
      return post?.voteScore || 0;
    } else {
      const comment = await this.commentRepository.findById(targetId);
      return comment?.voteScore || 0;
    }
  }
}
