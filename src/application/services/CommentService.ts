import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { ICommentService, CreateCommentInput, UpdateCommentInput, FormattedComment } from '@/domain/interfaces/services/ICommentService';
import { ICommentRepository } from '@/domain/interfaces/repositories/ICommentRepository';
import { IPostRepository } from '@/domain/interfaces/repositories/IPostRepository';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { IVoteRepository } from '@/domain/interfaces/repositories/IVoteRepository';
import { INotificationRepository } from '@/domain/interfaces/repositories/INotificationRepository';
import { ValidationError, NotFoundError, ForbiddenError, BusinessRuleError } from '@/domain/errors';
import { PaginatedResult } from '@/domain/types';

@injectable()
export class CommentService implements ICommentService {
  constructor(
    @inject(TOKENS.CommentRepository) private commentRepo: ICommentRepository,
    @inject(TOKENS.PostRepository) private postRepo: IPostRepository,
    @inject(TOKENS.UserRepository) private userRepo: IUserRepository,
    @inject(TOKENS.VoteRepository) private voteRepo: IVoteRepository,
    @inject(TOKENS.NotificationRepository) private notificationRepo: INotificationRepository
  ) {}

  async createComment(input: CreateCommentInput, authorId: string): Promise<FormattedComment> {
    // Validate content
    if (!input.content || input.content.trim().length < 1) {
      throw new ValidationError('Comment cannot be empty', { content: 'Required' });
    }
    if (input.content.length > 10000) {
      throw new ValidationError('Comment is too long', { content: 'Maximum 10000 characters' });
    }

    // Verify post exists and is not locked
    const post = await this.postRepo.findById(input.postId);
    if (!post) {
      throw new NotFoundError('Post', input.postId);
    }
    if (post.isLocked) {
      throw new BusinessRuleError('Cannot comment on a locked post', 'POST_LOCKED');
    }

    // Verify parent comment exists if replying
    let parentAuthorId: string | null = null;
    if (input.parentCommentId) {
      const parentComment = await this.commentRepo.findById(input.parentCommentId);
      if (!parentComment) {
        throw new NotFoundError('Parent comment', input.parentCommentId);
      }
      if (parentComment.postId !== input.postId) {
        throw new ValidationError('Parent comment belongs to a different post');
      }
      parentAuthorId = parentComment.authorId;
    }

    // Sanitize content
    const sanitizedContent = this.sanitizeHtml(input.content);

    // Create comment
    const comment = await this.commentRepo.create({
      content: sanitizedContent,
      authorId,
      postId: input.postId,
      parentCommentId: input.parentCommentId,
      isAnonymous: input.isAnonymous,
    });

    // Update post comment count
    await this.postRepo.updateCommentCount(input.postId, 1);

    // Send notifications
    if (!input.isAnonymous) {
      // Notify post author (if not self)
      if (post.authorId && post.authorId !== authorId && !input.parentCommentId) {
        await this.notificationRepo.create({
          userId: post.authorId,
          type: 'POST_COMMENT',
          payload: {
            postId: post.id,
            postTitle: post.title,
            commentId: comment.id,
            commenterId: authorId,
          },
        });
      }

      // Notify parent comment author (if replying and not self)
      if (parentAuthorId && parentAuthorId !== authorId) {
        await this.notificationRepo.create({
          userId: parentAuthorId,
          type: 'COMMENT_REPLY',
          payload: {
            postId: post.id,
            postTitle: post.title,
            commentId: comment.id,
            parentCommentId: input.parentCommentId,
            replierId: authorId,
          },
        });
      }
    }

    return this.formatComment(comment.id, authorId);
  }

  async updateComment(id: string, input: UpdateCommentInput, userId: string): Promise<FormattedComment> {
    const comment = await this.commentRepo.findById(id);
    if (!comment) {
      throw new NotFoundError('Comment', id);
    }

    // Check ownership
    if (comment.authorId !== userId) {
      throw new ForbiddenError('Not authorized to edit this comment');
    }

    // Validate content
    if (!input.content || input.content.trim().length < 1) {
      throw new ValidationError('Comment cannot be empty', { content: 'Required' });
    }
    if (input.content.length > 10000) {
      throw new ValidationError('Comment is too long', { content: 'Maximum 10000 characters' });
    }

    const sanitizedContent = this.sanitizeHtml(input.content);

    await this.commentRepo.update(id, { content: sanitizedContent });

    return this.formatComment(id, userId);
  }

