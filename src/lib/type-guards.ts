/**
 * Domain-specific Type Guards
 * 
 * Runtime type checking for domain entities and API responses.
 * Provides type-safe ways to validate unknown data at runtime.
 */

import { 
  Post, 
  Comment, 
  User, 
  Profile, 
  Category, 
  Tag, 
  TherapySession,
  DailyWin,
  EmergencyCard,
  Vote,
  Notification,
  Message,
  Conversation,
  AACItem,
  Role,
  PostStatus,
  CommentStatus,
  TherapyType,
  AACCategory,
  NotificationType,
  PaginatedResult,
  CursorPaginatedResult,
} from '@/domain/types';

// ============================================================================
// Primitive Type Guards
// ============================================================================

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNullish(value: unknown): value is null | undefined {
  return value == null;
}

export function isNonNull<T>(value: T | null | undefined): value is T {
  return value != null;
}

// ============================================================================
// String Validation Guards
// ============================================================================

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

export function isUUID(value: unknown): value is string {
  return isString(value) && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isObjectId(value: unknown): value is string {
  return isString(value) && /^[0-9a-fA-F]{24}$/.test(value);
}

export function isValidId(value: unknown): value is string {
  return isUUID(value) || isObjectId(value) || (isString(value) && value.length > 0);
}

export function isEmail(value: unknown): value is string {
  return isString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isURL(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Enum Guards
// ============================================================================

export function isRole(value: unknown): value is Role {
  return isString(value) && ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'].includes(value);
}

export function isPostStatus(value: unknown): value is PostStatus {
  return isString(value) && ['ACTIVE', 'REMOVED', 'LOCKED', 'PINNED', 'DRAFT'].includes(value);
}

export function isCommentStatus(value: unknown): value is CommentStatus {
  return isString(value) && ['ACTIVE', 'REMOVED', 'HIDDEN'].includes(value);
}

export function isTherapyType(value: unknown): value is TherapyType {
  return isString(value) && ['ABA', 'OCCUPATIONAL', 'SPEECH', 'BEHAVIORAL', 'PLAY', 'SOCIAL_SKILLS', 'PHYSICAL', 'OTHER'].includes(value);
}

export function isAACCategory(value: unknown): value is AACCategory {
  return isString(value) && ['CORE', 'FOOD', 'SENSORY', 'EMERGENCY', 'SOCIAL', 'ACTIONS', 'CUSTOM'].includes(value);
}

export function isNotificationType(value: unknown): value is NotificationType {
  const types: NotificationType[] = [
    'POST_COMMENT', 'COMMENT_REPLY', 'POST_LIKE', 'COMMENT_LIKE', 
    'MENTION', 'FOLLOW', 'MESSAGE', 'MODERATION_ACTION', 
    'VERIFICATION_REQUEST', 'SYSTEM', 'CONNECTION_REQUEST', 'CONNECTION_ACCEPTED'
  ];
  return isString(value) && types.includes(value as NotificationType);
}

// ============================================================================
// Domain Entity Guards
// ============================================================================

export function isUser(value: unknown): value is User {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isEmail(value.email) &&
    isArray(value.roles) &&
    value.roles.every(isRole) &&
    isBoolean(value.emailVerified) &&
    isBoolean(value.isBanned) &&
    isDate(value.createdAt) &&
    isDate(value.updatedAt)
  );
}

export function isProfile(value: unknown): value is Profile {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isValidId(value.userId) &&
    isNonEmptyString(value.username) &&
    isNonEmptyString(value.displayName) &&
    isBoolean(value.verifiedTherapist) &&
    isBoolean(value.shadowbanned) &&
    isDate(value.createdAt) &&
    isDate(value.updatedAt)
  );
}

export function isPost(value: unknown): value is Post {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.content) &&
    isValidId(value.categoryId) &&
    isPostStatus(value.status) &&
    isNumber(value.viewCount) &&
    isNumber(value.commentCount) &&
    isNumber(value.voteScore) &&
    isBoolean(value.isAnonymous) &&
    isBoolean(value.isPinned) &&
    isBoolean(value.isLocked) &&
    isDate(value.createdAt) &&
    isDate(value.updatedAt) &&
    isArray(value.images) &&
    value.images.every(isString)
  );
}

export function isComment(value: unknown): value is Comment {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isNonEmptyString(value.content) &&
    isValidId(value.authorId) &&
    isValidId(value.postId) &&
    isCommentStatus(value.status) &&
    isBoolean(value.isAnonymous) &&
    isNumber(value.voteScore) &&
    isDate(value.createdAt) &&
    isDate(value.updatedAt)
  );
}

export function isCategory(value: unknown): value is Category {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.slug) &&
    isNumber(value.order)
  );
}

export function isTag(value: unknown): value is Tag {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.slug)
  );
}

