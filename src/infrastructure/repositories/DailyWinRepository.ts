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

    const limit = Math.min(query.limit || 20, 100);
    const take = limit + 1; // Fetch one extra to determine hasMore

    // Support both cursor and offset pagination for backward compatibility
    const findManyArgs: Prisma.DailyWinFindManyArgs = {
      where,
      orderBy: { date: 'desc' },
      take,
    };

    if (query.cursor) {
      // Cursor-based pagination (preferred)
      findManyArgs.cursor = { id: query.cursor };
      findManyArgs.skip = 1;
    } else if (query.offset !== undefined) {
      // Offset pagination (backward compatibility)
      findManyArgs.skip = query.offset;
    }

    const [wins, total] = await Promise.all([
      this.prisma.dailyWin.findMany(findManyArgs),
      query.cursor ? Promise.resolve(0) : this.prisma.dailyWin.count({ where }), // Skip count for cursor pagination
    ]);

    const hasMore = wins.length > limit;
    const data = wins.slice(0, limit);

    return {
      data: data.map(w => this.toDomain(w)),
      pagination: {
        total: query.cursor ? 0 : total, // Total not available in cursor mode
        limit,
        offset: query.offset || 0,
        hasMore,
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
    // OPTIMIZATION (Phase 7.2.6): Only fetch last 365 days (max possible streak)
    // This prevents loading ALL wins into memory for users with years of data
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const wins = await this.prisma.dailyWin.findMany({
      where: {
        userId,
        date: { gte: oneYearAgo }
      },
      select: { date: true },
      orderBy: { date: 'desc' },
      take: 365 // Hard limit - max possible streak
    });

    if (wins.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expectedDate = new Date(today);

    // Check if there's a win today or yesterday (streak is still active)
    const mostRecentWin = new Date(wins[0].date);
    mostRecentWin.setHours(0, 0, 0, 0);
    const daysSinceLastWin = Math.floor((today.getTime() - mostRecentWin.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastWin > 1) {
      return 0; // Streak broken - no win today or yesterday
    }

    // If last win was yesterday, start from yesterday
    if (daysSinceLastWin === 1) {
      expectedDate.setDate(expectedDate.getDate() - 1);
    }

    // Count consecutive days backwards
    for (const win of wins) {
      const winDate = new Date(win.date);
      winDate.setHours(0, 0, 0, 0);

      if (winDate.getTime() === expectedDate.getTime()) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (winDate.getTime() < expectedDate.getTime()) {
        // Gap found - streak broken
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