  async listComments(
    postId: string,
    parentCommentId: string | null,
    limit: number,
    offset: number,
    currentUserId?: string
  ): Promise<PaginatedResult<FormattedComment>> {
    const result = await this.commentRepo.list({
      postId,
      parentCommentId,
      limit: Math.min(Math.max(limit, 1), 100),
      offset: Math.max(offset, 0),
    });

    // Get user votes if logged in
    let userVotes = new Map<string, number>();
    if (currentUserId && result.data.length > 0) {
      const commentIds = result.data.map(c => c.comment.id);
      userVotes = await this.voteRepo.getUserVotesForTargets(currentUserId, 'COMMENT', commentIds);
    }

    const formattedComments: FormattedComment[] = result.data.map(({ comment, author, replyCount }) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.isAnonymous || !author
        ? null
        : {
            id: author.id,
            username: author.username,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
            verifiedTherapist: author.verifiedTherapist,
          },
      voteScore: comment.voteScore,
      replyCount,
      isAnonymous: comment.isAnonymous,
      userVote: userVotes.get(comment.id),
    }));

    return {
      data: formattedComments,
      pagination: result.pagination,
    };
  }

  async getComment(id: string, currentUserId?: string): Promise<FormattedComment | null> {
    const result = await this.commentRepo.findByIdWithAuthor(id);
    if (!result) return null;

    let userVote: number | undefined;
    if (currentUserId) {
      const vote = await this.voteRepo.findByUserAndTarget(currentUserId, 'COMMENT', id);
      userVote = vote?.value;
    }

    return {
      id: result.comment.id,
      content: result.comment.content,
      createdAt: result.comment.createdAt,
      updatedAt: result.comment.updatedAt,
      author: result.comment.isAnonymous || !result.author
        ? null
        : {
            id: result.author.id,
            username: result.author.username,
            displayName: result.author.displayName,
            avatarUrl: result.author.avatarUrl,
            verifiedTherapist: result.author.verifiedTherapist,
          },
      voteScore: result.comment.voteScore,
      replyCount: result.replyCount,
      isAnonymous: result.comment.isAnonymous,
      userVote,
    };
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findById(id);
    if (!comment) {
      throw new NotFoundError('Comment', id);
    }

    // Check ownership or moderator
    if (comment.authorId !== userId) {
      const user = await this.userRepo.findByIdWithProfile(userId);
      const isModeratorOrAdmin = user?.user.roles.some(r => r === 'MODERATOR' || r === 'ADMIN');
      if (!isModeratorOrAdmin) {
        throw new ForbiddenError('Not authorized to delete this comment');
      }
    }

    await this.commentRepo.delete(id);

    // Update post comment count
    await this.postRepo.updateCommentCount(comment.postId, -1);
  }

  async vote(commentId: string, userId: string, value: number): Promise<{ voteScore: number; userVote: number }> {
    const comment = await this.commentRepo.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment', commentId);
    }

    const normalizedValue = value > 0 ? 1 : value < 0 ? -1 : 0;

    const existingVote = await this.voteRepo.findByUserAndTarget(userId, 'COMMENT', commentId);
    const previousValue = existingVote?.value ?? 0;

    if (normalizedValue === 0) {
      if (existingVote) {
        await this.voteRepo.delete(userId, 'COMMENT', commentId);
        await this.commentRepo.updateVoteScore(commentId, -previousValue);
      }
    } else {
      await this.voteRepo.upsert({
        userId,
        targetType: 'COMMENT',
        targetId: commentId,
        value: normalizedValue,
      });

      const delta = normalizedValue - previousValue;
      if (delta !== 0) {
        await this.commentRepo.updateVoteScore(commentId, delta);
      }
    }

    const updatedComment = await this.commentRepo.findById(commentId);
    return {
      voteScore: updatedComment?.voteScore ?? 0,
      userVote: normalizedValue,
    };
  }

  async removeVote(commentId: string, userId: string): Promise<{ voteScore: number }> {
    const result = await this.vote(commentId, userId, 0);
    return { voteScore: result.voteScore };
  }

  private async formatComment(commentId: string, currentUserId?: string): Promise<FormattedComment> {
    const result = await this.commentRepo.findByIdWithAuthor(commentId);
    if (!result) {
      throw new NotFoundError('Comment', commentId);
    }

    let userVote: number | undefined;
    if (currentUserId) {
      const vote = await this.voteRepo.findByUserAndTarget(currentUserId, 'COMMENT', commentId);
      userVote = vote?.value;
    }

    return {
      id: result.comment.id,
      content: result.comment.content,
      createdAt: result.comment.createdAt,
      updatedAt: result.comment.updatedAt,
      author: result.comment.isAnonymous || !result.author
        ? null
        : {
            id: result.author.id,
            username: result.author.username,
            displayName: result.author.displayName,
            avatarUrl: result.author.avatarUrl,
            verifiedTherapist: result.author.verifiedTherapist,
          },
      voteScore: result.comment.voteScore,
      replyCount: result.replyCount,
      isAnonymous: result.comment.isAnonymous,
      userVote,
    };
  }

  private sanitizeHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
      .replace(/javascript:[^"']*/gi, '')
      .replace(/data:text\/html[^"']*/gi, '');
  }
}
