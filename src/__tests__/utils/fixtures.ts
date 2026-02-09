/**
 * Test Fixtures
 * 
 * Provides factory functions for creating test data across all domains.
 * All factories support partial overrides for flexible test setup.
 */

import { z } from 'zod';

// ============================================================================
// User Fixtures
// ============================================================================

export interface UserFixture {
  id: string;
  email: string;
  hashedPassword?: string;
  emailVerified: boolean;
  isBanned: boolean;
  bannedReason?: string;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function createUserFixture(overrides: Partial<UserFixture> = {}): UserFixture {
  return {
    id: `user_${generateId()}`,
    email: `user_${generateId()}@example.com`,
    hashedPassword: '$2a$10$hashedpassword123',
    emailVerified: true,
    isBanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export interface ProfileFixture {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  website?: string;
  verifiedTherapist: boolean;
  shadowbanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createProfileFixture(overrides: Partial<ProfileFixture> = {}): ProfileFixture {
  const id = generateId();
  return {
    id: `profile_${id}`,
    userId: overrides.userId || `user_${id}`,
    username: `user_${id}`,
    displayName: `Test User ${id}`,
    bio: 'This is a test bio',
    avatarUrl: 'https://example.com/avatar.jpg',
    location: 'Test City',
    verifiedTherapist: false,
    shadowbanned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Post Fixtures
// ============================================================================

export interface PostFixture {
  id: string;
  title: string;
  content: string;
  authorId?: string;
  categoryId: string;
  status: 'ACTIVE' | 'REMOVED' | 'LOCKED' | 'PINNED' | 'DRAFT';
  viewCount: number;
  commentCount: number;
  voteScore: number;
  isAnonymous: boolean;
  isPinned: boolean;
  isLocked: boolean;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function createPostFixture(overrides: Partial<PostFixture> = {}): PostFixture {
  const id = generateId();
  return {
    id: `post_${id}`,
    title: `Test Post ${id}`,
    content: 'This is test content for the post. It is long enough to pass validation.',
    authorId: `user_${generateId()}`,
    categoryId: `category_${generateId()}`,
    status: 'ACTIVE',
    viewCount: 0,
    commentCount: 0,
    voteScore: 0,
    isAnonymous: false,
    isPinned: false,
    isLocked: false,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export interface CategoryFixture {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createCategoryFixture(overrides: Partial<CategoryFixture> = {}): CategoryFixture {
  const id = generateId();
  const name = overrides.name || `Category ${id}`;
  return {
    id: `category_${id}`,
    name,
    slug: slugify(name),
    description: `Description for ${name}`,
    icon: 'message-circle',
    color: '#3B82F6',
    order: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export interface TagFixture {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function createTagFixture(overrides: Partial<TagFixture> = {}): TagFixture {
  const id = generateId();
  const name = overrides.name || `Tag ${id}`;
  return {
    id: `tag_${id}`,
    name,
    slug: slugify(name),
    description: `Description for ${name}`,
    color: '#10B981',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Comment Fixtures
// ============================================================================

export interface CommentFixture {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentCommentId?: string;
  status: 'ACTIVE' | 'REMOVED' | 'HIDDEN';
  isAnonymous: boolean;
  voteScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export function createCommentFixture(overrides: Partial<CommentFixture> = {}): CommentFixture {
  const id = generateId();
  return {
    id: `comment_${id}`,
    content: 'This is a test comment with sufficient length.',
    authorId: `user_${generateId()}`,
    postId: `post_${generateId()}`,
    status: 'ACTIVE',
    isAnonymous: false,
    voteScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Vote Fixtures
// ============================================================================

export interface VoteFixture {
  id: string;
  userId: string;
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

export function createVoteFixture(overrides: Partial<VoteFixture> = {}): VoteFixture {
  const id = generateId();
  return {
    id: `vote_${id}`,
    userId: `user_${generateId()}`,
    targetType: 'POST',
    targetId: `post_${generateId()}`,
    value: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Bookmark Fixtures
// ============================================================================

export interface BookmarkFixture {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

export function createBookmarkFixture(overrides: Partial<BookmarkFixture> = {}): BookmarkFixture {
  const id = generateId();
  return {
    id: `bookmark_${id}`,
    userId: `user_${generateId()}`,
    postId: `post_${generateId()}`,
    createdAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Notification Fixtures
// ============================================================================

export interface NotificationFixture {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  data: Record<string, unknown>;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
}

export function createNotificationFixture(overrides: Partial<NotificationFixture> = {}): NotificationFixture {
  const id = generateId();
  return {
    id: `notification_${id}`,
    userId: `user_${generateId()}`,
    type: 'POST_COMMENT',
    title: 'New Comment',
    content: 'Someone commented on your post',
    isRead: false,
    data: {},
    createdAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Message Fixtures
// ============================================================================

export interface MessageFixture {
  id: string;
  conversationId: string;
  senderId?: string;
  content?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createMessageFixture(overrides: Partial<MessageFixture> = {}): MessageFixture {
  const id = generateId();
  return {
    id: `message_${id}`,
    conversationId: `conversation_${generateId()}`,
    senderId: `user_${generateId()}`,
    content: 'Hello, this is a test message',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Therapy Session Fixtures
// ============================================================================

export interface TherapySessionFixture {
  id: string;
  userId: string;
  childName: string;
  therapistName: string;
  therapyType: 'ABA' | 'OCCUPATIONAL' | 'SPEECH' | 'BEHAVIORAL' | 'PLAY' | 'SOCIAL_SKILLS' | 'PHYSICAL' | 'OTHER';
  sessionDate: Date;
  duration: number;
  notes: string | null;
  wentWell: string | null;
  toWorkOn: string | null;
  mood: number | null;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createTherapySessionFixture(overrides: Partial<TherapySessionFixture> = {}): TherapySessionFixture {
  const id = generateId();
  return {
    id: `therapy_${id}`,
    userId: `user_${generateId()}`,
    childName: 'Test Child',
    therapistName: 'Dr. Test',
    therapyType: 'SPEECH',
    sessionDate: new Date(),
    duration: 60,
    notes: 'Session went well',
    wentWell: 'Good progress on speech',
    toWorkOn: 'Continue practicing at home',
    mood: 8,
    isEncrypted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Daily Win Fixtures
// ============================================================================

export interface DailyWinFixture {
  id: string;
  userId: string;
  date: Date;
  content: string;
  mood?: number;
  category?: string;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createDailyWinFixture(overrides: Partial<DailyWinFixture> = {}): DailyWinFixture {
  const id = generateId();
  return {
    id: `win_${id}`,
    userId: `user_${generateId()}`,
    date: new Date(),
    content: 'Today my child said a new word!',
    mood: 9,
    category: 'COMMUNICATION',
    isShared: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Emergency Card Fixtures
// ============================================================================

export interface EmergencyCardFixture {
  id: string;
  userId: string;
  childName: string;
  childAge?: number;
  diagnosis?: string;
  triggers?: string;
  calmingStrategies?: string;
  communication?: string;
  medications?: string;
  allergies?: string;
  emergencyContact1Name?: string;
  emergencyContact1Phone?: string;
  emergencyContact2Name?: string;
  emergencyContact2Phone?: string;
  doctorName?: string;
  doctorPhone?: string;
  additionalNotes?: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createEmergencyCardFixture(overrides: Partial<EmergencyCardFixture> = {}): EmergencyCardFixture {
  const id = generateId();
  return {
    id: `emergency_${id}`,
    userId: `user_${generateId()}`,
    childName: 'Test Child',
    childAge: 5,
    diagnosis: 'Autism Spectrum Disorder',
    triggers: 'Loud noises, crowds',
    calmingStrategies: 'Deep breathing, weighted blanket',
    communication: 'Non-verbal, uses AAC device',
    medications: 'None',
    allergies: 'Peanuts',
    emergencyContact1Name: 'Parent',
    emergencyContact1Phone: '+1234567890',
    doctorName: 'Dr. Smith',
    doctorPhone: '+1987654321',
    isEncrypted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// AAC Item Fixtures
// ============================================================================

export interface AACItemFixture {
  id: string;
  userId: string;
  label: string;
  symbol: string;
  category: 'CORE' | 'FOOD' | 'SENSORY' | 'EMERGENCY' | 'SOCIAL' | 'ACTIONS' | 'CUSTOM';
  audioText?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createAACItemFixture(overrides: Partial<AACItemFixture> = {}): AACItemFixture {
  const id = generateId();
  return {
    id: `aac_${id}`,
    userId: `user_${generateId()}`,
    label: 'More',
    symbol: '➕',
    category: 'CORE',
    audioText: 'I want more',
    order: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Collection Factories
// ============================================================================

export function createUserWithProfile(overrides: { user?: Partial<UserFixture>; profile?: Partial<ProfileFixture> } = {}) {
  const user = createUserFixture(overrides.user);
  const profile = createProfileFixture({
    userId: user.id,
    ...overrides.profile,
  });
  return { user, profile };
}

export function createPostWithComments(
  commentCount: number = 3,
  overrides: { post?: Partial<PostFixture>; comments?: Partial<CommentFixture> } = {}
) {
  const post = createPostFixture(overrides.post);
  const comments = Array.from({ length: commentCount }, (_, i) =>
    createCommentFixture({
      postId: post.id,
      ...overrides.comments,
    })
  );
  return { post, comments };
}

export function createMany<T>(count: number, factory: (index: number) => T): T[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// ============================================================================
// Schema Validation Helpers
// ============================================================================

export const FixtureSchemas = {
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    emailVerified: z.boolean(),
    isBanned: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  post: z.object({
    id: z.string(),
    title: z.string().min(1),
    content: z.string().min(1),
    status: z.enum(['ACTIVE', 'REMOVED', 'LOCKED', 'PINNED', 'DRAFT']),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  comment: z.object({
    id: z.string(),
    content: z.string().min(1),
    status: z.enum(['ACTIVE', 'REMOVED', 'HIDDEN']),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
};
