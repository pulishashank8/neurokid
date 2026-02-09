import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { BookmarkRepository } from '@/infrastructure/repositories/BookmarkRepository';
import { createMockPrismaClient } from '../../utils/mock-prisma';

describe('BookmarkRepository', () => {
  let repository: BookmarkRepository;
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

    repository = container.resolve(BookmarkRepository);
  });

  describe('findByUserAndPost', () => {
    it('should return bookmark when found', async () => {
      const mockBookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        postId: 'post-1',
        createdAt: new Date(),
      };

      mockPrisma.bookmark.findUnique.mockResolvedValue(mockBookmark);

      const result = await repository.findByUserAndPost('user-1', 'post-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('bookmark-1');
      expect(result?.userId).toBe('user-1');
      expect(result?.postId).toBe('post-1');
      expect(mockPrisma.bookmark.findUnique).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId: 'user-1',
            postId: 'post-1',
          },
        },
      });
    });

    it('should return null when bookmark not found', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserAndPost('user-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return all bookmarks for user', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          userId: 'user-1',
          postId: 'post-1',
          createdAt: new Date(),
        },
        {
          id: 'bookmark-2',
          userId: 'user-1',
          postId: 'post-2',
          createdAt: new Date(),
        },
        {
          id: 'bookmark-3',
          userId: 'user-1',
          postId: 'post-3',
          createdAt: new Date(),
        },
      ];

      mockPrisma.bookmark.findMany.mockResolvedValue(mockBookmarks);

      const result = await repository.findByUserId('user-1');

      expect(result).toHaveLength(3);
      expect(result[0].postId).toBe('post-1');
      expect(result[1].postId).toBe('post-2');
      expect(result[2].postId).toBe('post-3');
      expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: expect.any(Number), // QUERY_LIMITS.MAX_LIMIT
      });
    });

    it('should return empty array when user has no bookmarks', async () => {
      mockPrisma.bookmark.findMany.mockResolvedValue([]);

      const result = await repository.findByUserId('user-1');

      expect(result).toHaveLength(0);
    });

    it('should limit results to MAX_LIMIT', async () => {
      const mockBookmarks = Array(150).fill(null).map((_, i) => ({
        id: `bookmark-${i}`,
        userId: 'user-1',
        postId: `post-${i}`,
        createdAt: new Date(),
      }));

      mockPrisma.bookmark.findMany.mockResolvedValue(mockBookmarks.slice(0, 100));

      const result = await repository.findByUserId('user-1');

      expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: expect.any(Number),
      });
    });
  });

  describe('create', () => {
    it('should create a new bookmark', async () => {
      const input = {
        userId: 'user-1',
        postId: 'post-1',
      };

      const mockCreatedBookmark = {
        id: 'bookmark-1',
        userId: input.userId,
        postId: input.postId,
        createdAt: new Date(),
      };

      mockPrisma.bookmark.create.mockResolvedValue(mockCreatedBookmark);

      const result = await repository.create(input);

      expect(result.id).toBe('bookmark-1');
      expect(result.userId).toBe('user-1');
      expect(result.postId).toBe('post-1');
      expect(mockPrisma.bookmark.create).toHaveBeenCalledWith({
        data: {
          userId: input.userId,
          postId: input.postId,
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete bookmark by user and post', async () => {
      mockPrisma.bookmark.deleteMany.mockResolvedValue({ count: 1 });

      await repository.delete('user-1', 'post-1');

      expect(mockPrisma.bookmark.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          postId: 'post-1',
        },
      });
    });

    it('should handle deleting non-existent bookmark gracefully', async () => {
      mockPrisma.bookmark.deleteMany.mockResolvedValue({ count: 0 });

      await repository.delete('user-1', 'nonexistent');

      expect(mockPrisma.bookmark.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          postId: 'nonexistent',
        },
      });
    });
  });

  describe('exists', () => {
    it('should return true when bookmark exists', async () => {
      mockPrisma.bookmark.count.mockResolvedValue(1);

      const result = await repository.exists('user-1', 'post-1');

      expect(result).toBe(true);
      expect(mockPrisma.bookmark.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          postId: 'post-1',
        },
      });
    });

    it('should return false when bookmark does not exist', async () => {
      mockPrisma.bookmark.count.mockResolvedValue(0);

      const result = await repository.exists('user-1', 'post-1');

      expect(result).toBe(false);
    });
  });
});
