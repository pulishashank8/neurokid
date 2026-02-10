# AI Worker Prompt: NeuroKid Quality Implementation

## Context

You are working on the NeuroKid project - a healthcare platform for autistic children and their families. The codebase has been partially modernized with clean architecture, dependency injection, and security hardening.

## Your Task

You have been given the `COMPLETED_TODO_SPEC.md` document which contains a comprehensive audit of the codebase. Your job is to implement the remaining items marked as:
- ❌ **NOT STARTED** 
- 🔄 **PARTIALLY COMPLETED**

## Critical Rules

### 1. Follow Existing Patterns
```typescript
// ALWAYS use the DI pattern:
import { container, TOKENS } from '@/lib/container';
import { withApiHandler } from '@/lib/api';

export const GET = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const service = container.resolve<Interface>(TOKENS.Service);
    // ... handler logic
  },
  {
    method: 'GET',
    routeName: 'GET /api/example',
    requireAuth: true/false,
    rateLimit: 'rateLimitName', // if applicable
  }
);
```

### 2. Error Handling
Always use domain errors from `@/domain/errors`:
```typescript
import { ValidationError, NotFoundError, ForbiddenError } from '@/domain/errors';

// For validation failures
throw new ValidationError('Invalid input', { field: 'error message' });

// For missing resources
throw new NotFoundError('ResourceType', id);

// For authorization failures
throw new ForbiddenError('Reason for denial');
```

### 3. Logging
Always use the structured logger:
```typescript
import { createLogger } from '@/lib/logger';
const logger = createLogger({ context: 'ServiceName' });

// Good
logger.info({ userId, action: 'create' }, 'Post created');
logger.error({ error, userId }, 'Failed to create post');

// NEVER use console.log in production code
```

### 4. Sanitization
Always sanitize user input:
```typescript
import { sanitizationService } from '@/lib/sanitization';

const cleanTitle = sanitizationService.sanitizeTitle(input.title);
const cleanContent = sanitizationService.sanitizeContent(input.content);
```

## Implementation Priorities

When given this prompt, prioritize tasks in this order:

### Priority 1: Architecture (Phase 1)
1. Consolidate `api-handler.ts` and `handler.ts`
2. Move files from `src/repositories/` to `src/infrastructure/repositories/`
3. Move files from `src/services/` to `src/application/services/`

### Priority 2: Security & Performance (Phases 2-3)
1. Add Prometheus metrics
2. Implement database connection pool improvements
3. Add DataLoader pattern for N+1 queries

### Priority 3: AI & External Services (Phase 4)
1. Install and configure opossum circuit breaker
2. Complete WebSocket implementation for AI
3. Add cost tracking for AI usage

### Priority 4: Observability (Phase 6)
1. Install prom-client
2. Add HTTP middleware metrics
3. Add database query metrics

### Priority 5: Database (Phase 7)
1. Add PostgreSQL full-text search
2. Implement soft deletes
3. Add data retention policies

## File Templates

### New Service Template
```typescript
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '@/lib/container';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'ServiceName' });

@injectable()
export class ServiceName {
  constructor(
    @inject(TOKENS.Dependency) private dependency: IDependency
  ) {}

  async methodName(input: InputType): Promise<OutputType> {
    try {
      // Implementation
      logger.info({ input }, 'Operation completed');
      return result;
    } catch (error) {
      logger.error({ error, input }, 'Operation failed');
      throw error;
    }
  }
}
```

### New Repository Template
```typescript
import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class RepositoryName implements IRepositoryName {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findById(id: string): Promise<Entity | null> {
    const result = await this.prisma.entity.findUnique({
      where: { id },
    });
    return result ? this.toDomain(result) : null;
  }

  private toDomain(data: PrismaEntity): Entity {
    return {
      id: data.id,
      // ... mapping
    };
  }
}
```

