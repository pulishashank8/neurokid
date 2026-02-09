import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { IDailyWinService, CreateDailyWinInput, UpdateDailyWinInput, DailyWinDTO, ListDailyWinsInput } from '@/domain/interfaces/services/IDailyWinService';
import { IDailyWinRepository } from '@/domain/interfaces/repositories/IDailyWinRepository';
import { ValidationError, NotFoundError, ConflictError } from '@/domain/errors';
import { DailyWin, PaginatedResult } from '@/domain/types';
import { sanitizationService } from '@/lib/sanitization';

@injectable()
export class DailyWinService implements IDailyWinService {
  constructor(
    @inject(TOKENS.DailyWinRepository) private winRepo: IDailyWinRepository
  ) {}

  async create(userId: string, input: CreateDailyWinInput): Promise<DailyWinDTO> {
    // Validate required fields
    if (!input.content || input.content.trim().length < 1) {
      throw new ValidationError('Content is required', { content: 'Required' });
    }
    if (input.content.length > 1000) {
      throw new ValidationError('Content is too long', { content: 'Maximum 1000 characters' });
    }

    if (!input.date) {
      throw new ValidationError('Date is required', { date: 'Required' });
    }

    // Validate mood if provided
    if (input.mood !== undefined && (input.mood < 1 || input.mood > 5)) {
      throw new ValidationError('Mood must be between 1 and 5', { mood: 'Invalid range' });
    }

    // Validate category if provided
    if (input.category && input.category.length > 50) {
      throw new ValidationError('Category is too long', { category: 'Maximum 50 characters' });
    }

    // Check for existing entry on this date
    const normalizedDate = new Date(input.date);
    normalizedDate.setHours(0, 0, 0, 0);

    const existing = await this.winRepo.findByUserAndDate(userId, normalizedDate);
    if (existing) {
      throw new ConflictError('A daily win already exists for this date');
    }

    const win = await this.winRepo.create({
      userId,
      date: normalizedDate,
      content: sanitizationService.sanitizeContent(input.content.trim()),
      mood: input.mood,
      category: input.category ? sanitizationService.sanitizeText(input.category.trim()) : undefined,
    });

    return this.toDTO(win);
  }

  async update(id: string, userId: string, input: UpdateDailyWinInput): Promise<DailyWinDTO> {
    const existing = await this.winRepo.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundError('Daily win', id);
    }

    // Validate fields if provided
    if (input.content !== undefined) {
      if (input.content.trim().length < 1) {
        throw new ValidationError('Content cannot be empty', { content: 'Required' });
      }
      if (input.content.length > 1000) {
        throw new ValidationError('Content is too long', { content: 'Maximum 1000 characters' });
      }
    }

    if (input.mood !== undefined && (input.mood < 1 || input.mood > 5)) {
      throw new ValidationError('Mood must be between 1 and 5', { mood: 'Invalid range' });
    }

    if (input.category !== undefined && input.category.length > 50) {
      throw new ValidationError('Category is too long', { category: 'Maximum 50 characters' });
    }

    const win = await this.winRepo.update(id, userId, {
      content: input.content ? sanitizationService.sanitizeContent(input.content.trim()) : undefined,
      mood: input.mood,
      category: input.category ? sanitizationService.sanitizeText(input.category.trim()) : undefined,
    });

    return this.toDTO(win);
  }

  async list(userId: string, input: ListDailyWinsInput): Promise<PaginatedResult<DailyWinDTO>> {
    const result = await this.winRepo.list({
      userId,
      startDate: input.startDate,
      endDate: input.endDate,
      category: input.category,
      limit: Math.min(Math.max(input.limit, 1), 100),
      offset: Math.max(input.offset, 0),
    });

    return {
      data: result.data.map(w => this.toDTO(w)),
      pagination: result.pagination,
    };
  }

  async getById(id: string, userId: string): Promise<DailyWinDTO | null> {
    const win = await this.winRepo.findByIdAndUser(id, userId);
    return win ? this.toDTO(win) : null;
  }

  async getByDate(userId: string, date: Date): Promise<DailyWinDTO | null> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const win = await this.winRepo.findByUserAndDate(userId, normalizedDate);
    return win ? this.toDTO(win) : null;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.winRepo.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundError('Daily win', id);
    }

    await this.winRepo.delete(id, userId);
  }

  async getCategories(userId: string): Promise<string[]> {
    return this.winRepo.getCategories(userId);
  }

  async getStreak(userId: string): Promise<number> {
    return this.winRepo.getStreak(userId);
  }

  private toDTO(win: DailyWin): DailyWinDTO {
    return {
      id: win.id,
      date: win.date,
      content: win.content,
      mood: win.mood,
      category: win.category,
      createdAt: win.createdAt,
      updatedAt: win.updatedAt,
    };
  }
}
