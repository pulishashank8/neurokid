import { injectable, inject } from 'tsyringe';
import { PrismaClient, DailyWin as PrismaDailyWin, Prisma } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IDailyWinRepository, CreateDailyWinInput, UpdateDailyWinInput, ListDailyWinsQuery } from '@/domain/interfaces/repositories/IDailyWinRepository';
import { DailyWin, PaginatedResult } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class DailyWinRepository implements IDailyWinRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<DailyWin | null> {
    const win = await this.prisma.dailyWin.findUnique({
      where: { id },
    });
    return win ? this.toDomain(win) : null;
  }

  async findByIdAndUser(id: string, userId: string): Promise<DailyWin | null> {
    const win = await this.prisma.dailyWin.findFirst({
      where: { id, userId },
    });
    return win ? this.toDomain(win) : null;
  }

  async findByUserAndDate(userId: string, date: Date): Promise<DailyWin | null> {
    // Normalize date to start of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const win = await this.prisma.dailyWin.findFirst({
      where: {
        userId,
        date: startOfDay,
      },
    });
    return win ? this.toDomain(win) : null;
  }

  async list(query: ListDailyWinsQuery): Promise<PaginatedResult<DailyWin>> {
    const where: Prisma.DailyWinWhereInput = {
      userId: query.userId,
    };

    if (query.category) where.category = query.category;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = query.startDate;
      if (query.endDate) where.date.lte = query.endDate;
    }

    const [wins, total] = await Promise.all([
      this.prisma.dailyWin.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.dailyWin.count({ where }),
    ]);

    return {
      data: wins.map(w => this.toDomain(w)),
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + wins.length < total,
      },
    };
  }

  async create(data: CreateDailyWinInput): Promise<DailyWin> {
    // Normalize date to start of day
    const normalizedDate = new Date(data.date);
    normalizedDate.setHours(0, 0, 0, 0);

    const win = await this.prisma.dailyWin.create({
      data: {
        userId: data.userId,
        date: normalizedDate,
        content: data.content,
        mood: data.mood,
        category: data.category,
      },
    });
    return this.toDomain(win);
  }

  async update(id: string, userId: string, data: UpdateDailyWinInput): Promise<DailyWin> {
    const updateData: Prisma.DailyWinUpdateInput = {};

    if (data.content !== undefined) updateData.content = data.content;
    if (data.mood !== undefined) updateData.mood = data.mood;
    if (data.category !== undefined) updateData.category = data.category;

    const win = await this.prisma.dailyWin.update({
      where: { id, userId },
      data: updateData,
    });
    return this.toDomain(win);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.dailyWin.delete({
      where: { id, userId },
    });
  }

  async getCategories(userId: string): Promise<string[]> {
    const results = await this.prisma.dailyWin.findMany({
      where: { userId, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return results.map(r => r.category).filter((c): c is string => c !== null);
  }

  async getStreak(userId: string): Promise<number> {
    // Get all wins ordered by date descending
    const wins = await this.prisma.dailyWin.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
    });

    if (wins.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expectedDate = new Date(today);

    for (const win of wins) {
      const winDate = new Date(win.date);
      winDate.setHours(0, 0, 0, 0);

      // Check if this win is for the expected date or the day before expected
      const diffDays = Math.floor((expectedDate.getTime() - winDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (diffDays === 1 && streak === 0) {
        // Allow streak to start from yesterday
        streak++;
        expectedDate = new Date(winDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  private toDomain(win: PrismaDailyWin): DailyWin {
    return {
      id: win.id,
      userId: win.userId,
      date: win.date,
      content: win.content,
      mood: win.mood ?? undefined,
      category: win.category ?? undefined,
      createdAt: win.createdAt,
      updatedAt: win.updatedAt,
    };
  }
}