### New API Route Template
```typescript
import { NextResponse } from 'next/server';
import { container, TOKENS } from '@/lib/container';
import {
  withApiHandler,
  parseBody,
  AuthenticatedRequest,
  RateLimits,
} from '@/lib/api';
import { IService } from '@/domain/interfaces/services/IService';
import { ValidationError } from '@/domain/errors';
import { registerDependencies } from '@/lib/container-registrations';

registerDependencies();

// GET /api/resource
export const GET = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const service = container.resolve<IService>(TOKENS.Service);
    
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);
    
    const result = await service.methodName({ limit });
    return NextResponse.json(result);
  },
  {
    method: 'GET',
    routeName: 'GET /api/resource',
    requireAuth: false, // or true
    rateLimit: 'rateLimitName',
  }
);

// POST /api/resource
export const POST = withApiHandler(
  async (request: AuthenticatedRequest) => {
    const service = container.resolve<IService>(TOKENS.Service);
    
    const body = await parseBody<{ field: string }>(request);
    
    if (!body.field) {
      throw new ValidationError('Field is required');
    }
    
    const result = await service.create(body);
    return NextResponse.json(result, { status: 201 });
  },
  {
    method: 'POST',
    routeName: 'POST /api/resource',
    requireAuth: true,
    rateLimit: 'createResource',
  }
);
```

## Checklist Before Submitting Changes

- [ ] All new code follows the existing patterns
- [ ] No `console.log` statements (use `logger` instead)
- [ ] No `any` types (use proper typing)
- [ ] All user inputs sanitized
- [ ] All database queries use Prisma types
- [ ] Error handling uses domain errors
- [ ] Rate limiting applied to mutations
- [ ] Authentication required where appropriate
- [ ] Tests added or updated
- [ ] No circular dependencies introduced

## Commands to Run

Before completing work, run these commands:

```bash
# Type checking
npm run build

# Linting
npm run lint

# Tests
npm test

# Specific test for your changes
npm test -- src/__tests__/unit/services/YourService.test.ts
```

## Common Patterns

### Rate Limiting
```typescript
import { enforceRateLimit, getClientIp, RateLimits } from '@/lib/rate-limit';

// In handler:
const ip = getClientIp(request);
const identifier = request.session?.user?.id || ip;
const rateLimitResponse = await enforceRateLimit(RateLimits.actionName, identifier);
if (rateLimitResponse) return rateLimitResponse;
```

### Authorization
```typescript
import { IAuthorizationService } from '@/domain/interfaces/services/IAuthorizationService';

const authService = container.resolve<IAuthorizationService>(TOKENS.AuthorizationService);
const authContext = await authService.getAuthContext(userId);
const resourceContext = await authService.getPostResourceContext(postId);
const canUpdate = await authService.canUpdate(authContext, resourceContext);

if (!canUpdate.allowed) {
  throw new ForbiddenError(canUpdate.reason || 'Not authorized');
}
```

### Caching
```typescript
import { getRedisClient } from '@/lib/rate-limit';

const redis = await getRedisClient();
if (redis) {
  const cached = await redis.get(`cache:${key}`);
  if (cached) return JSON.parse(cached);
  
  // Set cache
  await redis.setex(`cache:${key}`, 3600, JSON.stringify(data));
}
```

## Questions?

If you encounter:
- Ambiguous requirements → Check existing similar implementations
- Pattern conflicts → Follow the most recently implemented pattern
- Unclear dependencies → Look at `container-registrations.ts`

## Example Task

**Task**: "Implement Phase 1.2.4 - Move src/repositories/ contents to src/infrastructure/repositories/"

**Steps**:
1. Read the file at `src/repositories/therapy-session.repository.ts`
2. Compare with existing files in `src/infrastructure/repositories/`
3. Move the file to the new location
4. Update any imports that reference the old location
5. Delete the old file
6. Verify no code references the old path
7. Run tests to ensure nothing broke

---

**Remember**: Make minimal changes, follow existing patterns, and always verify with tests.
