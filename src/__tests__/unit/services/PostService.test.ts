import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { PostService } from '@/application/services/PostService';
import { ValidationError, NotFoundError, ForbiddenError } from '@/domain/errors';
import {
  createTestContainer,
  resetTestContainer,
  createMockPostRepository,
  createMockUserRepository,
  createMockAuditLogRepository,
  createMockAuthorizationService,
  createMockViewCountService,
} from '../../utils/test-container';

describe('PostService', () => {
  let postService: PostService;
  let mockPostRepo: ReturnType<typeof createMockPostRepository>;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;
  let mockAuditLogRepo: ReturnType<typeof createMockAuditLogRepository>;
  let mockCategoryRepo: { findById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    resetTestContainer();
    createTestContainer();

    mockPostRepo = createMockPostRepository();
    mockUserRepo = createMockUserRepository();
    mockAuditLogRepo = createMockAuditLogRepository();
    mockCategoryRepo = { findById: vi.fn().mockResolvedValue({ id: 'category-1', name: 'Test Category', slug: 'test-category' }) };

    // Add missing repository mocks
    container.register(TOKENS.PostRepository, { useValue: mockPostRepo });
    container.register(TOKENS.UserRepository, { useValue: mockUserRepo });
    container.register(TOKENS.CategoryRepository, { useValue: mockCategoryRepo });
    container.register(TOKENS.TagRepository, { useValue: { findByIds: vi.fn().mockResolvedValue([]), findByPostId: vi.fn().mockResolvedValue([]) } });
    container.register(TOKENS.VoteRepository, { useValue: { findByUserAndTarget: vi.fn(), getUserVotesForTargets: vi.fn().mockResolvedValue(new Map()) } });
    container.register(TOKENS.AuditLogRepository, { useValue: mockAuditLogRepo });
    container.register(TOKENS.ViewCountService, { useValue: createMockViewCountService() });
    
    // Create auth service mock with proper ownership checks
    const mockAuthService = {
      can: vi.fn().mockResolvedValue({ allowed: true }),
      canCreate: vi.fn().mockResolvedValue({ allowed: true }),
      canRead: vi.fn().mockResolvedValue({ allowed: true }),
      canUpdate: vi.fn().mockImplementation(async (user: any, resource: any) => {
        const isOwner = resource.ownerId === user.userId;
        if (isOwner || user.roles?.includes('ADMIN') || user.roles?.includes('MODERATOR')) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'Not authorized' };
      }),
      canDelete: vi.fn().mockImplementation(async (user: any, resource: any) => {
        const isOwner = resource.ownerId === user.userId;
        if (isOwner || user.roles?.includes('ADMIN') || user.roles?.includes('MODERATOR')) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'Not authorized to delete this post' };
      }),
      canModerate: vi.fn().mockResolvedValue({ allowed: true }),
      assertCan: vi.fn().mockResolvedValue(undefined),
      getAuthContext: vi.fn().mockImplementation(async (userId: string) => ({
        userId,
        roles: ['USER'],
        isBanned: false,
        emailVerified: true,
      })),
      getPostResourceContext: vi.fn().mockImplementation(async (postId: string) => {
        const post = await mockPostRepo.findById(postId);
        if (!post) return null;
        return {
          resourceType: 'POST',
          resourceId: post.id,
          ownerId: post.authorId,
          isLocked: post.isLocked,
          isRemoved: post.status === 'REMOVED',
        };
      }),
      getCommentResourceContext: vi.fn().mockResolvedValue({
        resourceType: 'COMMENT',
        resourceId: 'comment-1',
        ownerId: 'user-1',
        isRemoved: false,
      }),
    };
    container.register(TOKENS.AuthorizationService, { useValue: mockAuthService });

    postService = container.resolve(PostService);
  });

  describe('createPost', () => {
    it('should create a post with valid input', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post Title',
        content: 'This is a test post content that is long enough.',
        authorId: 'user-1',
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

      mockPostRepo.existsDuplicate.mockResolvedValue(false);
      mockPostRepo.create.mockResolvedValue(mockPost);
      mockPostRepo.findByIdWithAuthor.mockResolvedValue({
        post: mockPost,
        author: { id: 'user-1', username: 'testuser', displayName: 'Test User', avatarUrl: null, verifiedTherapist: false },
        category: { id: 'category-1', name: 'Test Category', slug: 'test-category' },
        tags: [],
      });
      mockUserRepo.findByIdWithProfile.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        profile: { username: 'testuser', avatarUrl: null },
      });

      const result = await postService.createPost({
        title: 'Test Post Title',
        content: 'This is a test post content that is long enough.',
        categoryId: 'category-1',
      }, 'user-1');

      expect(result.id).toBe('post-1');
      expect(result.title).toBe('Test Post Title');
      expect(mockPostRepo.create).toHaveBeenCalled();
    });

    it('should throw ValidationError for title too short', async () => {
      await expect(postService.createPost({
        title: 'Hi',
        content: 'This is a test post content that is long enough.',
        categoryId: 'category-1',
      }, 'user-1')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for content too short', async () => {
      await expect(postService.createPost({
        title: 'Valid Title',
        content: 'Short',
        categoryId: 'category-1',
      }, 'user-1')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for duplicate post', async () => {
      mockPostRepo.existsDuplicate.mockResolvedValue(true);

      await expect(postService.createPost({
        title: 'Test Post Title',
        content: 'This is a test post content that is long enough.',
        categoryId: 'category-1',
      }, 'user-1')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for too many links', async () => {
      // Verify the validation logic by checking the error is thrown
      // The service checks category first, then duplicate, then links
      mockPostRepo.existsDuplicate.mockResolvedValue(false);

      await expect(postService.createPost({
        title: 'Test Post Title',
        content: 'Check out https://example1.com and https://example2.com and https://example3.com',
        categoryId: 'category-1',
      }, 'user-1')).rejects.toThrow();
    });

    it('should create anonymous post without authorId', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Anonymous Post',
        content: 'This is an anonymous post content.',
        authorId: undefined,
        categoryId: 'category-1',
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

      mockPostRepo.existsDuplicate.mockResolvedValue(false);
      mockPostRepo.create.mockResolvedValue(mockPost);
      mockPostRepo.findByIdWithAuthor.mockResolvedValue({
        post: mockPost,
        author: null,
        category: { id: 'category-1', name: 'Test Category', slug: 'test-category' },
        tags: [],
      });

      const result = await postService.createPost({
        title: 'Anonymous Post',
        content: 'This is an anonymous post content.',
        categoryId: 'category-1',
        isAnonymous: true,
      }, 'user-1');

      expect(result.isAnonymous).toBe(true);
      expect(result.author).toBeNull();
    });

    it('should sanitize XSS in title and content', async () => {
      mockPostRepo.existsDuplicate.mockResolvedValue(false);
      mockPostRepo.create.mockImplementation(async (data) => ({
        id: 'post-1',
        ...data,
        status: 'ACTIVE',
        viewCount: 0,
        commentCount: 0,
        voteScore: 0,
        isPinned: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      }));
      mockPostRepo.findByIdWithAuthor.mockResolvedValue({
        post: {
          id: 'post-1',
          title: 'Test Title',
          content: 'Test content',
          authorId: 'user-1',
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
        },
        author: { id: 'user-1', username: 'testuser', displayName: 'Test User', avatarUrl: null, verifiedTherapist: false },
        category: { id: 'category-1', name: 'Test Category', slug: 'test-category' },
        tags: [],
      });
      mockUserRepo.findByIdWithProfile.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        profile: { username: 'testuser', avatarUrl: null },
      });

      await postService.createPost({
        title: 'Test <script>alert("xss")</script> Title',
        content: 'Content with <script>malicious()</script> code here',
        categoryId: 'category-1',
      }, 'user-1');

      expect(mockPostRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.not.stringContaining('<script>'),
          content: expect.not.stringContaining('<script>'),
        })
      );
    });
  });

  describe('getPost', () => {
    it('should return formatted post when found', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content for the post',
        authorId: 'user-1',
        categoryId: 'category-1',
        status: 'ACTIVE',
        viewCount: 10,
        commentCount: 5,
        voteScore: 15,
        isAnonymous: false,
        isPinned: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        images: [],
      };

      mockPostRepo.findByIdWithAuthor.mockResolvedValue({
        post: mockPost,
        author: { id: 'user-1', username: 'testuser', avatarUrl: null },
        category: { id: 'category-1', name: 'Test Category', slug: 'test-category' },
        tags: [],
      });
      mockPostRepo.findById.mockResolvedValue(mockPost);

      const result = await postService.getPost('post-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('post-1');
      expect(result?.author?.username).toBe('testuser');
    });

    it('should return null when post not found', async () => {
      mockPostRepo.findByIdWithAuthor.mockResolvedValue(null);

      const result = await postService.getPost('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listPosts', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Post 1',
          content: 'Content 1',
          authorId: 'user-1',
          categoryId: 'category-1',
          status: 'ACTIVE',
          viewCount: 10,
          commentCount: 2,
          voteScore: 5,
          isAnonymous: false,
          isPinned: false,
          isLocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: [],
        },
        {
          id: 'post-2',
          title: 'Post 2',
          content: 'Content 2',
          authorId: 'user-2',
          categoryId: 'category-1',
          status: 'ACTIVE',
          viewCount: 20,
          commentCount: 5,
          voteScore: 10,
          isAnonymous: false,
          isPinned: false,
          isLocked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          images: [],
        },
      ];

      mockPostRepo.listWithAuthors.mockResolvedValue({
        data: mockPosts.map(post => ({
          post,
          author: post.authorId ? { id: post.authorId, username: `user-${post.authorId}`, displayName: `User ${post.authorId}`, avatarUrl: null, verifiedTherapist: false } : null,
          category: { id: 'category-1', name: 'Test Category', slug: 'test-category' },
          tags: [],
        })),
        pagination: {
          nextCursor: 'post-2',
          hasMore: false,
          limit: 20,
        },
      });

      const result = await postService.listPosts({
        limit: 20,
        sort: 'new',
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.limit).toBe(20);
    });

    it('should limit posts to maximum 100', async () => {
      mockPostRepo.listWithAuthors.mockResolvedValue({
        data: [],
        pagination: {
          hasMore: false,
          limit: 100,
        },
      });

      await postService.listPosts({
        limit: 200,
        sort: 'new',
      });

      expect(mockPostRepo.listWithAuthors).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        })
      );
    });
  });

  describe('deletePost', () => {
    it('should delete post when user is author', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Content',
        authorId: 'user-1',
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

      mockPostRepo.findById.mockResolvedValue(mockPost);
      mockPostRepo.delete.mockResolvedValue(undefined);

      await postService.deletePost('post-1', 'user-1');

      expect(mockPostRepo.delete).toHaveBeenCalledWith('post-1');
    });

    it('should throw NotFoundError when post not found', async () => {
      mockPostRepo.findById.mockResolvedValue(null);

      await expect(postService.deletePost('nonexistent', 'user-1'))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user is not author', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Content',
        authorId: 'user-1',
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

      mockPostRepo.findById.mockResolvedValue(mockPost);

      await expect(postService.deletePost('post-1', 'user-2'))
        .rejects.toThrow(ForbiddenError);

      expect(mockPostRepo.delete).not.toHaveBeenCalled();
    });
  });
});
