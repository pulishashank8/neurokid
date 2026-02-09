import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { IPostService, CreatePostInput, UpdatePostInput, ListPostsInput, FormattedPost } from '@/domain/interfaces/services/IPostService';
import { IPostRepository } from '@/domain/interfaces/repositories/IPostRepository';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { ICategoryRepository } from '@/domain/interfaces/repositories/ICategoryRepository';
import { ITagRepository } from '@/domain/interfaces/repositories/ITagRepository';
import { IVoteRepository } from '@/domain/interfaces/repositories/IVoteRepository';
import { IAuditLogRepository } from '@/domain/interfaces/repositories/IAuditLogRepository';
import { IAuthorizationService } from '@/domain/interfaces/services/IAuthorizationService';
import { ViewCountService } from './ViewCountService';
import { ValidationError, NotFoundError, ForbiddenError } from '@/domain/errors';
import { CursorPaginatedResult } from '@/domain/types';
import { sanitizationService } from '@/lib/sanitization';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'PostService' });

@injectable()
export class PostService implements IPostService {
  constructor(
    @inject(TOKENS.PostRepository) private postRepo: IPostRepository,
    @inject(TOKENS.UserRepository) private userRepo: IUserRepository,
    @inject(TOKENS.CategoryRepository) private categoryRepo: ICategoryRepository,
    @inject(TOKENS.TagRepository) private tagRepo: ITagRepository,
    @inject(TOKENS.VoteRepository) private voteRepo: IVoteRepository,
    @inject(TOKENS.AuditLogRepository) private auditRepo: IAuditLogRepository,
    @inject(TOKENS.AuthorizationService) private authService: IAuthorizationService,
    @inject(TOKENS.ViewCountService) private viewCountService: ViewCountService
  ) {}

  async createPost(input: CreatePostInput, authorId: string): Promise<FormattedPost> {
    // Validate title
    if (!input.title || input.title.trim().length < 5) {
      throw new ValidationError('Title must be at least 5 characters', { title: 'Too short' });
    }
    if (input.title.length > 255) {
      throw new ValidationError('Title must be less than 255 characters', { title: 'Too long' });
    }

    // Validate content
    if (!input.content || input.content.trim().length < 10) {
      throw new ValidationError('Content must be at least 10 characters', { content: 'Too short' });
    }

    // Validate category exists
    const category = await this.categoryRepo.findById(input.categoryId);
    if (!category) {
      throw new ValidationError('Invalid category', { categoryId: 'Category not found' });
    }

    // Check for duplicate posts (spam prevention)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isDuplicate = await this.postRepo.existsDuplicate(authorId, input.title.trim(), fiveMinutesAgo);
    if (isDuplicate) {
      throw new ValidationError('Duplicate post detected. Please wait before posting similar content.');
    }

    // Check for excessive links (spam prevention)
    const linkRegex = /https?:\/\/[^\s]+/gi;
    const linkMatches = input.content.match(linkRegex) || [];
    if (linkMatches.length > 3) {
      throw new ValidationError('Too many links. Maximum 3 links per post allowed.', { content: 'Too many links' });
    }

    // Sanitize content
    const sanitizedTitle = sanitizationService.sanitizeTitle(input.title.trim());
    const sanitizedContent = sanitizationService.sanitizeContent(input.content);

    // Create post
    const post = await this.postRepo.create({
      title: sanitizedTitle,
      content: sanitizedContent,
      authorId: input.isAnonymous ? undefined : authorId,
      categoryId: input.categoryId,
      isAnonymous: input.isAnonymous,
      images: input.images,
      tagIds: input.tagIds,
    });

    return this.formatPost(post.id, authorId);
  }

  async updatePost(id: string, input: UpdatePostInput, userId: string): Promise<FormattedPost> {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError('Post', id);
    }

    // Check authorization using centralized service
    const authContext = await this.authService.getAuthContext(userId);
    if (!authContext) {
      throw new ForbiddenError('User not found');
    }

