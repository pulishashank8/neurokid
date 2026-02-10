import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { BookmarkService } from '@/application/services/BookmarkService';
import { ValidationError, NotFoundError, ConflictError } from '@/domain/errors';
import {
  createTestContainer,
  resetTestContainer,
  createMockDatabaseConnection,
} from '../../utils/test-container';

describe('BookmarkService', () => {
  let bookmarkService: BookmarkService;
  let mockDb: ReturnType<typeof createMockDatabaseConnection>;
  let mockPrisma: any;

  beforeEach(() => {
    resetTestContainer();
    createTestContainer();

    // Create a mock Prisma client with bookmark methods
    mockPrisma = {
      bookmark: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      post: {
        findUnique: vi.fn(),
      },
    };

    mockDb = {
      ...createMockDatabaseConnection(),
      getClient: vi.fn().mockReturnValue(mockPrisma),
    };

    container.register(TOKENS.DatabaseConnection, { useValue: mockDb });

    bookmarkService = container.resolve(BookmarkService);
  });

  describe('create', () => {
    it('should create a bookmark for existing post', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
      };

      const mockBookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        postId: 'post-1',
        createdAt: new Date(),
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.bookmark.findUnique.mockResolvedValue(null);
      mockPrisma.bookmark.create.mockResolvedValue(mockBookmark);

      const result = await bookmarkService.create('user-1', 'post-1');

      expect(result.id).toBe('bookmark-1');
      expect(result.userId).toBe('user-1');
      expect(result.postId).toBe('post-1');
      expect(mockPrisma.bookmark.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          postId: 'post-1',
        },
      });
    });

    it('should throw NotFoundError when post does not exist', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(bookmarkService.create('user-1', 'nonexistent'))
        .rejects.toThrow(NotFoundError);
      
      expect(mockPrisma.bookmark.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when bookmark already exists', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
      };

      const existingBookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        postId: 'post-1',
        createdAt: new Date(),
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.bookmark.findUnique.mockResolvedValue(existingBookmark);

      await expect(bookmarkService.create('user-1', 'post-1'))
        .rejects.toThrow(ConflictError);
      
      expect(mockPrisma.bookmark.create).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an existing bookmark', async () => {
      const existingBookmark = {
        id: 'bookmark-1',
        userId: 'user-1',
        postId: 'post-1',
        createdAt: new Date(),
      };

      mockPrisma.bookmark.findUnique.mockResolvedValue(existingBookmark);
      mockPrisma.bookmark.delete.mockResolvedValue(undefined);

      await bookmarkService.delete('user-1', 'post-1');

      expect(mockPrisma.bookmark.delete).toHaveBeenCalledWith({
        where: {
          userId_postId: {
            userId: 'user-1',
            postId: 'post-1',
          },
        },
      });
    });

    it('should throw NotFoundError when bookmark does not exist', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(null);

      await expect(bookmarkService.delete('user-1', 'nonexistent'))
        .rejects.toThrow(NotFoundError);
      
      expect(mockPrisma.bookmark.delete).not.toHaveBeenCalled();
    });
  });

  describe('isBookmarked', () => {
    it('should return true when bookmark exists', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue({
        id: 'bookmark-1',
        userId: 'user-1',
        postId: 'post-1',
      });

      const result = await bookmarkService.isBookmarked('user-1', 'post-1');

      expect(result).toBe(true);
    });

    it('should return false when bookmark does not exist', async () => {
      mockPrisma.bookmark.findUnique.mockResolvedValue(null);

      const result = await bookmarkService.isBookmarked('user-1', 'post-1');

      expect(result).toBe(false);
    });
  });

  describe('toggleBookmark', () => {
    it('should create bookmark when it does not exist', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.bookmark.findUnique.mockResolvedValue(null);
      mockPrisma.bookmark.create.mockResolvedValue({
        id: 'bookmark-1',
        userId: 'user-1',
        postId: 'post-1',
      });

      const result = await bookmarkService.toggleBookmark('user-1', 'post-1');

      expect(result.bookmarked).toBe(true);
      expect(result.message).toBe('Post bookmarked');
      expect(mockPrisma.bookmark.create).toHaveBeenCalled();
    });

    it('should delete bookmark when it exists', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
      };

      mockPrisma.post.findUnique.mockResolvedValue(mockPost);
      mockPrisma.bookmark.findUnique.mockResolvedValue({
        id: 'bookmark-1',
        userId: 'user-1',
        postId: 'post-1',
      });
      mockPrisma.bookmark.delete.mockResolvedValue(undefined);

      const result = await bookmarkService.toggleBookmark('user-1', 'post-1');

      expect(result.bookmarked).toBe(false);
      expect(result.message).toBe('Bookmark removed');
      expect(mockPrisma.bookmark.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundError when post does not exist', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(bookmarkService.toggleBookmark('user-1', 'nonexistent'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('listByUser', () => {
    it('should return list of bookmarks for user', async () => {
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
      ];

      mockPrisma.bookmark.findMany.mockResolvedValue(mockBookmarks);

      const result = await bookmarkService.listByUser('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('bookmark-1');
      expect(result[1].id).toBe('bookmark-2');
      expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when user has no bookmarks', async () => {
      mockPrisma.bookmark.findMany.mockResolvedValue([]);

      const result = await bookmarkService.listByUser('user-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getUserBookmarksWithPosts', () => {
    it('should return paginated bookmarks with post details', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          userId: 'user-1',
          postId: 'post-1',
          createdAt: new Date(),
          post: {
            id: 'post-1',
            title: 'Test Post 1',
            content: 'Content for post 1',
            createdAt: new Date(),
            category: {
              id: 'cat-1',
              name: 'General',
              slug: 'general',
            },
            tags: [],
            author: {
              id: 'author-1',
              profile: {
                username: 'testuser',
                avatarUrl: null,
              },
            },
            isAnonymous: false,
            _count: {
              comments: 5,
            },
          },
        },
      ];

      mockPrisma.bookmark.findMany.mockResolvedValue(mockBookmarks);
      mockPrisma.bookmark.count.mockResolvedValue(1);

      const result = await bookmarkService.getUserBookmarksWithPosts('user-1', 1, 20);

      expect(result.bookmarks).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.bookmarks[0].post.title).toBe('Test Post 1');
    });

    it('should handle anonymous posts', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          userId: 'user-1',
          postId: 'post-1',
          createdAt: new Date(),
          post: {
            id: 'post-1',
            title: 'Anonymous Post',
            content: 'Anonymous content',
            createdAt: new Date(),
            category: null,
            tags: [],
            author: {
              id: 'author-1',
              profile: {
                username: 'anonymous',
                avatarUrl: null,
              },
            },
            isAnonymous: true,
            _count: {
              comments: 0,
            },
          },
        },
      ];

      mockPrisma.bookmark.findMany.mockResolvedValue(mockBookmarks);
      mockPrisma.bookmark.count.mockResolvedValue(1);

      const result = await bookmarkService.getUserBookmarksWithPosts('user-1', 1, 20);

      expect(result.bookmarks[0].post.author).toBeNull();
    });

    it('should calculate pagination correctly', async () => {
      mockPrisma.bookmark.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.count.mockResolvedValue(50);

      const result = await bookmarkService.getUserBookmarksWithPosts('user-1', 2, 10);

      expect(result.pagination.total).toBe(50);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(5);
    });
  });
});
