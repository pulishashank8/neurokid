import { 
  ResourceType, 
  Permission, 
  ResourceContext, 
  AuthorizationContext, 
  AuthorizationResult 
} from '@/domain/types/authorization';

export interface IAuthorizationService {
  can(
    user: AuthorizationContext,
    permission: Permission,
    resource: ResourceContext
  ): Promise<AuthorizationResult>;

  canCreate(user: AuthorizationContext, resourceType: ResourceType): Promise<AuthorizationResult>;
  canRead(user: AuthorizationContext, resource: ResourceContext): Promise<AuthorizationResult>;
  canUpdate(user: AuthorizationContext, resource: ResourceContext): Promise<AuthorizationResult>;
  canDelete(user: AuthorizationContext, resource: ResourceContext): Promise<AuthorizationResult>;
  canModerate(user: AuthorizationContext, resource: ResourceContext): Promise<AuthorizationResult>;

  assertCan(
    user: AuthorizationContext,
    permission: Permission,
    resource: ResourceContext
  ): Promise<void>;

  getAuthContext(userId: string): Promise<AuthorizationContext | null>;
  getPostResourceContext(postId: string): Promise<ResourceContext | null>;
  getCommentResourceContext(commentId: string): Promise<ResourceContext | null>;
}