    const resourceContext = await this.authService.getPostResourceContext(id);
    if (!resourceContext) {
      throw new NotFoundError('Post', id);
    }

    const canUpdate = await this.authService.canUpdate(authContext, resourceContext);
    if (!canUpdate.allowed) {
      throw new ForbiddenError(canUpdate.reason || 'Not authorized to edit this post');
    }

    // Validate if provided
    if (input.title !== undefined) {
      if (input.title.trim().length < 5) {
        throw new ValidationError('Title must be at least 5 characters', { title: 'Too short' });
      }
      if (input.title.length > 255) {
        throw new ValidationError('Title must be less than 255 characters', { title: 'Too long' });
      }
    }

    if (input.content !== undefined && input.content.trim().length < 10) {
      throw new ValidationError('Content must be at least 10 characters', { content: 'Too short' });
    }

    if (input.categoryId !== undefined) {
      const category = await this.categoryRepo.findById(input.categoryId);
      if (!category) {
        throw new ValidationError('Invalid category', { categoryId: 'Category not found' });
      }
    }

    await this.postRepo.update(id, {
      title: input.title ? sanitizationService.sanitizeTitle(input.title.trim()) : undefined,
      content: input.content ? sanitizationService.sanitizeContent(input.content) : undefined,
      categoryId: input.categoryId,
      isAnonymous: input.isAnonymous,
      images: input.images,
    });

