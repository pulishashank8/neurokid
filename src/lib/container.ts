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
  BookmarkRepository: Symbol('BookmarkRepository'),

  // Services
  UserService: Symbol('UserService'),
  PostService: Symbol('PostService'),
  CommentService: Symbol('CommentService'),
  VoteService: Symbol('VoteService'),
  AuthService: Symbol('AuthService'),
  AuthorizationService: Symbol('AuthorizationService'),
  TherapySessionService: Symbol('TherapySessionService'),
  EmergencyCardService: Symbol('EmergencyCardService'),
  MessageService: Symbol('MessageService'),
  NotificationService: Symbol('NotificationService'),
  ModerationService: Symbol('ModerationService'),
  ConnectionService: Symbol('ConnectionService'),
  AIService: Symbol('AIService'),
  EmailService: Symbol('EmailService'),
  FileUploadService: Symbol('FileUploadService'),
  DailyWinService: Symbol('DailyWinService'),
  AACService: Symbol('AACService'),
  ViewCountService: Symbol('ViewCountService'),
  BookmarkService: Symbol('BookmarkService'),

  // Infrastructure
  Logger: Symbol('Logger'),
  CacheService: Symbol('CacheService'),
  RateLimiter: Symbol('RateLimiter'),
  RedisClient: Symbol('RedisClient'),
  JobQueue: Symbol('JobQueue'),
  EncryptionService: Symbol('EncryptionService'),
  DataGovernanceService: Symbol('DataGovernanceService'),
} as const;

export type TokenType = typeof TOKENS;
export type TokenKey = keyof TokenType;
export type TokenValue = TokenType[TokenKey];

export { container, Lifecycle };
