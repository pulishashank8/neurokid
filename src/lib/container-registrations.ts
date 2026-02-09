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
import { MessageRepository } from '@/infrastructure/repositories/MessageRepository';
import { ConnectionRepository } from '@/infrastructure/repositories/ConnectionRepository';
import { ProviderRepository } from '@/infrastructure/repositories/ProviderRepository';
import { BookmarkRepository } from '@/infrastructure/repositories/BookmarkRepository';

// Services
import { UserService } from '@/application/services/UserService';
import { PostService } from '@/application/services/PostService';
import { CommentService } from '@/application/services/CommentService';
import { VoteService } from '@/application/services/VoteService';
import { TherapySessionService } from '@/application/services/TherapySessionService';
import { EmergencyCardService } from '@/application/services/EmergencyCardService';
import { DailyWinService } from '@/application/services/DailyWinService';
import { NotificationService } from '@/application/services/NotificationService';
import { EncryptionService } from '@/application/services/EncryptionService';
import { MessageService } from '@/application/services/MessageService';
import { AuthorizationService } from '@/application/services/AuthorizationService';
import { BookmarkService } from '@/application/services/BookmarkService';
import { AIService } from '@/application/services/AIService';
import { ConnectionService } from '@/application/services/ConnectionService';
import { ViewCountService } from '@/application/services/ViewCountService';
import { DataGovernanceService } from '@/application/services/DataGovernanceService';
import { UserServiceLegacy } from '@/application/services/UserServiceLegacy';

// Infrastructure
import { BullQueue } from '@/infrastructure/queue/BullQueue';
import { getRedisClient } from '@/lib/rate-limit';

/**
 * Check if a token is already registered in the container
 */
