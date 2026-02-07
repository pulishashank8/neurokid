import { injectable, inject } from 'tsyringe';
import { PrismaClient, Tag as PrismaTag } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { ITagRepository, CreateTagInput, UpdateTagInput } from '@/domain/interfaces/repositories/ITagRepository';
import { Tag } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class TagRepository implements ITagRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<Tag | null> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });
    return tag ? this.toDomain(tag) : null;
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
    });
    return tag ? this.toDomain(tag) : null;
  }

  async findByIds(ids: string[]): Promise<Tag[]> {
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: ids } },
    });
    return tags.map(t => this.toDomain(t));
  }

  async findAll(): Promise<Tag[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
    return tags.map(t => this.toDomain(t));
  }

  async findByPostId(postId: string): Promise<Tag[]> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { tags: true },
    });
    return post?.tags.map(t => this.toDomain(t)) ?? [];
  }

  async create(data: CreateTagInput): Promise<Tag> {
    const tag = await this.prisma.tag.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        color: data.color,
      },
    });
    return this.toDomain(tag);
  }

  async update(id: string, data: UpdateTagInput): Promise<Tag> {
    const tag = await this.prisma.tag.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
    return this.toDomain(tag);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tag.delete({ where: { id } });
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: Record<string, unknown> = { slug };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const count = await this.prisma.tag.count({ where });
    return count > 0;
  }

  async getPopular(limit: number): Promise<Array<Tag & { count: number }>> {
    const tags = await this.prisma.tag.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        posts: { _count: 'desc' },
      },
      take: limit,
    });

    return tags.map(t => ({
      ...this.toDomain(t),
      count: t._count.posts,
    }));
  }

  private toDomain(tag: PrismaTag): Tag {
    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description ?? undefined,
      color: tag.color ?? undefined,
    };
  }
}
