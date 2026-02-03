/**
 * Therapy Session Service
 * 
 * Business logic layer for therapy session management.
 * Orchestrates repository operations, authorization, and audit logging.
 */

import { TherapySessionRepository } from "@/repositories/therapy-session.repository";
import { AuditLogger } from "@/lib/audit";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "@/domain/errors";
import type {
  TherapySession,
  CreateTherapySessionInput,
  UpdateTherapySessionInput,
  TherapySessionFilters,
} from "@/domain/therapy-session.types";

export class TherapySessionService {
  private static readonly MAX_NOTES_LENGTH = 10000;
  private static readonly MAX_REFLECTION_LENGTH = 5000;

  /**
   * Create a new therapy session
   */
  static async create(
    input: CreateTherapySessionInput
  ): Promise<TherapySession> {
    // Business validation
    this.validateInput(input);

    const session = await TherapySessionRepository.create(input);

    // Audit log
    await AuditLogger.log({
      action: "THERAPY_SESSION_CREATED",
      userId: input.userId,
      resourceType: "TherapySession",
      resourceId: session.id,
      metadata: {
        childName: input.childName,
        therapyType: input.therapyType,
        sessionDate: input.sessionDate.toISOString(),
      },
    });

    return session;
  }

  /**
   * Get all sessions for a user
   */
  static async getUserSessions(
    userId: string,
    filters?: TherapySessionFilters
  ): Promise<{ sessions: TherapySession[]; total: number }> {
    const [sessions, total] = await Promise.all([
      TherapySessionRepository.findByUserId(userId, filters),
      TherapySessionRepository.countByUserId(userId, filters),
    ]);

    // Audit log bulk access
    await AuditLogger.log({
      action: "THERAPY_SESSION_ACCESSED",
      userId,
      metadata: {
        count: sessions.length,
        filters: {
          childName: filters?.childName,
          therapyType: filters?.therapyType,
        },
      },
    });

    return { sessions, total };
  }

  /**
   * Get a single session
   */
  static async getSession(
    sessionId: string,
    userId: string
  ): Promise<TherapySession> {
    const session = await TherapySessionRepository.findById(sessionId, userId);

    if (!session) {
      throw new NotFoundError("TherapySession", sessionId);
    }

    await AuditLogger.log({
      action: "THERAPY_SESSION_ACCESSED",
      userId,
      resourceType: "TherapySession",
      resourceId: sessionId,
    });

    return session;
  }

  /**
   * Update a session
   */
  static async update(
    sessionId: string,
    userId: string,
    input: UpdateTherapySessionInput
  ): Promise<TherapySession> {
    // Validate if any updatable fields are provided
    if (Object.keys(input).length === 0) {
      throw new ValidationError("No fields provided for update");
    }

    this.validateUpdateInput(input);

    const session = await TherapySessionRepository.update(
      sessionId,
      userId,
      input
    );

    if (!session) {
      throw new NotFoundError("TherapySession", sessionId);
    }

    await AuditLogger.log({
      action: "THERAPY_SESSION_UPDATED",
      userId,
      resourceType: "TherapySession",
      resourceId: sessionId,
      metadata: {
        updatedFields: Object.keys(input),
      },
    });

    return session;
  }

  /**
   * Delete a session
   */
  static async delete(sessionId: string, userId: string): Promise<void> {
    const deleted = await TherapySessionRepository.delete(sessionId, userId);

    if (!deleted) {
      throw new NotFoundError("TherapySession", sessionId);
    }

    await AuditLogger.log({
      action: "THERAPY_SESSION_DELETED",
      userId,
      resourceType: "TherapySession",
      resourceId: sessionId,
    });
  }

  /**
   * Get therapy statistics for a user
   */
  static async getStats(userId: string): Promise<{
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

  private static validateInput(input: CreateTherapySessionInput): void {
    if (!input.childName?.trim()) {
      throw new ValidationError("Child name is required");
    }

    if (!input.therapistName?.trim()) {
      throw new ValidationError("Therapist name is required");
    }

    if (input.sessionDate > new Date()) {
      throw new ValidationError("Session date cannot be in the future");
    }

    if (input.notes && input.notes.length > this.MAX_NOTES_LENGTH) {
      throw new ValidationError(
        `Notes cannot exceed ${this.MAX_NOTES_LENGTH} characters`
      );
    }

    if (input.wentWell && input.wentWell.length > this.MAX_REFLECTION_LENGTH) {
      throw new ValidationError(
        `Went well cannot exceed ${this.MAX_REFLECTION_LENGTH} characters`
      );
    }

    if (
      input.toWorkOn &&
      input.toWorkOn.length > this.MAX_REFLECTION_LENGTH
    ) {
      throw new ValidationError(
        `To work on cannot exceed ${this.MAX_REFLECTION_LENGTH} characters`
      );
    }

    if (input.mood != null && (input.mood < 1 || input.mood > 5)) {
      throw new ValidationError("Mood must be between 1 and 5");
    }

    if (input.duration !== undefined && (input.duration < 1 || input.duration > 480)) {
      throw new ValidationError("Duration must be between 1 and 480 minutes");
    }
  }

  private static validateUpdateInput(input: UpdateTherapySessionInput): void {
    if (input.notes != null && input.notes.length > this.MAX_NOTES_LENGTH) {
      throw new ValidationError(
        `Notes cannot exceed ${this.MAX_NOTES_LENGTH} characters`
      );
    }

    if (
      input.wentWell != null &&
      input.wentWell.length > this.MAX_REFLECTION_LENGTH
    ) {
      throw new ValidationError(
        `Went well cannot exceed ${this.MAX_REFLECTION_LENGTH} characters`
      );
    }

    if (
      input.toWorkOn != null &&
      input.toWorkOn.length > this.MAX_REFLECTION_LENGTH
    ) {
      throw new ValidationError(
        `To work on cannot exceed ${this.MAX_REFLECTION_LENGTH} characters`
      );
    }

    if (input.mood != null && (input.mood < 1 || input.mood > 5)) {
      throw new ValidationError("Mood must be between 1 and 5");
    }
  }
}
