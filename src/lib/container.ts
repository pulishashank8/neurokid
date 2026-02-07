import 'reflect-metadata';
import { container, Lifecycle } from 'tsyringe';

// Token registry for dependency injection
export const TOKENS = {
  // Database
  PrismaClient: Symbol('PrismaClient'),
  DatabaseConnection: Symbol('DatabaseConnection'),

  // Repositories
  UserRepository: Symbol('UserRepository'),
  PostRepository: Symbol('PostRepository'),
  CommentRepository: Symbol('CommentRepository'),
  ProfileRepository: Symbol('ProfileRepository'),
  TherapySessionRepository: Symbol('TherapySessionRepository'),
  EmergencyCardRepository: Symbol('EmergencyCardRepository'),
  NotificationRepository: Symbol('NotificationRepository'),
  MessageRepository: Symbol('MessageRepository'),
  ConnectionRepository: Symbol('ConnectionRepository'),
  ProviderRepository: Symbol('ProviderRepository'),
  AuditLogRepository: Symbol('AuditLogRepository'),
  CategoryRepository: Symbol('CategoryRepository'),
  TagRepository: Symbol('TagRepository'),
  VoteRepository: Symbol('VoteRepository'),
  DailyWinRepository: Symbol('DailyWinRepository'),
  AACItemRepository: Symbol('AACItemRepository'),
  ChatSessionRepository: Symbol('ChatSessionRepository'),

  // Services
  UserService: Symbol('UserService'),
  PostService: Symbol('PostService'),
  CommentService: Symbol('CommentService'),
  AuthService: Symbol('AuthService'),
  TherapySessionService: Symbol('TherapySessionService'),
  EmergencyCardService: Symbol('EmergencyCardService'),
  MessageService: Symbol('MessageService'),
  NotificationService: Symbol('NotificationService'),
  ModerationService: Symbol('ModerationService'),
  AIService: Symbol('AIService'),
  EmailService: Symbol('EmailService'),
  FileUploadService: Symbol('FileUploadService'),
  DailyWinService: Symbol('DailyWinService'),
  AACService: Symbol('AACService'),

  // Infrastructure
  Logger: Symbol('Logger'),
  CacheService: Symbol('CacheService'),
  RateLimiter: Symbol('RateLimiter'),
  RedisClient: Symbol('RedisClient'),
  JobQueue: Symbol('JobQueue'),
  EncryptionService: Symbol('EncryptionService'),
} as const;

export type TokenType = typeof TOKENS;
export type TokenKey = keyof TokenType;
export type TokenValue = TokenType[TokenKey];

export { container, Lifecycle };
