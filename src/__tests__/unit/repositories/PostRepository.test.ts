import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { PostRepository } from '@/infrastructure/repositories/PostRepository';
import { PostStatus } from '@/domain/types';
import { createMockPrismaClient, resetMockPrismaClient } from '../../utils/mock-prisma';

describe('PostRepository', () => {
  let repository: PostRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    container.clearInstances();
    resetMockPrismaClient();
    mockPrisma = createMockPrismaClient();
    
    // Register mock database connection
    container.register(TOKENS.DatabaseConnection, {
      useValue: {
        getClient: vi.fn().mockReturnValue(mockPrisma),
        getReadClient: vi.fn().mockReturnValue(mockPrisma),
      },
    });

    repository = container.resolve(PostRepository);
  });

  describe('findById', () => {
    it('should return post when found', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        authorId: 'user-1',
        categoryId: 'cat-1',
        status: 'ACTIVE',
        viewCount: 10,
        commentCount: 5,
        voteScore: 15,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        images: [],
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      const result = await repository.findById('post-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('post-1');
      expect(result?.title).toBe('Test Post');
      expect(result?.status).toBe('ACTIVE');
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
    });

    it('should return null when post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should map Prisma post to domain post correctly', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        authorId: null, // anonymous post
        categoryId: 'cat-1',
        status: 'PENDING',
        viewCount: 0,
        commentCount: 0,
        voteScore: 0,
        isAnonymous: true,
        isPinned: true,
        isLocked: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        images: ['image1.jpg', 'image2.jpg'],
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      const result = await repository.findById('post-1');

      expect(result?.authorId).toBeUndefined();
      expect(result?.isAnonymous).toBe(true);
      expect(result?.status).toBe('PENDING');
      expect(result?.images).toEqual(['image1.jpg', 'image2.jpg']);
    });
  });

  describe('findByIdWithAuthor', () => {
    it('should return post with author details', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        authorId: 'user-1',
        categoryId: 'cat-1',
        status: 'ACTIVE',
        viewCount: 10,
        commentCount: 5,
        voteScore: 15,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        images: [],
        author: {
          id: 'user-1',
          profile: {
            username: 'testuser',
            displayName: 'Test User',
            avatarUrl: 'avatar.jpg',
            verifiedTherapist: true,
          },
        },
        category: {
          id: 'cat-1',
          name: 'Test Category',
          slug: 'test-category',
        },
        tags: [
          { id: 'tag-1', name: 'Tag 1', slug: 'tag-1' },
        ],
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      const result = await repository.findByIdWithAuthor('post-1');

      expect(result).not.toBeNull();
      expect(result?.post.id).toBe('post-1');
      expect(result?.author).not.toBeNull();
      expect(result?.author?.username).toBe('testuser');
      expect(result?.author?.verifiedTherapist).toBe(true);
      expect(result?.category?.name).toBe('Test Category');
      expect(result?.tags).toHaveLength(1);
    });

    it('should return null author for anonymous post', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Anonymous Post',
        content: 'Anonymous content',
        authorId: 'user-1',
        categoryId: 'cat-1',
        status: 'ACTIVE',
        viewCount: 10,
        commentCount: 5,
        voteScore: 15,
        isAnonymous: true,
        isPinned: false,
        isLocked: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        images: [],
        author: {
          id: 'user-1',
          profile: {
            username: 'testuser',
            displayName: 'Test User',
            avatarUrl: null,
            verifiedTherapist: false,
          },
        },
        category: null,
        tags: [],
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      const result = await repository.findByIdWithAuthor('post-1');

      expect(result?.author).toBeNull();
      expect(result?.post.isAnonymous).toBe(true);
    });

    it('should handle missing author profile gracefully', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        authorId: 'user-1',
        categoryId: 'cat-1',
        status: 'ACTIVE',
        viewCount: 10,
        commentCount: 5,
        voteScore: 15,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        images: [],
        author: {
          id: 'user-1',
          profile: null,
        },
        category: null,
        tags: [],
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);

      const result = await repository.findByIdWithAuthor('post-1');

      expect(result?.author?.username).toBe('Unknown');
      expect(result?.author?.displayName).toBe('Unknown');
    });
  });

  describe('create', () => {
    it('should create a post with provided data', async () => {
      const input = {
        title: 'New Post',
        content: 'New post content that is long enough.',
        authorId: 'user-1',
        categoryId: 'cat-1',
      };

      const mockCreatedPost = {
        id: 'new-post-1',
        title: input.title,
        content: input.content,
        authorId: input.authorId,
        categoryId: input.categoryId,
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

      mockPrisma.post.create.mockResolvedValue(mockCreatedPost);

      const result = await repository.create(input);

      expect(result.id).toBe('new-post-1');
      expect(result.title).toBe(input.title);
      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: {
          title: input.title,
          content: input.content,
          authorId: input.authorId,
          categoryId: input.categoryId,
          isAnonymous: false,
          images: [],
          status: 'ACTIVE',
        },
      });
    });

    it('should create anonymous post when specified', async () => {
      const input = {
        title: 'Anonymous Post',
        content: 'Anonymous content here.',
        authorId: 'user-1',
        categoryId: 'cat-1',
        isAnonymous: true,
      };

      const mockCreatedPost = {
        id: 'anon-post-1',
        title: input.title,
        content: input.content,
        authorId: input.authorId,
        categoryId: input.categoryId,
        status: 'ACTIVE',
        viewCount: 0,
        commentCount: 0,
        voteScore: 0,
        isAnonymous: true,
        isPinned: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };

      mockPrisma.post.create.mockResolvedValue(mockCreatedPost);

      const result = await repository.create(input);

      expect(result.isAnonymous).toBe(true);
      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isAnonymous: true,
        }),
      });
    });

    it('should connect tags when tagIds provided', async () => {
      const input = {
        title: 'Tagged Post',
        content: 'Tagged content here.',
        authorId: 'user-1',
        categoryId: 'cat-1',
        tagIds: ['tag-1', 'tag-2'],
      };

      const mockCreatedPost = {
        id: 'tagged-post-1',
        title: input.title,
        content: input.content,
        authorId: input.authorId,
        categoryId: input.categoryId,
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

      mockPrisma.post.create.mockResolvedValue(mockCreatedPost);

      await repository.create(input);

      expect(mockPrisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tags: {
            connect: [{ id: 'tag-1' }, { id: 'tag-2' }],
          },
        }),
      });
    });
  });

  describe('update', () => {
    it('should update post title', async () => {
      const mockUpdatedPost = {
        id: 'post-1',
        title: 'Updated Title',
        content: 'Original content',
        authorId: 'user-1',
        categoryId: 'cat-1',
        status: 'ACTIVE',
        viewCount: 10,
        commentCount: 5,
        voteScore: 15,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        images: [],
      };

      mockPrisma.post.update.mockResolvedValue(mockUpdatedPost);

      const result = await repository.update('post-1', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { title: 'Updated Title' },
      });
    });

    it('should update post status', async () => {
      const mockUpdatedPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        authorId: 'user-1',
        categoryId: 'cat-1',
        status: 'REMOVED',
        viewCount: 10,
        commentCount: 5,
        voteScore: 15,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        images: [],
      };

      mockPrisma.post.update.mockResolvedValue(mockUpdatedPost);

      const result = await repository.update('post-1', { status: 'REMOVED' as PostStatus });

      expect(result.status).toBe('REMOVED');
    });

    it('should set pinnedAt when pinning post', async () => {
      const mockUpdatedPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        authorId: 'user-1',
        categoryId: 'cat-1',
        status: 'ACTIVE',
        viewCount: 10,
        commentCount: 5,
        voteScore: 15,
        isAnonymous: false,
        isPinned: true,
        isLocked: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        images: [],
      };

      mockPrisma.post.update.mockResolvedValue(mockUpdatedPost);

      await repository.update('post-1', { isPinned: true });

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: expect.objectContaining({
          isPinned: true,
          pinnedAt: expect.any(Date),
        }),
      });
    });

    it('should clear pinnedAt when unpinning post', async () => {
      const mockUpdatedPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        authorId: 'user-1',
        categoryId: 'cat-1',
        status: 'ACTIVE',
        viewCount: 10,
        commentCount: 5,
        voteScore: 15,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        images: [],
      };

      mockPrisma.post.update.mockResolvedValue(mockUpdatedPost);

      await repository.update('post-1', { isPinned: false });

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: expect.objectContaining({
          isPinned: false,
          pinnedAt: null,
        }),
      });
    });

    it('should update category when categoryId provided', async () => {
      const mockUpdatedPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        authorId: 'user-1',
        categoryId: 'cat-2',
        status: 'ACTIVE',
        viewCount: 10,
        commentCount: 5,
        voteScore: 15,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        images: [],
      };

      mockPrisma.post.update.mockResolvedValue(mockUpdatedPost);

      await repository.update('post-1', { categoryId: 'cat-2' });

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: expect.objectContaining({
          category: { connect: { id: 'cat-2' } },
        }),
      });
    });
  });

  describe('delete', () => {
    it('should delete post by id', async () => {
      mockPrisma.post.delete.mockResolvedValue({ id: 'post-1' } as any);

      await repository.delete('post-1');

      expect(mockPrisma.post.delete).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count by 1', async () => {
      mockPrisma.post.update.mockResolvedValue({ id: 'post-1' } as any);

      await repository.incrementViewCount('post-1');

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { viewCount: { increment: 1 } },
      });
    });
  });

  describe('updateVoteScore', () => {
    it('should increment vote score by delta', async () => {
      mockPrisma.post.update.mockResolvedValue({ id: 'post-1' } as any);

      await repository.updateVoteScore('post-1', 5);

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { voteScore: { increment: 5 } },
      });
    });

    it('should decrement vote score by negative delta', async () => {
      mockPrisma.post.update.mockResolvedValue({ id: 'post-1' } as any);

      await repository.updateVoteScore('post-1', -2);

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { voteScore: { increment: -2 } },
      });
    });
  });

  describe('updateCommentCount', () => {
    it('should increment comment count by delta', async () => {
      mockPrisma.post.update.mockResolvedValue({ id: 'post-1' } as any);

      await repository.updateCommentCount('post-1', 1);

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { commentCount: { increment: 1 } },
      });
    });
  });

  describe('existsDuplicate', () => {
    it('should return true if duplicate exists', async () => {
      mockPrisma.post.count.mockResolvedValue(1);

      const since = new Date('2024-01-01');
      const result = await repository.existsDuplicate('user-1', 'Same Title', since);

      expect(result).toBe(true);
      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: {
          authorId: 'user-1',
          title: 'Same Title',
          createdAt: { gte: since },
        },
      });
    });

    it('should return false if no duplicate exists', async () => {
      mockPrisma.post.count.mockResolvedValue(0);

      const since = new Date('2024-01-01');
      const result = await repository.existsDuplicate('user-1', 'Unique Title', since);

      expect(result).toBe(false);
    });
  });

  describe('getAuthorId', () => {
    it('should return authorId when post exists', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ authorId: 'user-1' });

      const result = await repository.getAuthorId('post-1');

      expect(result).toBe('user-1');
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        select: { authorId: true },
      });
    });

    it('should return null when post does not exist', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      const result = await repository.getAuthorId('nonexistent');

      expect(result).toBeNull();
    });
  });
});
