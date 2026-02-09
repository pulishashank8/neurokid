import 'reflect-metadata';
import { container } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { vi, Mock } from 'vitest';

// Mock implementations
export class MockLogger {
  info: Mock = vi.fn();
  warn: Mock = vi.fn();
  error: Mock = vi.fn();
  debug: Mock = vi.fn();
}

export class MockRedis {
  get: Mock = vi.fn();
  set: Mock = vi.fn();
  del: Mock = vi.fn();
  keys: Mock = vi.fn();
  incr: Mock = vi.fn();
  expire: Mock = vi.fn();
}

export class MockDatabaseConnection {
  getClient: Mock = vi.fn();
  disconnect: Mock = vi.fn().mockResolvedValue(undefined);
  healthCheck: Mock = vi.fn().mockResolvedValue(true);
}

export class MockJobQueue {
  add: Mock = vi.fn().mockResolvedValue({ id: 'mock-job-id' });
  addBulk: Mock = vi.fn().mockResolvedValue([]);
  getJob: Mock = vi.fn().mockResolvedValue(null);
  removeJob: Mock = vi.fn().mockResolvedValue(undefined);
}

export function createTestContainer() {
  // Clear any existing registrations
  container.clearInstances();

  // Register mocks
  container.register(TOKENS.Logger, { useValue: new MockLogger() });
  container.register(TOKENS.RedisClient, { useValue: new MockRedis() });
  container.register(TOKENS.DatabaseConnection, { useValue: new MockDatabaseConnection() });
  container.register(TOKENS.JobQueue, { useValue: new MockJobQueue() });

  return container;
}

export function resetTestContainer() {
  container.clearInstances();
}

// Helper to create typed mock repositories
export function createMockRepository<T>(methods: (keyof T)[]): { [K in keyof T]: Mock } {
  const mock: Record<string, Mock> = {};
  methods.forEach(method => {
    mock[method as string] = vi.fn();
  });
  return mock as { [K in keyof T]: Mock };
}

// Common repository mock creators
export function createMockUserRepository() {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    findByIdWithProfile: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    addRole: vi.fn(),
    removeRole: vi.fn(),
    getRoles: vi.fn(),
  };
}

export function createMockProfileRepository() {
  return {
    findById: vi.fn(),
    findByUserId: vi.fn(),
    findByUsername: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    usernameExists: vi.fn(),
  };
}

export function createMockPostRepository() {
  return {
    findById: vi.fn(),
    findByIdWithAuthor: vi.fn(),
    list: vi.fn(),
    listWithAuthors: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    incrementViewCount: vi.fn(),
    updateVoteScore: vi.fn(),
    updateCommentCount: vi.fn(),
    existsDuplicate: vi.fn(),
  };
}

export function createMockCommentRepository() {
  return {
    findById: vi.fn(),
    findByIdWithAuthor: vi.fn(),
    findByPostId: vi.fn(),
    findByAuthorId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateVoteScore: vi.fn(),
  };
}

export function createMockNotificationRepository() {
  return {
    create: vi.fn(),
    createMany: vi.fn(),
    list: vi.fn(),
    findByIdAndUser: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
    countUnread: vi.fn(),
  };
}

export function createMockVoteRepository() {
  return {
    findByUserAndTarget: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    countByTarget: vi.fn(),
    getUserVotesForTargets: vi.fn(),
  };
}

export function createMockAuditLogRepository() {
  return {
    create: vi.fn(),
    list: vi.fn(),
    findByTarget: vi.fn(),
    deleteOlderThan: vi.fn(),
  };
}

export function createMockDatabaseConnection() {
  return {
    getClient: vi.fn(),
    getReadClient: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
    healthCheck: vi.fn().mockResolvedValue(true),
    executeWithRetry: vi.fn().mockImplementation((fn) => fn()),
    getPoolStats: vi.fn().mockReturnValue({
      totalQueries: 0,
      slowQueries: 0,
      errorCount: 0,
    }),
  };
}

export function createMockAuthorizationService() {
  return {
    can: vi.fn().mockResolvedValue({ allowed: true }),
    canCreate: vi.fn().mockResolvedValue({ allowed: true }),
    canRead: vi.fn().mockResolvedValue({ allowed: true }),
    canUpdate: vi.fn().mockResolvedValue({ allowed: true }),
    canDelete: vi.fn().mockResolvedValue({ allowed: true }),
    canModerate: vi.fn().mockResolvedValue({ allowed: true }),
    assertCan: vi.fn().mockResolvedValue(undefined),
    getAuthContext: vi.fn().mockResolvedValue({
      userId: 'user-1',
      roles: ['USER'],
      isBanned: false,
      emailVerified: true,
    }),
    getPostResourceContext: vi.fn().mockResolvedValue({
      resourceType: 'POST',
      resourceId: 'post-1',
      ownerId: 'user-1',
      isLocked: false,
      isRemoved: false,
    }),
    getCommentResourceContext: vi.fn().mockResolvedValue({
      resourceType: 'COMMENT',
      resourceId: 'comment-1',
      ownerId: 'user-1',
      isRemoved: false,
    }),
  };
}

export function createMockViewCountService() {
  return {
    incrementViewCount: vi.fn().mockResolvedValue(undefined),
    getViewCount: vi.fn().mockResolvedValue(100),
    trackView: vi.fn().mockResolvedValue(undefined),
  };
}
