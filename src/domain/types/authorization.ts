/**
 * Authorization types for resource-level access control
 */

export type ResourceType = 
  | 'POST'
  | 'COMMENT'
  | 'THERAPY_SESSION'
  | 'EMERGENCY_CARD'
  | 'DAILY_WIN'
  | 'AAC_VOCABULARY'
  | 'USER_PROFILE'
  | 'MESSAGE'
  | 'CONVERSATION'
  | 'BOOKMARK'
  | 'VOTE'
  | 'CONNECTION';

export type Permission =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'MODERATE'
  | 'ADMIN';

export interface ResourceContext {
  resourceType: ResourceType;
  resourceId: string;
  ownerId?: string;
  isPublic?: boolean;
  isLocked?: boolean;
  isRemoved?: boolean;
}

export interface AuthorizationContext {
  userId: string;
  roles: string[];
  isBanned: boolean;
  emailVerified: boolean;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiredPermission?: Permission;
}

/**
 * Permission matrix for resources
 * Defines which roles can perform which actions
 */
export const PERMISSION_MATRIX: Record<ResourceType, Record<Permission, string[]>> = {
  POST: {
    CREATE: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    READ: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    UPDATE: ['OWNER', 'MODERATOR', 'ADMIN'], // OWNER = resource owner
    DELETE: ['OWNER', 'MODERATOR', 'ADMIN'],
    MODERATE: ['MODERATOR', 'ADMIN'],
    ADMIN: ['ADMIN'],
  },
  COMMENT: {
    CREATE: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    READ: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    UPDATE: ['OWNER', 'MODERATOR', 'ADMIN'],
    DELETE: ['OWNER', 'MODERATOR', 'ADMIN'],
    MODERATE: ['MODERATOR', 'ADMIN'],
    ADMIN: ['ADMIN'],
  },
  THERAPY_SESSION: {
    CREATE: ['PARENT', 'THERAPIST', 'ADMIN'],
    READ: ['OWNER', 'ADMIN'], // PHI - only owner or admin
    UPDATE: ['OWNER', 'ADMIN'],
    DELETE: ['OWNER', 'ADMIN'],
    MODERATE: ['ADMIN'],
    ADMIN: ['ADMIN'],
  },
  EMERGENCY_CARD: {
    CREATE: ['PARENT', 'THERAPIST', 'ADMIN'],
    READ: ['OWNER', 'ADMIN'], // PHI - only owner or admin
    UPDATE: ['OWNER', 'ADMIN'],
    DELETE: ['OWNER', 'ADMIN'],
    MODERATE: ['ADMIN'],
    ADMIN: ['ADMIN'],
  },
  DAILY_WIN: {
    CREATE: ['PARENT', 'THERAPIST', 'ADMIN'],
    READ: ['OWNER', 'ADMIN'],
    UPDATE: ['OWNER', 'ADMIN'],
    DELETE: ['OWNER', 'ADMIN'],
    MODERATE: ['ADMIN'],
    ADMIN: ['ADMIN'],
  },
  AAC_VOCABULARY: {
    CREATE: ['PARENT', 'THERAPIST', 'ADMIN'],
    READ: ['OWNER', 'ADMIN'],
    UPDATE: ['OWNER', 'ADMIN'],
    DELETE: ['OWNER', 'ADMIN'],
    MODERATE: ['ADMIN'],
    ADMIN: ['ADMIN'],
  },
  USER_PROFILE: {
    CREATE: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    READ: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    UPDATE: ['OWNER', 'ADMIN'],
    DELETE: ['OWNER', 'ADMIN'],
    MODERATE: ['MODERATOR', 'ADMIN'],
    ADMIN: ['ADMIN'],
  },
  MESSAGE: {
    CREATE: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    READ: ['PARTICIPANT', 'ADMIN'], // Must be conversation participant
    UPDATE: ['ADMIN'], // Messages generally can't be edited
    DELETE: ['OWNER', 'ADMIN'],
    MODERATE: ['MODERATOR', 'ADMIN'],
    ADMIN: ['ADMIN'],
  },
  CONVERSATION: {
    CREATE: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    READ: ['PARTICIPANT', 'ADMIN'],
    UPDATE: ['PARTICIPANT', 'ADMIN'],
    DELETE: ['PARTICIPANT', 'ADMIN'],
    MODERATE: ['MODERATOR', 'ADMIN'],
    ADMIN: ['ADMIN'],
  },
  BOOKMARK: {
    CREATE: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    READ: ['OWNER', 'ADMIN'],
    UPDATE: ['OWNER', 'ADMIN'],
    DELETE: ['OWNER', 'ADMIN'],
    MODERATE: ['ADMIN'],
    ADMIN: ['ADMIN'],
  },
  VOTE: {
    CREATE: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    READ: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    UPDATE: ['OWNER', 'ADMIN'],
    DELETE: ['OWNER', 'ADMIN'],
    MODERATE: ['MODERATOR', 'ADMIN'],
    ADMIN: ['ADMIN'],
  },
  CONNECTION: {
    CREATE: ['PARENT', 'THERAPIST', 'MODERATOR', 'ADMIN'],
    READ: ['OWNER', 'ADMIN'],
    UPDATE: ['OWNER', 'ADMIN'],
    DELETE: ['OWNER', 'ADMIN'],
    MODERATE: ['ADMIN'],
    ADMIN: ['ADMIN'],
  },
};
