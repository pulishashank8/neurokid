import { injectable, inject } from 'tsyringe';
import { PrismaClient, Comment as PrismaComment, Prisma } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { ICommentRepository, CreateCommentInput, UpdateCommentInput, ListCommentsQuery, CommentWithAuthor } from '@/domain/interfaces/repositories/ICommentRepository';
import { Comment, CommentStatus, PaginatedResult } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';
import { normalizeLimit } from '@/lib/validation';
import { CacheAsideService } from '@/lib/cache-aside';

@injectable()
export class CommentRepository implements ICommentRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<Comment | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });
    return comment ? this.toDomain(comment) : null;
  }

  async findByIdWithAuthor(id: string): Promise<CommentWithAuthor | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          include: { profile: true },
        },
        _count: {
          select: { childComments: true },
        },
      },
    });

    if (!comment) return null;

    return {
      comment: this.toDomain(comment),
      author: comment.isAnonymous ? null : {
        id: comment.author.id,
        username: comment.author.profile?.username ?? 'Unknown',
        displayName: comment.author.profile?.displayName ?? 'Unknown',
        avatarUrl: comment.author.profile?.avatarUrl ?? null,
        verifiedTherapist: comment.author.profile?.verifiedTherapist ?? false,
      },
      replyCount: comment._count.childComments,
    };
  }

  async list(query: ListCommentsQuery): Promise<PaginatedResult<CommentWithAuthor>> {
    const limit = normalizeLimit(query.limit);

    const where: Prisma.CommentWhereInput = {
      postId: query.postId,
      status: 'ACTIVE',
    };

    // If parentCommentId is null, we want top-level comments
    // If it's defined, we want replies to that comment
    if (query.parentCommentId === null) {
      where.parentCommentId = null;
    } else if (query.parentCommentId !== undefined) {
      where.parentCommentId = query.parentCommentId;
    }

    // OPTIMIZATION: Cache comment count for 5 minutes (reduces load on comment-heavy posts)
    const getCachedCount = async (): Promise<number> => {
      const countCacheKey = {
        postId: query.postId,
        parentCommentId: query.parentCommentId,
        status: 'ACTIVE',
      };

      return CacheAsideService.get(
        'comments',
        `count:${JSON.stringify(countCacheKey)}`,
        () => this.prisma.comment.count({ where }),
        { ttl: 300 } // 5 minute cache
      );
    };

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        // OPTIMIZATION: Use select instead of include for better performance
        select: {
          id: true,
          content: true,
          authorId: true,
          postId: true,
          parentCommentId: true,
          status: true,
          isAnonymous: true,
          voteScore: true,
          createdAt: true,
          updatedAt: true,
          // Nested select for author
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
          // Count only active child comments
          _count: {
            select: {
              childComments: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
        // Uses idx_comment_post_status_created composite index
        orderBy: { createdAt: 'asc' },
        skip: query.offset,
        take: limit,
      }),
      getCachedCount(),
    ]);

    return {
      data: comments.map(c => ({
        comment: this.toDomain(c as PrismaComment),
        author: c.isAnonymous ? null : {
          id: c.author.id,
          username: c.author.profile?.username ?? 'Unknown',
          displayName: c.author.profile?.displayName ?? 'Unknown',
          avatarUrl: c.author.profile?.avatarUrl ?? null,
          verifiedTherapist: c.author.profile?.verifiedTherapist ?? false,
        },
        replyCount: c._count.childComments,
      })),
      pagination: {
        total,
        limit,
        offset: query.offset,
        hasMore: query.offset + comments.length < total,
      },
    };
  }

  async create(data: CreateCommentInput): Promise<Comment> {
    const comment = await this.prisma.comment.create({
      data: {
        content: data.content,
        authorId: data.authorId,
        postId: data.postId,
        parentCommentId: data.parentCommentId,
        isAnonymous: data.isAnonymous ?? false,
      },
    });

    // Invalidate comment count cache for this post
    const countCacheKey = {
      postId: data.postId,
      parentCommentId: data.parentCommentId ?? null,
      status: 'ACTIVE',
    };
    await CacheAsideService.invalidate('comments', `count:${JSON.stringify(countCacheKey)}`);

    return this.toDomain(comment);
  }

  async update(id: string, data: UpdateCommentInput): Promise<Comment> {
    const updateData: Prisma.CommentUpdateInput = {};

    if (data.content !== undefined) updateData.content = data.content;
    if (data.status !== undefined) updateData.status = data.status;

    const comment = await this.prisma.comment.update({
      where: { id },
      data: updateData,
    });
    return this.toDomain(comment);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }

  async updateVoteScore(id: string, delta: number): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: { voteScore: { increment: delta } },
    });
  }

  async getAuthorId(commentId: string): Promise<string | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });
    return comment?.authorId ?? null;
  }

  async countByPostId(postId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { postId, status: 'ACTIVE' },
    });
  }

  private toDomain(comment: PrismaComment): Comment {
    return {
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      postId: comment.postId,
      parentCommentId: comment.parentCommentId ?? undefined,
      status: comment.status as CommentStatus,
      isAnonymous: comment.isAnonymous,
      voteScore: comment.voteScore,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
