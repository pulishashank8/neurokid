import { vi, Mock } from 'vitest';

/**
 * Creates a mock Prisma client for testing
 * This provides type-safe mocks for all Prisma operations
 */
export function createMockPrismaClient() {
  return {
    // Post operations
    post: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // User operations
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Profile operations
    profile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Comment operations
    comment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Vote operations
    vote: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Bookmark operations
    bookmark: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Category operations
    category: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Tag operations
    tag: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // UserRole operations
    userRole: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Notification operations
    notification: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Message operations
    directMessage: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Connection operations
    connectionRequest: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Daily Win operations
    dailyWin: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Therapy Session operations
    therapySession: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Emergency Card operations
    emergencyCard: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // AAC Vocabulary operations
    aACVocabulary: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Audit Log operations
    auditLog: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    // Transaction support
    $transaction: vi.fn().mockImplementation((operations: any[]) => {
      return Promise.all(operations);
    }),
    // Query raw support
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    $executeRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  };
}

export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;

/**
 * Resets all mocks on a Prisma client
 */
export function resetMockPrismaClient(mockPrisma?: MockPrismaClient) {
  if (mockPrisma) {
    Object.values(mockPrisma).forEach((model: any) => {
      if (typeof model === 'object' && model !== null) {
        Object.values(model).forEach((method: any) => {
          if (typeof method?.mockReset === 'function') {
            method.mockReset();
          }
        });
      }
    });
  }
}

/**
 * Helper to create mock data factories
 */
export function createMockPostFactory(overrides?: Partial<any>) {
  return {
    id: 'post-' + Math.random().toString(36).substr(2, 9),
    title: 'Test Post',
    content: 'Test content that is long enough for validation.',
    authorId: 'user-1',
    categoryId: 'cat-1',
    status: 'ACTIVE',
    viewCount: 0,
    commentCount: 0,
    voteScore: 0,
    isAnonymous: false,
    isPinned: false,
    isLocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
    ...overrides,
  };
}

export function createMockUserFactory(overrides?: Partial<any>) {
  return {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    hashedPassword: 'hashedpassword',
    emailVerified: true,
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    userRoles: [],
    profile: null,
    ...overrides,
  };
}

export function createMockCommentFactory(overrides?: Partial<any>) {
  return {
    id: 'comment-' + Math.random().toString(36).substr(2, 9),
    content: 'Test comment content',
    authorId: 'user-1',
    postId: 'post-1',
    parentCommentId: null,
    status: 'ACTIVE',
    isAnonymous: false,
    voteScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockCategoryFactory(overrides?: Partial<any>) {
  return {
    id: 'cat-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Category',
    slug: 'test-category',
    description: 'Test description',
    icon: null,
    color: null,
    parentId: null,
    isActive: true,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockTagFactory(overrides?: Partial<any>) {
  return {
    id: 'tag-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Tag',
    slug: 'test-tag',
    description: null,
    color: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockVoteFactory(overrides?: Partial<any>) {
  return {
    id: 'vote-' + Math.random().toString(36).substr(2, 9),
    userId: 'user-1',
    targetId: 'post-1',
    targetType: 'POST',
    value: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockBookmarkFactory(overrides?: Partial<any>) {
  return {
    id: 'bookmark-' + Math.random().toString(36).substr(2, 9),
    userId: 'user-1',
    postId: 'post-1',
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockNotificationFactory(overrides?: Partial<any>) {
  return {
    id: 'notification-' + Math.random().toString(36).substr(2, 9),
    userId: 'user-1',
    type: 'COMMENT',
    title: 'Test Notification',
    content: 'Test content',
    isRead: false,
    data: {},
    actionUrl: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockMessageFactory(overrides?: Partial<any>) {
  return {
    id: 'message-' + Math.random().toString(36).substr(2, 9),
    senderId: 'user-1',
    receiverId: 'user-2',
    content: 'Test message',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockTherapySessionFactory(overrides?: Partial<any>) {
  return {
    id: 'therapy-' + Math.random().toString(36).substr(2, 9),
    userId: 'user-1',
    therapyType: 'SPEECH',
    sessionDate: new Date(),
    childName: 'Test Child',
    therapistName: 'Test Therapist',
    duration: 60,
    notes: 'Test notes',
    wentWell: 'What went well',
    toWorkOn: 'What to work on',
    isEncrypted: true,
    encryptedData: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockDailyWinFactory(overrides?: Partial<any>) {
  return {
    id: 'win-' + Math.random().toString(36).substr(2, 9),
    userId: 'user-1',
    content: 'Test win',
    category: 'COMMUNICATION',
    date: new Date().toISOString().split('T')[0],
    isShared: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockEmergencyCardFactory(overrides?: Partial<any>) {
  return {
    id: 'emergency-' + Math.random().toString(36).substr(2, 9),
    userId: 'user-1',
    childName: 'Test Child',
    diagnosis: 'Test Diagnosis',
    triggers: ['Loud noises'],
    calmingStrategies: ['Deep breathing'],
    emergencyContacts: [{ name: 'Parent', phone: '555-0123' }],
    medications: [],
    allergies: [],
    isEncrypted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockAACItemFactory(overrides?: Partial<any>) {
  return {
    id: 'aac-' + Math.random().toString(36).substr(2, 9),
    userId: 'user-1',
    label: 'Test Item',
    image: null,
    category: 'NEEDS',
    order: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
