import { injectable, inject } from 'tsyringe';
import { PrismaClient, Category as PrismaCategory } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { ICategoryRepository, CreateCategoryInput, UpdateCategoryInput } from '@/domain/interfaces/repositories/ICategoryRepository';
import { Category } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class CategoryRepository implements ICategoryRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    return category ? this.toDomain(category) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });
    return category ? this.toDomain(category) : null;
  }

  async findAll(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { order: 'asc' },
    });
    return categories.map(c => this.toDomain(c));
  }

  async create(data: CreateCategoryInput): Promise<Category> {
    const category = await this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        order: data.order ?? 0,
      },
    });
    return this.toDomain(category);
  }

  async update(id: string, data: UpdateCategoryInput): Promise<Category> {
    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });
    return this.toDomain(category);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: Record<string, unknown> = { slug };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }
    const count = await this.prisma.category.count({ where });
    return count > 0;
  }

  private toDomain(category: PrismaCategory): Category {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? undefined,
      icon: category.icon ?? undefined,
      order: category.order,
    };
  }
}
