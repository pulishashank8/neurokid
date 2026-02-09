import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { VoteService } from '@/application/services/VoteService';
import { ValidationError, NotFoundError } from '@/domain/errors';
import {
  createTestContainer,
  resetTestContainer,
  createMockVoteRepository,
  createMockPostRepository,
  createMockCommentRepository,
} from '../../utils/test-container';

describe('VoteService', () => {
  let voteService: VoteService;
  let mockVoteRepo: ReturnType<typeof createMockVoteRepository> & { 
    upsert: ReturnType<typeof vi.fn>;
    getUserVotesForTargets: ReturnType<typeof vi.fn>;
  };
  let mockPostRepo: ReturnType<typeof createMockPostRepository>;
  let mockCommentRepo: ReturnType<typeof createMockCommentRepository>;

  beforeEach(() => {
    resetTestContainer();
    createTestContainer();

    mockVoteRepo = {
      ...createMockVoteRepository(),
      upsert: vi.fn(),
      getUserVotesForTargets: vi.fn().mockResolvedValue(new Map()),
    };
    mockPostRepo = createMockPostRepository();
    mockCommentRepo = createMockCommentRepository();

    container.register(TOKENS.VoteRepository, { useValue: mockVoteRepo });
    container.register(TOKENS.PostRepository, { useValue: mockPostRepo });
    container.register(TOKENS.CommentRepository, { useValue: mockCommentRepo });

    voteService = container.resolve(VoteService);
  });

  describe('vote', () => {
    it('should create a new upvote on a post', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Content',
        authorId: 'author-1',
        categoryId: 'category-1',
        status: 'ACTIVE',
        viewCount: 0,
        commentCount: 0,
        voteScore: 0,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };

      const updatedPost = { ...mockPost, voteScore: 1 };

      mockPostRepo.findById
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce(updatedPost);
      mockVoteRepo.findByUserAndTarget.mockResolvedValue(null);
      mockVoteRepo.upsert.mockResolvedValue({ id: 'vote-1', value: 1 });
      mockPostRepo.updateVoteScore.mockResolvedValue(undefined);

      const result = await voteService.vote('user-1', 'POST', 'post-1', 1);

      expect(result.voteScore).toBe(1);
      expect(result.userVote).toBe(1);
      expect(mockVoteRepo.upsert).toHaveBeenCalledWith({
        userId: 'user-1',
        targetType: 'POST',
        targetId: 'post-1',
        value: 1,
      });
    });

    it('should create a new downvote on a post', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Content',
        authorId: 'author-1',
        categoryId: 'category-1',
        status: 'ACTIVE',
        viewCount: 0,
        commentCount: 0,
        voteScore: 0,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };

      const updatedPost = { ...mockPost, voteScore: -1 };

      mockPostRepo.findById
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce(updatedPost);
      mockVoteRepo.findByUserAndTarget.mockResolvedValue(null);
      mockVoteRepo.upsert.mockResolvedValue({ id: 'vote-1', value: -1 });
      mockPostRepo.updateVoteScore.mockResolvedValue(undefined);

      const result = await voteService.vote('user-1', 'POST', 'post-1', -1);

      expect(result.voteScore).toBe(-1);
      expect(result.userVote).toBe(-1);
    });

    it('should update an existing vote', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Content',
        authorId: 'author-1',
        categoryId: 'category-1',
        status: 'ACTIVE',
        viewCount: 0,
        commentCount: 0,
        voteScore: 1,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };

      const updatedPost = { ...mockPost, voteScore: -1 };

      mockPostRepo.findById
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce(updatedPost);
      mockVoteRepo.findByUserAndTarget.mockResolvedValue({ id: 'vote-1', value: 1 });
      mockVoteRepo.upsert.mockResolvedValue({ id: 'vote-1', value: -1 });
      mockPostRepo.updateVoteScore.mockResolvedValue(undefined);

      const result = await voteService.vote('user-1', 'POST', 'post-1', -1);

      expect(result.voteScore).toBe(-1);
      expect(result.userVote).toBe(-1);
      expect(mockPostRepo.updateVoteScore).toHaveBeenCalledWith('post-1', -2);
    });

    it('should remove vote when value is 0', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Content',
        authorId: 'author-1',
        categoryId: 'category-1',
        status: 'ACTIVE',
        viewCount: 0,
        commentCount: 0,
        voteScore: 1,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };

      const updatedPost = { ...mockPost, voteScore: 0 };

      mockPostRepo.findById.mockResolvedValue(updatedPost);
      mockVoteRepo.findByUserAndTarget.mockResolvedValue({ id: 'vote-1', value: 1 });
      mockVoteRepo.delete.mockResolvedValue(undefined);
      mockPostRepo.updateVoteScore.mockResolvedValue(undefined);

      const result = await voteService.vote('user-1', 'POST', 'post-1', 0);

      expect(result.voteScore).toBe(0);
      expect(result.userVote).toBe(0);
      expect(mockVoteRepo.delete).toHaveBeenCalledWith('user-1', 'POST', 'post-1');
    });

    it('should throw ValidationError for invalid vote value', async () => {
      await expect(voteService.vote('user-1', 'POST', 'post-1', 2))
        .rejects.toThrow(ValidationError);
      
      await expect(voteService.vote('user-1', 'POST', 'post-1', -2))
        .rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when post not found', async () => {
      mockPostRepo.findById.mockResolvedValue(null);

      await expect(voteService.vote('user-1', 'POST', 'nonexistent', 1))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when comment not found', async () => {
      mockCommentRepo.findById.mockResolvedValue(null);

      await expect(voteService.vote('user-1', 'COMMENT', 'nonexistent', 1))
        .rejects.toThrow(NotFoundError);
    });

    it('should vote on a comment', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Test comment',
        postId: 'post-1',
        authorId: 'author-1',
        parentId: null,
        status: 'ACTIVE',
        voteScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedComment = { ...mockComment, voteScore: 1 };

      mockCommentRepo.findById
        .mockResolvedValueOnce(mockComment)
        .mockResolvedValueOnce(updatedComment);
      mockVoteRepo.findByUserAndTarget.mockResolvedValue(null);
      mockVoteRepo.upsert.mockResolvedValue({ id: 'vote-1', value: 1 });
      mockCommentRepo.updateVoteScore.mockResolvedValue(undefined);

      const result = await voteService.vote('user-1', 'COMMENT', 'comment-1', 1);

      expect(result.voteScore).toBe(1);
      expect(result.userVote).toBe(1);
      expect(mockCommentRepo.updateVoteScore).toHaveBeenCalledWith('comment-1', 1);
    });
  });

  describe('removeVote', () => {
    it('should remove an existing vote and update score', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Content',
        authorId: 'author-1',
        categoryId: 'category-1',
        status: 'ACTIVE',
        viewCount: 0,
        commentCount: 0,
        voteScore: 5,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };

      const updatedPost = { ...mockPost, voteScore: 4 };

      mockVoteRepo.findByUserAndTarget.mockResolvedValue({ id: 'vote-1', value: 1 });
      mockVoteRepo.delete.mockResolvedValue(undefined);
      mockPostRepo.updateVoteScore.mockResolvedValue(undefined);
      mockPostRepo.findById.mockResolvedValue(updatedPost);

      const result = await voteService.removeVote('user-1', 'POST', 'post-1');

      expect(result.voteScore).toBe(4);
      expect(result.userVote).toBe(0);
      expect(mockVoteRepo.delete).toHaveBeenCalledWith('user-1', 'POST', 'post-1');
    });

    it('should return current score when no existing vote', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Content',
        authorId: 'author-1',
        categoryId: 'category-1',
        status: 'ACTIVE',
        viewCount: 0,
        commentCount: 0,
        voteScore: 3,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };

      mockVoteRepo.findByUserAndTarget.mockResolvedValue(null);
      mockPostRepo.findById.mockResolvedValue(mockPost);

      const result = await voteService.removeVote('user-1', 'POST', 'post-1');

      expect(result.voteScore).toBe(3);
      expect(result.userVote).toBe(0);
      expect(mockVoteRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('getUserVote', () => {
    it('should return vote value when user has voted', async () => {
      mockVoteRepo.findByUserAndTarget.mockResolvedValue({ id: 'vote-1', value: 1 });

      const result = await voteService.getUserVote('user-1', 'POST', 'post-1');

      expect(result).toBe(1);
    });

    it('should return 0 when user has not voted', async () => {
      mockVoteRepo.findByUserAndTarget.mockResolvedValue(null);

      const result = await voteService.getUserVote('user-1', 'POST', 'post-1');

      expect(result).toBe(0);
    });
  });
});
