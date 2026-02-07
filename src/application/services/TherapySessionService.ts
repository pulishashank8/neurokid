import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { ITherapySessionService, CreateTherapySessionInput, UpdateTherapySessionInput, TherapySessionDTO, ListTherapySessionsInput } from '@/domain/interfaces/services/ITherapySessionService';
import { ITherapySessionRepository } from '@/domain/interfaces/repositories/ITherapySessionRepository';
import { ValidationError, NotFoundError } from '@/domain/errors';
import { TherapySession, PaginatedResult } from '@/domain/types';

@injectable()
export class TherapySessionService implements ITherapySessionService {
  constructor(
    @inject(TOKENS.TherapySessionRepository) private sessionRepo: ITherapySessionRepository
  ) {}

  async create(userId: string, input: CreateTherapySessionInput): Promise<TherapySessionDTO> {
    // Validate required fields
    if (!input.childName || input.childName.trim().length < 1) {
      throw new ValidationError('Child name is required', { childName: 'Required' });
    }
    if (!input.therapistName || input.therapistName.trim().length < 1) {
      throw new ValidationError('Therapist name is required', { therapistName: 'Required' });
    }
    if (!input.therapyType) {
      throw new ValidationError('Therapy type is required', { therapyType: 'Required' });
    }
    if (!input.sessionDate) {
      throw new ValidationError('Session date is required', { sessionDate: 'Required' });
    }

    // Validate duration if provided
    if (input.duration !== undefined && (input.duration < 1 || input.duration > 480)) {
      throw new ValidationError('Duration must be between 1 and 480 minutes', { duration: 'Invalid range' });
    }

    // Validate mood if provided
    if (input.mood !== undefined && (input.mood < 1 || input.mood > 5)) {
      throw new ValidationError('Mood must be between 1 and 5', { mood: 'Invalid range' });
    }

    const session = await this.sessionRepo.create({
      userId,
      childName: input.childName.trim(),
      therapistName: input.therapistName.trim(),
      therapyType: input.therapyType,
      sessionDate: new Date(input.sessionDate),
      duration: input.duration ?? 60,
      notes: input.notes?.trim(),
      wentWell: input.wentWell?.trim(),
      toWorkOn: input.toWorkOn?.trim(),
      mood: input.mood,
    });

    return this.toDTO(session);
  }

  async update(id: string, userId: string, input: UpdateTherapySessionInput): Promise<TherapySessionDTO> {
    const existing = await this.sessionRepo.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundError('Therapy session', id);
    }

    // Validate fields if provided
    if (input.childName !== undefined && input.childName.trim().length < 1) {
      throw new ValidationError('Child name cannot be empty', { childName: 'Required' });
    }
    if (input.therapistName !== undefined && input.therapistName.trim().length < 1) {
      throw new ValidationError('Therapist name cannot be empty', { therapistName: 'Required' });
    }
    if (input.duration !== undefined && (input.duration < 1 || input.duration > 480)) {
      throw new ValidationError('Duration must be between 1 and 480 minutes', { duration: 'Invalid range' });
    }
    if (input.mood !== undefined && (input.mood < 1 || input.mood > 5)) {
      throw new ValidationError('Mood must be between 1 and 5', { mood: 'Invalid range' });
    }

    const session = await this.sessionRepo.update(id, userId, {
      childName: input.childName?.trim(),
      therapistName: input.therapistName?.trim(),
      therapyType: input.therapyType,
      sessionDate: input.sessionDate ? new Date(input.sessionDate) : undefined,
      duration: input.duration,
      notes: input.notes?.trim(),
      wentWell: input.wentWell?.trim(),
      toWorkOn: input.toWorkOn?.trim(),
      mood: input.mood,
    });

    return this.toDTO(session);
  }

  async list(userId: string, input: ListTherapySessionsInput): Promise<PaginatedResult<TherapySessionDTO>> {
    const result = await this.sessionRepo.list({
      userId,
      childName: input.childName,
      therapyType: input.therapyType,
      startDate: input.startDate,
      endDate: input.endDate,
      limit: Math.min(Math.max(input.limit, 1), 100),
      offset: Math.max(input.offset, 0),
    });

    return {
      data: result.data.map(s => this.toDTO(s)),
      pagination: result.pagination,
    };
  }

  async getById(id: string, userId: string): Promise<TherapySessionDTO | null> {
    const session = await this.sessionRepo.findByIdAndUser(id, userId);
    return session ? this.toDTO(session) : null;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.sessionRepo.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundError('Therapy session', id);
    }

    await this.sessionRepo.delete(id, userId);
  }

  async getChildNames(userId: string): Promise<string[]> {
    return this.sessionRepo.getChildNames(userId);
  }

  async getTherapistNames(userId: string): Promise<string[]> {
    return this.sessionRepo.getTherapistNames(userId);
  }

  private toDTO(session: TherapySession): TherapySessionDTO {
    return {
      id: session.id,
      childName: session.childName,
      therapistName: session.therapistName,
      therapyType: session.therapyType,
      sessionDate: session.sessionDate,
      duration: session.duration,
      notes: session.notes,
      wentWell: session.wentWell,
      toWorkOn: session.toWorkOn,
      mood: session.mood,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