    return this.formatPost(id, userId);
  }

  async listPosts(input: ListPostsInput, currentUserId?: string): Promise<CursorPaginatedResult<FormattedPost>> {
    const limit = Math.min(Math.max(input.limit, 1), 100);

    const result = await this.postRepo.listWithAuthors({
      cursor: input.cursor,
      limit,
      sort: input.sort,
      categoryId: input.categoryId,
      tag: input.tag,
      search: input.search,
      authorId: input.authorId,
    });

    // Get user votes if logged in
    let userVotes = new Map<string, number>();
    if (currentUserId && result.data.length > 0) {
      const postIds = result.data.map(p => p.post.id);
      userVotes = await this.voteRepo.getUserVotesForTargets(currentUserId, 'POST', postIds);
    }

    // Format posts - category and tags now come from batch query in repository
    const formattedPosts = result.data.map(({ post, author, category, tags }) => ({
      id: post.id,
      title: post.title,
      snippet: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
      tags: tags.map(t => ({ id: t.id, name: t.name, slug: t.slug })),
      author: post.isAnonymous || !author
        ? null
        : {
            id: author.id,
            username: author.username,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
            verifiedTherapist: author.verifiedTherapist,
          },
      voteScore: post.voteScore,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      isAnonymous: post.isAnonymous,
      images: post.images,
      userVote: userVotes.get(post.id),
    }));

    return {
      data: formattedPosts,
      pagination: result.pagination,
    };
  }

  async getPost(id: string, currentUserId?: string): Promise<FormattedPost | null> {
    const result = await this.postRepo.findByIdWithAuthor(id);
    if (!result) return null;

    // Increment view count using Redis batching
    await this.viewCountService.incrementViewCount(id, currentUserId);

    return this.formatPost(id, currentUserId);
  }

  async deletePost(id: string, userId: string): Promise<void> {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError('Post', id);
    }

    // Check authorization using centralized service
    const authContext = await this.authService.getAuthContext(userId);
    if (!authContext) {
      throw new ForbiddenError('User not found');
    }

    const resourceContext = await this.authService.getPostResourceContext(id);
    if (!resourceContext) {
      throw new NotFoundError('Post', id);
    }

    const canDelete = await this.authService.canDelete(authContext, resourceContext);
    if (!canDelete.allowed) {
      throw new ForbiddenError(canDelete.reason || 'Not authorized to delete this post');
    }

    await this.postRepo.delete(id);

    await this.auditRepo.create({
      userId,
      action: 'POST_DELETED',
      targetType: 'POST',
      targetId: id,
    });
  }

  async vote(postId: string, userId: string, value: number): Promise<{ voteScore: number; userVote: number }> {
    const post = await this.postRepo.findById(postId);
    if (!post) {
      throw new NotFoundError('Post', postId);
    }

    // Normalize vote value to -1, 0, or 1
    const normalizedValue = value > 0 ? 1 : value < 0 ? -1 : 0;

    // Get existing vote
    const existingVote = await this.voteRepo.findByUserAndTarget(userId, 'POST', postId);
    const previousValue = existingVote?.value ?? 0;

    if (normalizedValue === 0) {
      // Remove vote
      if (existingVote) {
        await this.voteRepo.delete(userId, 'POST', postId);
        await this.postRepo.updateVoteScore(postId, -previousValue);
      }
    } else {
      // Upsert vote
      await this.voteRepo.upsert({
        userId,
        targetType: 'POST',
        targetId: postId,
        value: normalizedValue,
      });

      // Update score: remove old value, add new value
      const delta = normalizedValue - previousValue;
      if (delta !== 0) {
        await this.postRepo.updateVoteScore(postId, delta);
      }
    }

    const updatedPost = await this.postRepo.findById(postId);
    return {
      voteScore: updatedPost?.voteScore ?? 0,
      userVote: normalizedValue,
    };
  }

  async removeVote(postId: string, userId: string): Promise<{ voteScore: number }> {
    const result = await this.vote(postId, userId, 0);
    return { voteScore: result.voteScore };
  }

  async pinPost(id: string, moderatorId: string): Promise<void> {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError('Post', id);
    }

    await this.postRepo.update(id, { isPinned: true });

    await this.auditRepo.create({
      userId: moderatorId,
      action: 'POST_PINNED',
      targetType: 'POST',
      targetId: id,
    });
  }

  async unpinPost(id: string, moderatorId: string): Promise<void> {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError('Post', id);
    }

    await this.postRepo.update(id, { isPinned: false });

    await this.auditRepo.create({
      userId: moderatorId,
      action: 'POST_UNPINNED',
      targetType: 'POST',
      targetId: id,
    });
  }

  async lockPost(id: string, moderatorId: string): Promise<void> {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError('Post', id);
    }

    await this.postRepo.update(id, { isLocked: true });

    await this.auditRepo.create({
      userId: moderatorId,
      action: 'POST_LOCKED',
      targetType: 'POST',
      targetId: id,
    });
  }

  async unlockPost(id: string, moderatorId: string): Promise<void> {
    const post = await this.postRepo.findById(id);
    if (!post) {
      throw new NotFoundError('Post', id);
    }

    await this.postRepo.update(id, { isLocked: false });

    await this.auditRepo.create({
      userId: moderatorId,
      action: 'POST_UNLOCKED',
      targetType: 'POST',
      targetId: id,
    });
  }

  private async formatPost(postId: string, currentUserId?: string): Promise<FormattedPost> {
    const result = await this.postRepo.findByIdWithAuthor(postId);
    if (!result) {
      throw new NotFoundError('Post', postId);
    }

    // Category and tags now come from the repository (single query with include)
    const { post, author, category, tags } = result;

    let userVote: number | undefined;
    if (currentUserId) {
      const vote = await this.voteRepo.findByUserAndTarget(currentUserId, 'POST', postId);
      userVote = vote?.value;
    }

    return {
      id: post.id,
      title: post.title,
      snippet: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
      tags: tags.map(t => ({ id: t.id, name: t.name, slug: t.slug })),
      author: post.isAnonymous || !author
        ? null
        : {
            id: author.id,
            username: author.username,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
            verifiedTherapist: author.verifiedTherapist,
          },
      voteScore: post.voteScore,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      isAnonymous: post.isAnonymous,
      images: post.images,
      userVote,
    };
  }

}
