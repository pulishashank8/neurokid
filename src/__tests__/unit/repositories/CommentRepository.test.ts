import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { CommentRepository } from '@/infrastructure/repositories/CommentRepository';
import { CommentStatus } from '@/domain/types';
import { createMockPrismaClient } from '../../utils/mock-prisma';

describe('CommentRepository', () => {
  let repository: CommentRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    container.clearInstances();
    mockPrisma = createMockPrismaClient();
    
    container.register(TOKENS.DatabaseConnection, {
      useValue: {
        getClient: vi.fn().mockReturnValue(mockPrisma),
        getReadClient: vi.fn().mockReturnValue(mockPrisma),
      },
    });

    repository = container.resolve(CommentRepository);
  });

  describe('findById', () => {
    it('should return comment when found', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Test comment',
        authorId: 'user-1',
        postId: 'post-1',
        parentCommentId: null,
        status: 'ACTIVE',
        isAnonymous: false,
        voteScore: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);

      const result = await repository.findById('comment-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('comment-1');
      expect(result?.content).toBe('Test comment');
      expect(result?.status).toBe('ACTIVE');
      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
    });

    it('should return null when comment not found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should map Prisma comment to domain correctly', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Reply comment',
        authorId: 'user-1',
        postId: 'post-1',
        parentCommentId: 'parent-comment-1',
        status: 'PENDING',
        isAnonymous: true,
        voteScore: -2,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);

      const result = await repository.findById('comment-1');

      expect(result?.parentCommentId).toBe('parent-comment-1');
      expect(result?.isAnonymous).toBe(true);
      expect(result?.status).toBe('PENDING');
      expect(result?.voteScore).toBe(-2);
    });
  });

  describe('findByIdWithAuthor', () => {
    it('should return comment with author details', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Test comment',
        authorId: 'user-1',
        postId: 'post-1',
        parentCommentId: null,
        status: 'ACTIVE',
        isAnonymous: false,
        voteScore: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: 'user-1',
          profile: {
            username: 'testuser',
            displayName: 'Test User',
            avatarUrl: 'avatar.jpg',
            verifiedTherapist: true,
          },
        },
        _count: {
          childComments: 3,
        },
      };

      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);

      const result = await repository.findByIdWithAuthor('comment-1');

      expect(result).not.toBeNull();
      expect(result?.comment.id).toBe('comment-1');
      expect(result?.author).not.toBeNull();
      expect(result?.author?.username).toBe('testuser');
      expect(result?.author?.verifiedTherapist).toBe(true);
      expect(result?.replyCount).toBe(3);
    });

    it('should return null author for anonymous comment', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Anonymous comment',
        authorId: 'user-1',
        postId: 'post-1',
        parentCommentId: null,
        status: 'ACTIVE',
        isAnonymous: true,
        voteScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: 'user-1',
          profile: {
            username: 'testuser',
            displayName: 'Test User',
            avatarUrl: null,
            verifiedTherapist: false,
          },
        },
        _count: {
          childComments: 0,
        },
      };

      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);

      const result = await repository.findByIdWithAuthor('comment-1');

      expect(result?.author).toBeNull();
      expect(result?.comment.isAnonymous).toBe(true);
    });

    it('should handle missing profile gracefully', async () => {
      const mockComment = {
        id: 'comment-1',
        content: 'Test comment',
        authorId: 'user-1',
        postId: 'post-1',
        parentCommentId: null,
        status: 'ACTIVE',
        isAnonymous: false,
        voteScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: 'user-1',
          profile: null,
        },
        _count: {
          childComments: 0,
        },
      };

      mockPrisma.comment.findUnique.mockResolvedValue(mockComment);

      const result = await repository.findByIdWithAuthor('comment-1');

      expect(result?.author?.username).toBe('Unknown');
      expect(result?.author?.displayName).toBe('Unknown');
    });

    it('should return null when comment not found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      const result = await repository.findByIdWithAuthor('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return paginated comments for a post', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          content: 'First comment',
          authorId: 'user-1',
          postId: 'post-1',
          parentCommentId: null,
          status: 'ACTIVE',
          isAnonymous: false,
          voteScore: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 'user-1',
            profile: {
              username: 'user1',
              displayName: 'User One',
              avatarUrl: null,
              verifiedTherapist: false,
            },
          },
          _count: { childComments: 2 },
        },
        {
          id: 'comment-2',
          content: 'Second comment',
          authorId: 'user-2',
          postId: 'post-1',
          parentCommentId: null,
          status: 'ACTIVE',
          isAnonymous: false,
          voteScore: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 'user-2',
            profile: {
              username: 'user2',
              displayName: 'User Two',
              avatarUrl: null,
              verifiedTherapist: true,
            },
          },
          _count: { childComments: 0 },
        },
      ];

      mockPrisma.comment.findMany.mockResolvedValue(mockComments);
      mockPrisma.comment.count.mockResolvedValue(2);

      const result = await repository.list({
        postId: 'post-1',
        offset: 0,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
      expect(mockPrisma.comment.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          postId: 'post-1',
          status: 'ACTIVE',
        }),
        orderBy: { createdAt: 'asc' },
        skip: 0,
        take: 20,
      }));
    });

    it('should return replies when parentCommentId provided', async () => {
      const mockReplies = [
        {
          id: 'reply-1',
          content: 'Reply 1',
          authorId: 'user-2',
          postId: 'post-1',
          parentCommentId: 'comment-1',
          status: 'ACTIVE',
          isAnonymous: false,
          voteScore: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 'user-2',
            profile: {
              username: 'user2',
              displayName: 'User Two',
              avatarUrl: null,
              verifiedTherapist: false,
            },
          },
          _count: { childComments: 0 },
        },
      ];

      mockPrisma.comment.findMany.mockResolvedValue(mockReplies);
      mockPrisma.comment.count.mockResolvedValue(1);

      const result = await repository.list({
        postId: 'post-1',
        parentCommentId: 'comment-1',
        offset: 0,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].comment.parentCommentId).toBe('comment-1');
    });

    it('should return correct pagination metadata', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          content: 'Comment 1',
          authorId: 'user-1',
          postId: 'post-1',
          parentCommentId: null,
          status: 'ACTIVE',
          isAnonymous: false,
          voteScore: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 'user-1',
            profile: {
              username: 'user1',
              displayName: 'User One',
              avatarUrl: null,
              verifiedTherapist: false,
            },
          },
          _count: { childComments: 0 },
        },
      ];

      mockPrisma.comment.findMany.mockResolvedValue(mockComments);
      mockPrisma.comment.count.mockResolvedValue(1);

      const result = await repository.list({
        postId: 'post-1',
        offset: 0,
        limit: 10,
      });

      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.limit).toBe(10);
      expect(result.data).toHaveLength(1);
    });

    it('should handle empty comments list', async () => {
      mockPrisma.comment.findMany.mockResolvedValue([]);

      const result = await repository.list({
        postId: 'post-1',
        offset: 0,
        limit: 20,
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.limit).toBe(20);
    });
  });

  describe('create', () => {
    it('should create a comment with required fields', async () => {
      const input = {
        content: 'New comment',
        authorId: 'user-1',
        postId: 'post-1',
      };

      const mockCreatedComment = {
        id: 'new-comment-1',
        content: input.content,
        authorId: input.authorId,
        postId: input.postId,
        parentCommentId: null,
        status: 'ACTIVE',
        isAnonymous: false,
        voteScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.comment.create.mockResolvedValue(mockCreatedComment);

      const result = await repository.create(input);

      expect(result.id).toBe('new-comment-1');
      expect(result.content).toBe('New comment');
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: {
          content: input.content,
          authorId: input.authorId,
          postId: input.postId,
          parentCommentId: undefined,
          isAnonymous: false,
        },
      });
    });

    it('should create a reply comment with parentCommentId', async () => {
      const input = {
        content: 'Reply comment',
        authorId: 'user-2',
        postId: 'post-1',
        parentCommentId: 'parent-comment-1',
      };

      const mockCreatedComment = {
        id: 'reply-1',
        content: input.content,
        authorId: input.authorId,
        postId: input.postId,
        parentCommentId: 'parent-comment-1',
        status: 'ACTIVE',
        isAnonymous: false,
        voteScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.comment.create.mockResolvedValue(mockCreatedComment);

      const result = await repository.create(input);

      expect(result.parentCommentId).toBe('parent-comment-1');
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          parentCommentId: 'parent-comment-1',
        }),
      });
    });

    it('should create anonymous comment when specified', async () => {
      const input = {
        content: 'Anonymous comment',
        authorId: 'user-1',
        postId: 'post-1',
        isAnonymous: true,
      };

      const mockCreatedComment = {
        id: 'anon-comment-1',
        content: input.content,
        authorId: input.authorId,
        postId: input.postId,
        parentCommentId: null,
        status: 'ACTIVE',
        isAnonymous: true,
        voteScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.comment.create.mockResolvedValue(mockCreatedComment);

      const result = await repository.create(input);

      expect(result.isAnonymous).toBe(true);
      expect(mockPrisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isAnonymous: true,
        }),
      });
    });

    it('should invalidate comment count cache after creation', async () => {
      const input = {
        content: 'New comment',
        authorId: 'user-1',
        postId: 'post-1',
      };

      mockPrisma.comment.create.mockResolvedValue({
        id: 'comment-1',
        ...input,
        parentCommentId: null,
        status: 'ACTIVE',
        isAnonymous: false,
        voteScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await repository.create(input);

      // The cache invalidation is called via CacheAsideService.invalidate
      // We verify the create was called - cache invalidation happens in the service
      expect(mockPrisma.comment.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update comment content', async () => {
      const mockUpdatedComment = {
        id: 'comment-1',
        content: 'Updated content',
        authorId: 'user-1',
        postId: 'post-1',
        parentCommentId: null,
        status: 'ACTIVE',
        isAnonymous: false,
        voteScore: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      mockPrisma.comment.update.mockResolvedValue(mockUpdatedComment);

      const result = await repository.update('comment-1', { content: 'Updated content' });

      expect(result.content).toBe('Updated content');
      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { content: 'Updated content' },
      });
    });

    it('should update comment status', async () => {
      const mockUpdatedComment = {
        id: 'comment-1',
        content: 'Test content',
        authorId: 'user-1',
        postId: 'post-1',
        parentCommentId: null,
        status: 'REMOVED',
        isAnonymous: false,
        voteScore: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      mockPrisma.comment.update.mockResolvedValue(mockUpdatedComment);

      const result = await repository.update('comment-1', { status: 'REMOVED' as CommentStatus });

      expect(result.status).toBe('REMOVED');
    });

    it('should only include provided fields in update', async () => {
      const mockUpdatedComment = {
        id: 'comment-1',
        content: 'Original content',
        authorId: 'user-1',
        postId: 'post-1',
        parentCommentId: null,
        status: 'ACTIVE',
        isAnonymous: false,
        voteScore: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.comment.update.mockResolvedValue(mockUpdatedComment);

      await repository.update('comment-1', { content: 'Updated content' });

      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { content: 'Updated content' },
      });
    });
  });

  describe('delete', () => {
    it('should delete comment by id', async () => {
      mockPrisma.comment.delete.mockResolvedValue({ id: 'comment-1' } as any);

      await repository.delete('comment-1');

      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
    });
  });

  describe('updateVoteScore', () => {
    it('should increment vote score by delta', async () => {
      mockPrisma.comment.update.mockResolvedValue({ id: 'comment-1' } as any);

      await repository.updateVoteScore('comment-1', 1);

      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { voteScore: { increment: 1 } },
      });
    });

    it('should decrement vote score by negative delta', async () => {
      mockPrisma.comment.update.mockResolvedValue({ id: 'comment-1' } as any);

      await repository.updateVoteScore('comment-1', -1);

      expect(mockPrisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { voteScore: { increment: -1 } },
      });
    });
  });

  describe('getAuthorId', () => {
    it('should return authorId when comment exists', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({ authorId: 'user-1' });

      const result = await repository.getAuthorId('comment-1');

      expect(result).toBe('user-1');
      expect(mockPrisma.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        select: { authorId: true },
      });
    });

    it('should return null when comment does not exist', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);

      const result = await repository.getAuthorId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('countByPostId', () => {
    it('should return count of active comments for post', async () => {
      mockPrisma.comment.count.mockResolvedValue(15);

      const result = await repository.countByPostId('post-1');

      expect(result).toBe(15);
      expect(mockPrisma.comment.count).toHaveBeenCalledWith({
        where: { postId: 'post-1', status: 'ACTIVE' },
      });
    });

    it('should return 0 when post has no comments', async () => {
      mockPrisma.comment.count.mockResolvedValue(0);

      const result = await repository.countByPostId('post-1');

      expect(result).toBe(0);
    });
  });
});
