import { injectable, inject } from 'tsyringe';
import { PrismaClient, Post as PrismaPost, Prisma } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IPostRepository, CreatePostInput, UpdatePostInput, ListPostsQuery, PostWithAuthor } from '@/domain/interfaces/repositories/IPostRepository';
import { Post, CursorPaginatedResult, PostStatus } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';
import { normalizeLimit } from '@/lib/validation';
import { CacheAsideService } from '@/lib/cache-aside';

@injectable()
export class PostRepository implements IPostRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<Post | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });
    return post ? this.toDomain(post) : null;
  }

  async findByIdWithAuthor(id: string): Promise<PostWithAuthor | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          include: { profile: true },
        },
        category: true,
        tags: true,
      },
    });

    if (!post) return null;

    return {
      post: this.toDomain(post),
      author: post.isAnonymous || !post.author ? null : {
        id: post.author.id,
        username: post.author.profile?.username ?? 'Unknown',
        displayName: post.author.profile?.displayName ?? 'Unknown',
        avatarUrl: post.author.profile?.avatarUrl ?? null,
        verifiedTherapist: post.author.profile?.verifiedTherapist ?? false,
      },
      category: post.category ? {
        id: post.category.id,
        name: post.category.name,
        slug: post.category.slug,
      } : null,
      tags: post.tags.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
      })),
    };
  }

  async list(query: ListPostsQuery): Promise<CursorPaginatedResult<Post>> {
    const limit = normalizeLimit(query.limit);
    const take = limit + 1;

    const where: Prisma.PostWhereInput = {};

    // Status filter - default to ACTIVE
    where.status = query.status ?? 'ACTIVE';

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.authorId) where.authorId = query.authorId;
    if (query.tag) {
      where.tags = { some: { slug: query.tag } };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
    switch (query.sort) {
      case 'top':
        orderBy = [{ voteScore: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'hot':
        // Hot = combination of recency and score
        orderBy = [{ voteScore: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'new':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const findManyArgs: Prisma.PostFindManyArgs = {
      where,
      orderBy,
      take,
    };

    if (query.cursor) {
      findManyArgs.cursor = { id: query.cursor };
      findManyArgs.skip = 1;
    }

    const posts = await this.prisma.post.findMany(findManyArgs);

    const hasMore = posts.length > limit;
    const data = posts.slice(0, limit);
    const nextCursor = hasMore && data.length > 0
      ? data[data.length - 1].id
      : undefined;

    return {
      data: data.map(p => this.toDomain(p)),
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    };
  }

  async listWithAuthors(query: ListPostsQuery): Promise<CursorPaginatedResult<PostWithAuthor>> {
    const limit = normalizeLimit(query.limit);
    const take = limit + 1;

    // Generate cache key from query params
    const cacheKey = {
      status: query.status ?? 'ACTIVE',
      categoryId: query.categoryId,
      authorId: query.authorId,
      tag: query.tag,
      search: query.search,
      sort: query.sort,
      cursor: query.cursor,
      limit,
    };

    // Cache feed queries for 30 seconds (volatile data)
    return CacheAsideService.get(
      'posts',
      cacheKey,
      async () => {
        const where: Prisma.PostWhereInput = {};
        where.status = query.status ?? 'ACTIVE';

        if (query.categoryId) where.categoryId = query.categoryId;
        if (query.authorId) where.authorId = query.authorId;
        if (query.tag) {
          where.tags = { some: { slug: query.tag } };
        }
        if (query.search) {
          where.OR = [
            { title: { contains: query.search, mode: 'insensitive' } },
            { content: { contains: query.search, mode: 'insensitive' } },
          ];
        }

        // Align orderBy with composite indexes for optimal performance
        let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[];
        switch (query.sort) {
          case 'top':
          case 'hot':
            // Uses idx_post_score_created composite index
            orderBy = [{ voteScore: 'desc' }, { createdAt: 'desc' }];
            break;
          case 'new':
          default:
            // Uses idx_post_status_created composite index
            orderBy = { createdAt: 'desc' };
            break;
        }

        const findManyArgs: Prisma.PostFindManyArgs = {
          where,
          orderBy,
          take,
          // OPTIMIZATION: Use select instead of include for better performance
          select: {
            id: true,
            title: true,
            content: true,
            authorId: true,
            isAnonymous: true,
            categoryId: true,
            status: true,
            viewCount: true,
            commentCount: true,
            voteScore: true,
            isPinned: true,
            isLocked: true,
            createdAt: true,
            updatedAt: true,
            images: true,
            // Nested select for author (only fetch needed fields)
            author: {
              select: {
                id: true,
                profile: {
                  select: {
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    verifiedTherapist: true,
                  },
                },
              },
            },
            // Nested select for category
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            // Nested select for tags
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        };

        if (query.cursor) {
          findManyArgs.cursor = { id: query.cursor };
          findManyArgs.skip = 1;
        }

        const posts = await this.prisma.post.findMany(findManyArgs);

        const hasMore = posts.length > limit;
        const data = posts.slice(0, limit);
        const nextCursor = hasMore && data.length > 0
          ? data[data.length - 1].id
          : undefined;

        return {
          data: data.map((p: any) => ({
            post: this.toDomain(p as PrismaPost),
            author: p.isAnonymous || !p.author ? null : {
              id: p.author.id,
              username: p.author.profile?.username ?? 'Unknown',
              displayName: p.author.profile?.displayName ?? 'Unknown',
              avatarUrl: p.author.profile?.avatarUrl ?? null,
              verifiedTherapist: p.author.profile?.verifiedTherapist ?? false,
            },
            category: p.category,
            tags: p.tags,
          })),
          pagination: {
            nextCursor,
            hasMore,
            limit,
          },
        };
      },
      { ttl: 30 } // 30 second cache for feed (volatile data)
    );
  }

  async create(data: CreatePostInput): Promise<Post> {
    const post = await this.prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: data.authorId,
        categoryId: data.categoryId,
        isAnonymous: data.isAnonymous ?? false,
        images: data.images ?? [],
        status: 'ACTIVE',
        ...(data.tagIds?.length ? {
          tags: { connect: data.tagIds.map(id => ({ id })) },
        } : {}),
      },
    });
    return this.toDomain(post);
  }

  async update(id: string, data: UpdatePostInput): Promise<Post> {
    const updateData: Prisma.PostUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
    if (data.isAnonymous !== undefined) updateData.isAnonymous = data.isAnonymous;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isPinned !== undefined) {
      updateData.isPinned = data.isPinned;
      updateData.pinnedAt = data.isPinned ? new Date() : null;
    }
    if (data.isLocked !== undefined) updateData.isLocked = data.isLocked;
    if (data.images !== undefined) updateData.images = data.images;

    const post = await this.prisma.post.update({
      where: { id },
      data: updateData,
    });
    return this.toDomain(post);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id } });
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async updateVoteScore(id: string, delta: number): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { voteScore: { increment: delta } },
    });
  }

  async updateCommentCount(id: string, delta: number): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { commentCount: { increment: delta } },
    });
  }

  async existsDuplicate(authorId: string, title: string, since: Date): Promise<boolean> {
    const count = await this.prisma.post.count({
      where: {
        authorId,
        title,
        createdAt: { gte: since },
      },
    });
    return count > 0;
  }

  async getAuthorId(postId: string): Promise<string | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    return post?.authorId ?? null;
  }

  private toDomain(post: PrismaPost): Post {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId ?? undefined,
      categoryId: post.categoryId,
      status: post.status as PostStatus,
      viewCount: post.viewCount,
      commentCount: post.commentCount,
      voteScore: post.voteScore,
      isAnonymous: post.isAnonymous,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      images: post.images,
    };
  }
}