function isRegistered(token: symbol): boolean {
  try {
    // Try to resolve the token - if it throws, it's not registered
    container.resolve(token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Register all dependencies in the DI container.
 * This function is idempotent - calling it multiple times is safe.
 */
export function registerDependencies(): void {
  // Database - Singleton to reuse connection
  if (!isRegistered(TOKENS.DatabaseConnection)) {
    container.register(
      TOKENS.DatabaseConnection,
      { useClass: DatabaseConnection },
      { lifecycle: Lifecycle.Singleton }
    );
  }

  // Repositories - Transient by default (new instance per resolve)
  const repositories = [
    { token: TOKENS.UserRepository, useClass: UserRepository },
    { token: TOKENS.ProfileRepository, useClass: ProfileRepository },
    { token: TOKENS.PostRepository, useClass: PostRepository },
    { token: TOKENS.CommentRepository, useClass: CommentRepository },
    { token: TOKENS.TherapySessionRepository, useClass: TherapySessionRepository },
    { token: TOKENS.EmergencyCardRepository, useClass: EmergencyCardRepository },
    { token: TOKENS.DailyWinRepository, useClass: DailyWinRepository },
    { token: TOKENS.NotificationRepository, useClass: NotificationRepository },
    { token: TOKENS.VoteRepository, useClass: VoteRepository },
    { token: TOKENS.CategoryRepository, useClass: CategoryRepository },
    { token: TOKENS.TagRepository, useClass: TagRepository },
    { token: TOKENS.AACItemRepository, useClass: AACItemRepository },
    { token: TOKENS.AuditLogRepository, useClass: AuditLogRepository },
    { token: TOKENS.MessageRepository, useClass: MessageRepository },
    { token: TOKENS.ConnectionRepository, useClass: ConnectionRepository },
    { token: TOKENS.ProviderRepository, useClass: ProviderRepository },
    { token: TOKENS.BookmarkRepository, useClass: BookmarkRepository },
  ];

  for (const { token, useClass } of repositories) {
    if (!isRegistered(token)) {
      (container as any).register(token, { useClass });
    }
  }

  // Services
  const services = [
    { token: TOKENS.UserService, useClass: UserService },
    { token: TOKENS.PostService, useClass: PostService },
    { token: TOKENS.CommentService, useClass: CommentService },
    { token: TOKENS.VoteService, useClass: VoteService },
    { token: TOKENS.TherapySessionService, useClass: TherapySessionService },
    { token: TOKENS.EmergencyCardService, useClass: EmergencyCardService },
    { token: TOKENS.DailyWinService, useClass: DailyWinService },
    { token: TOKENS.NotificationService, useClass: NotificationService },
    { token: TOKENS.EncryptionService, useClass: EncryptionService },
    { token: TOKENS.AuthorizationService, useClass: AuthorizationService },
    { token: TOKENS.BookmarkService, useClass: BookmarkService },
    { token: TOKENS.MessageService, useClass: MessageService },
    { token: TOKENS.ConnectionService, useClass: ConnectionService },
    { token: TOKENS.AIService, useClass: AIService },
    { token: TOKENS.ViewCountService, useClass: ViewCountService },
    { token: TOKENS.DataGovernanceService, useClass: DataGovernanceService },
  ];

  for (const { token, useClass } of services) {
    if (!isRegistered(token)) {
      (container as any).register(token, { useClass });
    }
  }

  // Infrastructure
  if (!isRegistered(TOKENS.JobQueue)) {
    container.register(TOKENS.JobQueue, { useClass: BullQueue }, { lifecycle: Lifecycle.Singleton });
  }

  // Redis Client - Singleton for connection reuse (manual singleton pattern)
  if (!isRegistered(TOKENS.RedisClient)) {
    // Use a module-level variable to ensure singleton behavior
    let redisClientInstance: any = null;
    
    (container as any).register(TOKENS.RedisClient, {
      useFactory: async () => {
        // Return cached instance if available
        if (redisClientInstance) {
          return redisClientInstance;
        }
        
        const client = await getRedisClient();
        redisClientInstance = client || { 
          // Fallback mock Redis for when Redis is unavailable
          incr: () => Promise.resolve(1),
          decr: () => Promise.resolve(0),
          get: () => Promise.resolve('0'),
          set: () => Promise.resolve('OK'),
          del: () => Promise.resolve(1),
          sadd: () => Promise.resolve(1),
          srem: () => Promise.resolve(1),
          smembers: () => Promise.resolve([]),
          expire: () => Promise.resolve(1),
        };
        return redisClientInstance;
      }
    }); // Note: No lifecycle option - tsyringe doesn't support it with useFactory
  }
}

/**
 * Reset the container - useful for testing
 */
export function resetContainer(): void {
  container.clearInstances();
  // Note: tsyringe doesn't have a way to unregister tokens,
  // so we rely on the isRegistered check to handle re-registration
}

/**
 * Check if all dependencies are registered
 */
export function verifyDependencies(): { registered: symbol[]; missing: symbol[] } {
  const allTokens = [
    TOKENS.DatabaseConnection,
    TOKENS.UserRepository,
    TOKENS.ProfileRepository,
    TOKENS.PostRepository,
    TOKENS.CommentRepository,
    TOKENS.TherapySessionRepository,
    TOKENS.EmergencyCardRepository,
    TOKENS.DailyWinRepository,
    TOKENS.NotificationRepository,
    TOKENS.VoteRepository,
    TOKENS.CategoryRepository,
    TOKENS.TagRepository,
    TOKENS.AACItemRepository,
    TOKENS.AuditLogRepository,
    TOKENS.MessageRepository,
    TOKENS.ConnectionRepository,
    TOKENS.ProviderRepository,

    TOKENS.UserService,
    TOKENS.PostService,
    TOKENS.CommentService,
    TOKENS.VoteService,
    TOKENS.TherapySessionService,
    TOKENS.EmergencyCardService,
    TOKENS.DailyWinService,
    TOKENS.NotificationService,
    TOKENS.EncryptionService,
    TOKENS.AuthorizationService,
    TOKENS.BookmarkService,
    TOKENS.JobQueue,
  ];

  const registered: symbol[] = [];
  const missing: symbol[] = [];

  for (const token of allTokens) {
    if (isRegistered(token)) {
      registered.push(token);
    } else {
      missing.push(token);
    }
  }

  return { registered, missing };
}
