import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { IBookmarkService, Bookmark } from '@/domain/interfaces/services/IBookmarkService';
import { DatabaseConnection } from '@/infrastructure/database/DatabaseConnection';
import { ValidationError, NotFoundError, ConflictError } from '@/domain/errors';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'BookmarkService' });

interface FormattedBookmark {
  id: string;
  createdAt: Date;
  post: {
    id: string;
    title: string;
    snippet: string;
    createdAt: Date;
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
    tags: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
    author: {
      id: string;
      username: string;
      avatarUrl: string | null;
    } | null;
    commentCount: number;
  };
}

interface PaginatedBookmarksResult {
  bookmarks: FormattedBookmark[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@injectable()
export class BookmarkService implements IBookmarkService {
  constructor(
    @inject(TOKENS.DatabaseConnection) private db: DatabaseConnection
  ) {}

  async listByUser(userId: string): Promise<Bookmark[]> {
    const prisma = this.db.getClient();
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return bookmarks;
  }

  async getUserBookmarksWithPosts(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedBookmarksResult> {
    const prisma = this.db.getClient();
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        include: {
          post: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              tags: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              author: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      username: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  comments: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookmark.count({
        where: { userId },
      }),
    ]);

    const formattedBookmarks: FormattedBookmark[] = bookmarks.map((bookmark) => ({
      id: bookmark.id,
      createdAt: bookmark.createdAt,
      post: {
        id: bookmark.post.id,
        title: bookmark.post.title,
        snippet: bookmark.post.content.substring(0, 200) + (bookmark.post.content.length > 200 ? '...' : ''),
        createdAt: bookmark.post.createdAt,
        category: bookmark.post.category,
        tags: bookmark.post.tags,
        author: bookmark.post.isAnonymous || !bookmark.post.author
          ? null
          : {
              id: bookmark.post.author.id,
              username: bookmark.post.author.profile?.username || 'Unknown',
              avatarUrl: bookmark.post.author.profile?.avatarUrl || null,
            },
        commentCount: bookmark.post._count.comments,
      },
    }));

    return {
      bookmarks: formattedBookmarks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(userId: string, postId: string): Promise<Bookmark> {
    const prisma = this.db.getClient();

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundError('Post', postId);
    }

    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingBookmark) {
      throw new ConflictError('Bookmark already exists');
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        postId,
      },
    });

    logger.info({ userId, postId }, 'Bookmark created');
    return bookmark;
  }

  async delete(userId: string, postId: string): Promise<void> {
    const prisma = this.db.getClient();

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!existingBookmark) {
      throw new NotFoundError('Bookmark');
    }

    await prisma.bookmark.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    logger.info({ userId, postId }, 'Bookmark deleted');
  }

  async isBookmarked(userId: string, postId: string): Promise<boolean> {
    const prisma = this.db.getClient();
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
    return !!bookmark;
  }

  async toggleBookmark(
    userId: string,
    postId: string
  ): Promise<{ bookmarked: boolean; message: string }> {
    const prisma = this.db.getClient();

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundError('Post', postId);
    }

    // Check if bookmark exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      logger.info({ userId, postId }, 'Bookmark toggled off');
      return {
        bookmarked: false,
        message: 'Bookmark removed',
      };
    } else {
      // Create bookmark
      await prisma.bookmark.create({
        data: {
          userId,
          postId,
        },
      });

      logger.info({ userId, postId }, 'Bookmark toggled on');
      return {
        bookmarked: true,
        message: 'Post bookmarked',
      };
    }
  }
}
