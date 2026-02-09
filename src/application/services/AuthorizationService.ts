/**
 * Resource-Level Access Control Service
 * 
 * Provides centralized authorization logic for all resources.
 * Implements ownership checks, role-based permissions, and special rules.
 */

import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { 
  ResourceType, 
  Permission, 
  ResourceContext, 
  AuthorizationContext, 
  AuthorizationResult,
  PERMISSION_MATRIX 
} from '@/domain/types/authorization';
import { IUserRepository } from '@/domain/interfaces/repositories/IUserRepository';
import { IPostRepository } from '@/domain/interfaces/repositories/IPostRepository';
import { ICommentRepository } from '@/domain/interfaces/repositories/ICommentRepository';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'authorization' });

@injectable()
export class AuthorizationService {
  constructor(
    @inject(TOKENS.UserRepository) private userRepo: IUserRepository,
    @inject(TOKENS.PostRepository) private postRepo: IPostRepository,
    @inject(TOKENS.CommentRepository) private commentRepo: ICommentRepository
  ) {}

  /**
   * Check if user can perform action on a resource
   */
  async can(
    user: AuthorizationContext,
    permission: Permission,
    resource: ResourceContext
  ): Promise<AuthorizationResult> {
    // Check if user is banned
    if (user.isBanned) {
      return { allowed: false, reason: 'User account is banned', requiredPermission: permission };
    }

    // Check email verification for write operations
    if (['CREATE', 'UPDATE', 'DELETE', 'MODERATE'].includes(permission) && !user.emailVerified) {
      return { allowed: false, reason: 'Email verification required', requiredPermission: permission };
    }

    // Check if resource is removed (only admins can access removed resources)
    if (resource.isRemoved && !user.roles.includes('ADMIN')) {
      return { allowed: false, reason: 'Resource has been removed', requiredPermission: permission };
    }

    // Check if resource is locked (only moderators/admins can modify locked resources)
    if (resource.isLocked && ['UPDATE', 'DELETE'].includes(permission)) {
      if (!user.roles.some(r => ['MODERATOR', 'ADMIN'].includes(r))) {
        return { allowed: false, reason: 'Resource is locked', requiredPermission: permission };
      }
    }

    // Get allowed roles for this resource type and permission
    const allowedRoles = PERMISSION_MATRIX[resource.resourceType]?.[permission] || [];

    // Check if user has a role that allows this action
    const hasRolePermission = user.roles.some(role => allowedRoles.includes(role));

    // Check ownership
    const isOwner = resource.ownerId === user.userId;
    const ownerAllowed = allowedRoles.includes('OWNER') && isOwner;

    // Special case: PARTICIPANT check for messages/conversations
    let isParticipant = false;
    if (allowedRoles.includes('PARTICIPANT')) {
      isParticipant = await this.checkParticipation(user.userId, resource);
    }

    if (hasRolePermission || ownerAllowed || isParticipant) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: this.generateDenialReason(resource.resourceType, permission, isOwner),
      requiredPermission: permission,
    };
  }

  /**
   * Check if user can create a resource of given type
   */
  async canCreate(
    user: AuthorizationContext,
    resourceType: ResourceType
  ): Promise<AuthorizationResult> {
    return this.can(user, 'CREATE', { resourceType, resourceId: 'new' });
  }

  /**
   * Check if user can read a resource
   */
  async canRead(
    user: AuthorizationContext,
    resource: ResourceContext
  ): Promise<AuthorizationResult> {
    return this.can(user, 'READ', resource);
  }

  /**
   * Check if user can update a resource
   */
  async canUpdate(
    user: AuthorizationContext,
    resource: ResourceContext
  ): Promise<AuthorizationResult> {
    return this.can(user, 'UPDATE', resource);
  }

  /**
   * Check if user can delete a resource
   */
  async canDelete(
    user: AuthorizationContext,
    resource: ResourceContext
  ): Promise<AuthorizationResult> {
    return this.can(user, 'DELETE', resource);
  }

  /**
   * Check if user can moderate a resource
   */
  async canModerate(
    user: AuthorizationContext,
    resource: ResourceContext
  ): Promise<AuthorizationResult> {
    return this.can(user, 'MODERATE', resource);
  }

  /**
   * Assert that user can perform action - throws if not allowed
   */
  async assertCan(
    user: AuthorizationContext,
    permission: Permission,
    resource: ResourceContext
  ): Promise<void> {
    const result = await this.can(user, permission, resource);
    if (!result.allowed) {
      logger.warn(
        { userId: user.userId, permission, resourceType: resource.resourceType, resourceId: resource.resourceId },
        'Authorization denied'
      );
      throw new Error(result.reason || 'Permission denied');
    }
  }

  /**
   * Get authorization context for a user
   */
  async getAuthContext(userId: string): Promise<AuthorizationContext | null> {
    const user = await this.userRepo.findByIdWithProfile(userId);
    if (!user) return null;

    return {
      userId: user.user.id,
      roles: user.user.roles,
      isBanned: user.user.isBanned,
      emailVerified: user.user.emailVerified,
    };
  }

  /**
   * Create resource context for a post
   */
  async getPostResourceContext(postId: string): Promise<ResourceContext | null> {
    const post = await this.postRepo.findById(postId);
    if (!post) return null;

    return {
      resourceType: 'POST',
      resourceId: post.id,
      ownerId: post.authorId,
      isLocked: post.isLocked,
      isRemoved: post.status === 'REMOVED',
    };
  }

  /**
   * Create resource context for a comment
   */
  async getCommentResourceContext(commentId: string): Promise<ResourceContext | null> {
    const comment = await this.commentRepo.findById(commentId);
    if (!comment) return null;

    return {
      resourceType: 'COMMENT',
      resourceId: comment.id,
      ownerId: comment.authorId,
      isRemoved: comment.status === 'REMOVED',
    };
  }

  /**
   * Check if user is a participant in a conversation
   */
  private async checkParticipation(userId: string, resource: ResourceContext): Promise<boolean> {
    // This would check if user is a participant in the conversation
    // Implementation depends on conversation repository
    // For now, return false - to be implemented when needed
    return false;
  }

  /**
   * Generate a human-readable denial reason
   */
  private generateDenialReason(resourceType: string, permission: string, isOwner: boolean): string {
    const actionMap: Record<string, string> = {
      CREATE: 'create',
      READ: 'view',
      UPDATE: 'edit',
      DELETE: 'delete',
      MODERATE: 'moderate',
      ADMIN: 'administer',
    };

    const resourceMap: Record<string, string> = {
      POST: 'post',
      COMMENT: 'comment',
      THERAPY_SESSION: 'therapy session',
      EMERGENCY_CARD: 'emergency card',
      DAILY_WIN: 'daily win',
      AAC_VOCABULARY: 'AAC vocabulary',
      USER_PROFILE: 'profile',
      MESSAGE: 'message',
      CONVERSATION: 'conversation',
      BOOKMARK: 'bookmark',
      VOTE: 'vote',
      CONNECTION: 'connection',
    };

    const action = actionMap[permission] || permission.toLowerCase();
    const resource = resourceMap[resourceType] || resourceType.toLowerCase();

    if (isOwner) {
      return `You don't have permission to ${action} this ${resource}`;
    }

    return `Not authorized to ${action} this ${resource}`;
  }
}