export function isTherapySession(value: unknown): value is TherapySession {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isValidId(value.userId) &&
    isNonEmptyString(value.childName) &&
    isNonEmptyString(value.therapistName) &&
    isTherapyType(value.therapyType) &&
    isDate(value.sessionDate) &&
    isNumber(value.duration) &&
    (isNullish(value.mood) || (isNumber(value.mood) && value.mood >= 1 && value.mood <= 5)) &&
    isDate(value.createdAt) &&
    isDate(value.updatedAt)
  );
}

export function isDailyWin(value: unknown): value is DailyWin {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isValidId(value.userId) &&
    isDate(value.date) &&
    isNonEmptyString(value.content) &&
    (isNullish(value.mood) || isNumber(value.mood)) &&
    isDate(value.createdAt) &&
    isDate(value.updatedAt)
  );
}

export function isVote(value: unknown): value is Vote {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isValidId(value.userId) &&
    (value.targetType === 'POST' || value.targetType === 'COMMENT') &&
    isValidId(value.targetId) &&
    (value.value === -1 || value.value === 0 || value.value === 1) &&
    isDate(value.createdAt)
  );
}

export function isNotification(value: unknown): value is Notification {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isValidId(value.userId) &&
    isNotificationType(value.type) &&
    isObject(value.payload) &&
    (isNullish(value.readAt) || isDate(value.readAt)) &&
    isDate(value.createdAt)
  );
}

export function isMessage(value: unknown): value is Message {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isValidId(value.conversationId) &&
    (isNullish(value.senderId) || isValidId(value.senderId)) &&
    (isNullish(value.content) || isString(value.content)) &&
    (isNullish(value.imageUrl) || isURL(value.imageUrl)) &&
    isDate(value.createdAt)
  );
}

export function isConversation(value: unknown): value is Conversation {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isDate(value.createdAt) &&
    isArray(value.participantIds) &&
    value.participantIds.every(isValidId)
  );
}

export function isAACItem(value: unknown): value is AACItem {
  if (!isObject(value)) return false;
  return (
    isValidId(value.id) &&
    isValidId(value.userId) &&
    isNonEmptyString(value.label) &&
    isNonEmptyString(value.symbol) &&
    isAACCategory(value.category) &&
    isNumber(value.order) &&
    isBoolean(value.isActive) &&
    isDate(value.createdAt) &&
    isDate(value.updatedAt)
  );
}

// ============================================================================
// Pagination Guards
// ============================================================================

export function isPaginatedResult<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is PaginatedResult<T> {
  if (!isObject(value)) return false;
  const data = value.data;
  const pagination = value.pagination;
  
  if (!isArray(data) || !isObject(pagination)) return false;
  
  return (
    data.every(itemGuard) &&
    isNumber(pagination.total) &&
    isNumber(pagination.limit) &&
    isNumber(pagination.offset) &&
    isBoolean(pagination.hasMore)
  );
}

export function isCursorPaginatedResult<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is CursorPaginatedResult<T> {
  if (!isObject(value)) return false;
  const data = value.data;
  const pagination = value.pagination;
  
  if (!isArray(data) || !isObject(pagination)) return false;
  
  return (
    data.every(itemGuard) &&
    isNumber(pagination.limit) &&
    isBoolean(pagination.hasMore) &&
    (isNullish(pagination.nextCursor) || isString(pagination.nextCursor))
  );
}

// ============================================================================
// API Response Guards
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  message: string;
  requestId: string;
  fieldErrors?: Record<string, string>;
  retryAfter?: number;
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!isObject(value)) return false;
  return (
    isString(value.error) &&
    isString(value.message) &&
    isString(value.requestId)
  );
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
    durationMs?: number;
  };
}

export function isApiSuccessResponse<T>(
  value: unknown,
  dataGuard: (item: unknown) => item is T
): value is ApiSuccessResponse<T> {
  if (!isObject(value)) return false;
  if (!dataGuard(value.data)) return false;
  
  if (value.meta !== undefined) {
    if (!isObject(value.meta)) return false;
  }
  
  return true;
}

// ============================================================================
// Utility Guards
// ============================================================================

export function hasProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, unknown> {
  return isObject(value) && key in value;
}

export function hasStringProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, string> {
  return hasProperty(value, key) && isString(value[key]);
}

export function hasNumberProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, number> {
  return hasProperty(value, key) && isNumber(value[key]);
}

export function hasBooleanProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, boolean> {
  return hasProperty(value, key) && isBoolean(value[key]);
}

/**
 * Assert that a value is of a specific type at runtime
 */
export function assertType<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  message?: string
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(message || `Type assertion failed`);
  }
}

/**
 * Narrow an array by filtering with a type guard
 */
export function filterByType<T>(
  arr: unknown[],
  guard: (item: unknown) => item is T
): T[] {
  return arr.filter(guard);
}

/**
 * Find first item matching type guard
 */
export function findByType<T>(
  arr: unknown[],
  guard: (item: unknown) => item is T
): T | undefined {
  return arr.find(guard);
}
