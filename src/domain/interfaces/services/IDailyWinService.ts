import { PaginatedResult } from '@/domain/types';

export interface CreateDailyWinInput {
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

export interface DailyWinDTO {
  id: string;
  date: Date;
  content: string;
  mood?: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListDailyWinsInput {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  limit: number;
  offset: number;
}

export interface IDailyWinService {
  create(userId: string, input: CreateDailyWinInput): Promise<DailyWinDTO>;
  update(id: string, userId: string, input: UpdateDailyWinInput): Promise<DailyWinDTO>;
  list(userId: string, input: ListDailyWinsInput): Promise<PaginatedResult<DailyWinDTO>>;
  getById(id: string, userId: string): Promise<DailyWinDTO | null>;
  getByDate(userId: string, date: Date): Promise<DailyWinDTO | null>;
  delete(id: string, userId: string): Promise<void>;
  getCategories(userId: string): Promise<string[]>;
  getStreak(userId: string): Promise<number>;
}
