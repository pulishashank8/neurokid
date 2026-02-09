/**
 * Therapy Session Service
 *
 * Business logic layer for therapy session management.
 * Orchestrates repository operations, authorization, and audit logging.
 */

import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/container";
import { ITherapySessionRepository } from "@/domain/interfaces/repositories/ITherapySessionRepository";
import { IAuditLogRepository } from "@/domain/interfaces/repositories/IAuditLogRepository";
import { createLogger } from "@/lib/logger";
import {
  NotFoundError,
  ValidationError,
} from "@/domain/errors";
import { sanitizationService } from "@/lib/sanitization";
import type {
  TherapySession,
  CreateTherapySessionInput,
  UpdateTherapySessionInput,
  TherapySessionFilters,
} from "@/domain/therapy-session.types";

const logger = createLogger({ context: 'TherapySessionService' });

@injectable()
export class TherapySessionService {
  private static readonly MAX_NOTES_LENGTH = 10000;
  private static readonly MAX_REFLECTION_LENGTH = 5000;

  constructor(
    @inject(TOKENS.TherapySessionRepository) private repo: ITherapySessionRepository,
    @inject(TOKENS.AuditLogRepository) private auditRepo: IAuditLogRepository
  ) {}

  /**
   * Create a new therapy session
   */
  async create(
    userId: string,
    input: Omit<CreateTherapySessionInput, 'userId'>
  ): Promise<TherapySession> {
    // Business validation
    this.validateInput(input);

    // Sanitize text fields to prevent XSS
    const sanitizedInput: CreateTherapySessionInput = {
      userId,
      ...input,
      childName: sanitizationService.sanitizeText(input.childName),
      therapistName: sanitizationService.sanitizeText(input.therapistName),
      notes: input.notes ? sanitizationService.sanitizeContent(input.notes) : undefined,
      wentWell: input.wentWell ? sanitizationService.sanitizeContent(input.wentWell) : undefined,
      toWorkOn: input.toWorkOn ? sanitizationService.sanitizeContent(input.toWorkOn) : undefined,
    };

    const session = await this.repo.create(sanitizedInput);

    // Audit log
    await this.auditRepo.create({
      userId,
      action: 'THERAPY_SESSION_CREATED',
      targetType: 'TherapySession',
      targetId: session.id,
    });

    logger.info({ userId, sessionId: session.id }, 'Therapy session created');

    return session;
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(
    userId: string,
    filters?: TherapySessionFilters
  ): Promise<{ sessions: TherapySession[]; total: number }> {
    const result = await this.repo.list({
      userId,
      childName: filters?.childName,
      therapyType: filters?.therapyType,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      limit: filters?.limit ?? 100,
      offset: filters?.offset ?? 0,
    });

    logger.info({ userId, count: result.data.length }, 'Retrieved therapy sessions');

    return { sessions: result.data, total: result.pagination.total ?? result.data.length };
  }

  /**
   * Get a single session
   */
  async getSession(
    sessionId: string,
    userId: string
  ): Promise<TherapySession> {
    const session = await this.repo.findByIdAndUser(sessionId, userId);

    if (!session) {
      throw new NotFoundError("TherapySession", sessionId);
    }

    await this.auditRepo.create({
      userId,
      action: 'THERAPY_SESSION_ACCESSED',
      targetType: 'TherapySession',
      targetId: sessionId,
    });

    return session;
  }

  /**
   * Get a single session by ID (alias for getSession to match interface)
   */
  async getById(
    id: string,
    userId: string
  ): Promise<TherapySession | null> {
    try {
      return await this.getSession(id, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * List therapy sessions (alias for getUserSessions to match interface)
   */
  async list(
    userId: string,
    input: TherapySessionFilters
  ): Promise<{ data: TherapySession[]; pagination: { total: number; limit: number; offset: number } }> {
    const result = await this.getUserSessions(userId, input);
    return {
      data: result.sessions,
      pagination: {
        total: result.total,
        limit: input.limit ?? 100,
        offset: input.offset ?? 0,
      },
    };
  }

  /**
   * Get all unique child names for a user
   */
  async getChildNames(userId: string): Promise<string[]> {
    const { sessions } = await this.getUserSessions(userId, { limit: 1000 });
    const uniqueNames = new Set(sessions.map(s => s.childName));
    return Array.from(uniqueNames).sort();
  }

  /**
   * Get all unique therapist names for a user
   */
  async getTherapistNames(userId: string): Promise<string[]> {
    const { sessions } = await this.getUserSessions(userId, { limit: 1000 });
    const uniqueNames = new Set(sessions.map(s => s.therapistName));
    return Array.from(uniqueNames).sort();
  }

  /**
   * Update a session
   */
  async update(
    sessionId: string,
    userId: string,
    input: UpdateTherapySessionInput
  ): Promise<TherapySession> {
    // Validate if any updatable fields are provided
    if (Object.keys(input).length === 0) {
      throw new ValidationError("No fields provided for update");
    }

    this.validateUpdateInput(input);

    // Sanitize text fields to prevent XSS
    const sanitizedInput: UpdateTherapySessionInput = {
      ...input,
      childName: input.childName ? sanitizationService.sanitizeText(input.childName) : undefined,
      therapistName: input.therapistName ? sanitizationService.sanitizeText(input.therapistName) : undefined,
      notes: input.notes !== undefined ? sanitizationService.sanitizeContent(input.notes) : undefined,
      wentWell: input.wentWell !== undefined ? sanitizationService.sanitizeContent(input.wentWell) : undefined,
      toWorkOn: input.toWorkOn !== undefined ? sanitizationService.sanitizeContent(input.toWorkOn) : undefined,
    };

    const session = await this.repo.update(
      sessionId,
      userId,
      sanitizedInput
    );

    if (!session) {
      throw new NotFoundError("TherapySession", sessionId);
    }

    await this.auditRepo.create({
      userId,
      action: 'THERAPY_SESSION_UPDATED',
      targetType: 'TherapySession',
      targetId: sessionId,
    });

    logger.info({ userId, sessionId }, 'Therapy session updated');

    return session;
  }

  /**
   * Delete a session
   */
  async delete(sessionId: string, userId: string): Promise<void> {
    const deleted = await this.repo.delete(sessionId, userId);

    if (!deleted) {
      throw new NotFoundError("TherapySession", sessionId);
    }

    await this.auditRepo.create({
      userId,
      action: 'THERAPY_SESSION_DELETED',
      targetType: 'TherapySession',
      targetId: sessionId,
    });

    logger.info({ userId, sessionId }, 'Therapy session deleted');
  }

  /**
   * Get therapy statistics for a user
   */
  async getStats(userId: string): Promise<{
    totalSessions: number;
    byTherapyType: Record<string, number>;
    byChild: Record<string, number>;
    averageMood: number | null;
  }> {
    const { sessions } = await this.getUserSessions(userId, { limit: 1000 });

    const byTherapyType: Record<string, number> = {};
    const byChild: Record<string, number> = {};
    let moodSum = 0;
    let moodCount = 0;

    for (const session of sessions) {
      // Count by therapy type
      byTherapyType[session.therapyType] =
        (byTherapyType[session.therapyType] || 0) + 1;

      // Count by child
      byChild[session.childName] = (byChild[session.childName] || 0) + 1;

      // Average mood
      if (session.mood !== null) {
        moodSum += session.mood;
        moodCount++;
      }
    }

    return {
      totalSessions: sessions.length,
      byTherapyType,
      byChild,
      averageMood: moodCount > 0 ? moodSum / moodCount : null,
    };
  }

  // Private validation methods

  private validateInput(input: Omit<CreateTherapySessionInput, 'userId'>): void {
    if (!input.childName?.trim()) {
      throw new ValidationError("Child name is required");
    }

    if (!input.therapistName?.trim()) {
      throw new ValidationError("Therapist name is required");
    }

    if (input.sessionDate > new Date()) {
      throw new ValidationError("Session date cannot be in the future");
    }

    if (input.notes && input.notes.length > TherapySessionService.MAX_NOTES_LENGTH) {
      throw new ValidationError(
        `Notes cannot exceed ${TherapySessionService.MAX_NOTES_LENGTH} characters`
      );
    }

    if (input.wentWell && input.wentWell.length > TherapySessionService.MAX_REFLECTION_LENGTH) {
      throw new ValidationError(
        `Went well cannot exceed ${TherapySessionService.MAX_REFLECTION_LENGTH} characters`
      );
    }

    if (
      input.toWorkOn &&
      input.toWorkOn.length > TherapySessionService.MAX_REFLECTION_LENGTH
    ) {
      throw new ValidationError(
        `To work on cannot exceed ${TherapySessionService.MAX_REFLECTION_LENGTH} characters`
      );
    }

    if (input.mood != null && (input.mood < 1 || input.mood > 5)) {
      throw new ValidationError("Mood must be between 1 and 5");
    }

    if (input.duration !== undefined && (input.duration < 1 || input.duration > 480)) {
      throw new ValidationError("Duration must be between 1 and 480 minutes");
    }
  }

  private validateUpdateInput(input: UpdateTherapySessionInput): void {
    if (input.notes != null && input.notes.length > TherapySessionService.MAX_NOTES_LENGTH) {
      throw new ValidationError(
        `Notes cannot exceed ${TherapySessionService.MAX_NOTES_LENGTH} characters`
      );
    }

    if (
      input.wentWell != null &&
      input.wentWell.length > TherapySessionService.MAX_REFLECTION_LENGTH
    ) {
      throw new ValidationError(
        `Went well cannot exceed ${TherapySessionService.MAX_REFLECTION_LENGTH} characters`
      );
    }

    if (
      input.toWorkOn != null &&
      input.toWorkOn.length > TherapySessionService.MAX_REFLECTION_LENGTH
    ) {
      throw new ValidationError(
        `To work on cannot exceed ${TherapySessionService.MAX_REFLECTION_LENGTH} characters`
      );
    }

    if (input.mood != null && (input.mood < 1 || input.mood > 5)) {
      throw new ValidationError("Mood must be between 1 and 5");
    }
  }
}
