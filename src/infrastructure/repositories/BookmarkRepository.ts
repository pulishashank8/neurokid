import { injectable, inject } from 'tsyringe';
import { PrismaClient, Bookmark as PrismaBookmark } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IBookmarkRepository, CreateBookmarkInput } from '@/domain/interfaces/repositories/IBookmarkRepository';
import { Bookmark } from '@/domain/interfaces/services/IBookmarkService';
import { IDatabaseConnection } from '../database/DatabaseConnection';
import { QUERY_LIMITS } from '@/lib/validation';

@injectable()
export class BookmarkRepository implements IBookmarkRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findByUserId(userId: string): Promise<Bookmark[]> {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: QUERY_LIMITS.MAX_LIMIT, // Prevent loading thousands of bookmarks
    });
    return bookmarks.map(bookmark => this.toDomain(bookmark));
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Bookmark | null> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
    return bookmark ? this.toDomain(bookmark) : null;
  }

  async create(data: CreateBookmarkInput): Promise<Bookmark> {
    const bookmark = await this.prisma.bookmark.create({
      data: {
        userId: data.userId,
        postId: data.postId,
      },
    });
    return this.toDomain(bookmark);
  }

  async delete(userId: string, postId: string): Promise<void> {
    await this.prisma.bookmark.deleteMany({
      where: {
        userId,
        postId,
      },
    });
  }

  async exists(userId: string, postId: string): Promise<boolean> {
    const count = await this.prisma.bookmark.count({
      where: {
        userId,
        postId,
      },
    });
    return count > 0;
  }

  private toDomain(bookmark: PrismaBookmark): Bookmark {
    return {
      id: bookmark.id,
      userId: bookmark.userId,
      postId: bookmark.postId,
      createdAt: bookmark.createdAt,
    };
  }
}
