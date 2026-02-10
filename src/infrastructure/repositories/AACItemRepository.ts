import { injectable, inject } from 'tsyringe';
import { PrismaClient, AACVocabulary as PrismaAACVocabulary, Prisma } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IAACItemRepository, CreateAACItemInput, UpdateAACItemInput, ListAACItemsQuery } from '@/domain/interfaces/repositories/IAACItemRepository';
import { AACItem, AACCategory } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class AACItemRepository implements IAACItemRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<AACItem | null> {
    const item = await this.prisma.aACVocabulary.findUnique({
      where: { id },
    });
    return item ? this.toDomain(item) : null;
  }

  async findByIdAndUser(id: string, userId: string): Promise<AACItem | null> {
    const item = await this.prisma.aACVocabulary.findFirst({
      where: { id, userId },
    });
    return item ? this.toDomain(item) : null;
  }

  async list(query: ListAACItemsQuery): Promise<AACItem[]> {
    const where: Prisma.AACVocabularyWhereInput = {
      userId: query.userId,
    };

    if (query.category) where.category = query.category;
    if (query.activeOnly) where.isActive = true;

    const items = await this.prisma.aACVocabulary.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    return items.map(i => this.toDomain(i));
  }

  async create(data: CreateAACItemInput): Promise<AACItem> {
    const item = await this.prisma.aACVocabulary.create({
      data: {
        userId: data.userId,
        label: data.label,
        symbol: data.symbol,
        category: data.category,
        audioText: data.audioText,
        order: data.order ?? 0,
      },
    });
    return this.toDomain(item);
  }

  async createMany(data: CreateAACItemInput[]): Promise<AACItem[]> {
    const items: AACItem[] = [];
    for (const d of data) {
      const item = await this.create(d);
      items.push(item);
    }
    return items;
  }

  async update(id: string, userId: string, data: UpdateAACItemInput): Promise<AACItem> {
    const item = await this.prisma.aACVocabulary.update({
      where: { id, userId },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.symbol !== undefined && { symbol: data.symbol }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.audioText !== undefined && { audioText: data.audioText }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return this.toDomain(item);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.aACVocabulary.delete({
      where: { id, userId },
    });
  }

  async reorder(userId: string, itemIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      itemIds.map((id, index) =>
        this.prisma.aACVocabulary.update({
          where: { id, userId },
          data: { order: index },
        })
      )
    );
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.aACVocabulary.count({
      where: { userId },
    });
  }

  private toDomain(item: PrismaAACVocabulary): AACItem {
    return {
      id: item.id,
      userId: item.userId,
      label: item.label,
      symbol: item.symbol,
      category: item.category as AACCategory,
      audioText: item.audioText ?? undefined,
      order: item.order,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
