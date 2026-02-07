import 'reflect-metadata';
import { container, Lifecycle } from 'tsyringe';
import { TOKENS } from './container';

// Database
import { DatabaseConnection } from '@/infrastructure/database/DatabaseConnection';

// Repositories
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { ProfileRepository } from '@/infrastructure/repositories/ProfileRepository';
import { PostRepository } from '@/infrastructure/repositories/PostRepository';
import { CommentRepository } from '@/infrastructure/repositories/CommentRepository';
import { TherapySessionRepository } from '@/infrastructure/repositories/TherapySessionRepository';
import { EmergencyCardRepository } from '@/infrastructure/repositories/EmergencyCardRepository';
import { DailyWinRepository } from '@/infrastructure/repositories/DailyWinRepository';
import { NotificationRepository } from '@/infrastructure/repositories/NotificationRepository';
import { VoteRepository } from '@/infrastructure/repositories/VoteRepository';
import { CategoryRepository } from '@/infrastructure/repositories/CategoryRepository';
import { TagRepository } from '@/infrastructure/repositories/TagRepository';
import { AACItemRepository } from '@/infrastructure/repositories/AACItemRepository';
import { AuditLogRepository } from '@/infrastructure/repositories/AuditLogRepository';

// Services
import { UserService } from '@/application/services/UserService';
import { PostService } from '@/application/services/PostService';
import { CommentService } from '@/application/services/CommentService';
import { TherapySessionService } from '@/application/services/TherapySessionService';
import { EmergencyCardService } from '@/application/services/EmergencyCardService';
import { DailyWinService } from '@/application/services/DailyWinService';
import { NotificationService } from '@/application/services/NotificationService';
import { EncryptionService } from '@/application/services/EncryptionService';

let isRegistered = false;

export function registerDependencies(): void {
  if (isRegistered) {
    return;
  }

  // Database - Singleton to reuse connection
  container.register(TOKENS.DatabaseConnection, {
    useClass: DatabaseConnection,
  }, { lifecycle: Lifecycle.Singleton });

  // Repositories - Transient by default (new instance per resolve)
  container.register(TOKENS.UserRepository, { useClass: UserRepository });
  container.register(TOKENS.ProfileRepository, { useClass: ProfileRepository });
  container.register(TOKENS.PostRepository, { useClass: PostRepository });
  container.register(TOKENS.CommentRepository, { useClass: CommentRepository });
  container.register(TOKENS.TherapySessionRepository, { useClass: TherapySessionRepository });
  container.register(TOKENS.EmergencyCardRepository, { useClass: EmergencyCardRepository });
  container.register(TOKENS.DailyWinRepository, { useClass: DailyWinRepository });
  container.register(TOKENS.NotificationRepository, { useClass: NotificationRepository });
  container.register(TOKENS.VoteRepository, { useClass: VoteRepository });
  container.register(TOKENS.CategoryRepository, { useClass: CategoryRepository });
  container.register(TOKENS.TagRepository, { useClass: TagRepository });
  container.register(TOKENS.AACItemRepository, { useClass: AACItemRepository });
  container.register(TOKENS.AuditLogRepository, { useClass: AuditLogRepository });

  // Services
  container.register(TOKENS.UserService, { useClass: UserService });
  container.register(TOKENS.PostService, { useClass: PostService });
  container.register(TOKENS.CommentService, { useClass: CommentService });
  container.register(TOKENS.TherapySessionService, { useClass: TherapySessionService });
  container.register(TOKENS.EmergencyCardService, { useClass: EmergencyCardService });
  container.register(TOKENS.DailyWinService, { useClass: DailyWinService });
  container.register(TOKENS.NotificationService, { useClass: NotificationService });
  container.register(TOKENS.EncryptionService, { useClass: EncryptionService });

  isRegistered = true;
}

export function resetContainer(): void {
  container.clearInstances();
  isRegistered = false;
}
