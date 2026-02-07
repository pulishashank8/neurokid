import { DailyWin, PaginatedResult } from '@/domain/types';

export interface CreateDailyWinInput {
  userId: string;
  date: Date;
  content: string;
  mood?: number;
  category?: string;
}

export interface UpdateDailyWinInput {
  content?: string;
  mood?: number;
  category?: string;
}

export interface ListDailyWinsQuery {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  limit: number;
  offset: number;
}

export interface IDailyWinRepository {
  findById(id: string): Promise<DailyWin | null>;
  findByIdAndUser(id: string, userId: string): Promise<DailyWin | null>;
  findByUserAndDate(userId: string, date: Date): Promise<DailyWin | null>;
  list(query: ListDailyWinsQuery): Promise<PaginatedResult<DailyWin>>;
  create(data: CreateDailyWinInput): Promise<DailyWin>;
  update(id: string, userId: string, data: UpdateDailyWinInput): Promise<DailyWin>;
  delete(id: string, userId: string): Promise<void>;
  getCategories(userId: string): Promise<string[]>;
  getStreak(userId: string): Promise<number>;
}
