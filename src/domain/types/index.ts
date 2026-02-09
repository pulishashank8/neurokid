// Domain entities (decoupled from Prisma)

export type Role = 'PARENT' | 'THERAPIST' | 'MODERATOR' | 'ADMIN';

// Re-export authorization types
export * from './authorization';

export type PostStatus = 'ACTIVE' | 'REMOVED' | 'LOCKED' | 'PINNED' | 'DRAFT';

export type CommentStatus = 'ACTIVE' | 'REMOVED' | 'HIDDEN';

export type TherapyType = 'ABA' | 'OCCUPATIONAL' | 'SPEECH' | 'BEHAVIORAL' | 'PLAY' | 'SOCIAL_SKILLS' | 'PHYSICAL' | 'OTHER';

export type AACCategory = 'CORE' | 'FOOD' | 'SENSORY' | 'EMERGENCY' | 'SOCIAL' | 'ACTIONS' | 'CUSTOM';

export type NotificationType =
  | 'POST_COMMENT'
  | 'COMMENT_REPLY'
  | 'POST_LIKE'
  | 'COMMENT_LIKE'
  | 'MENTION'
  | 'FOLLOW'
  | 'MESSAGE'
  | 'MODERATION_ACTION'
  | 'VERIFICATION_REQUEST'
  | 'SYSTEM'
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED';

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  isBanned: boolean;
  bannedReason?: string;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  roles: Role[];
}

export interface Profile {
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

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId?: string;
  categoryId: string;
  status: PostStatus;
  viewCount: number;
  commentCount: number;
  voteScore: number;
  isAnonymous: boolean;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentCommentId?: string;
  status: CommentStatus;
  isAnonymous: boolean;
  voteScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TherapySession {
  id: string;
  userId: string;
  childName: string;
  therapistName: string;
  therapyType: TherapyType;
  sessionDate: Date;
  duration: number;
  notes: string | null;
  wentWell: string | null;
  toWorkOn: string | null;
  mood: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyCard {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyWin {
  id: string;
  userId: string;
  date: Date;
  content: string;
  mood?: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId?: string;
  content?: string;
  imageUrl?: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  createdAt: Date;
  participantIds: string[];
}

export interface AACItem {
  id: string;
  userId: string;
  label: string;
  symbol: string;
  category: AACCategory;
  audioText?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  userId: string;
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  value: number;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Pagination types
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

// Author info for display
export interface AuthorInfo {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  verifiedTherapist: boolean;
}

// Re-export additional types
export * from './authorization';
export * from './connection';
export * from './provider';
