/**
 * OpenAPI Specification for NeuroKind API
 * 
 * This file defines the complete OpenAPI 3.0 specification for the NeuroKind API.
 * It can be used to generate documentation, client SDKs, and validation.
 */

import { API_VERSIONS, DEFAULT_API_VERSION } from '@/middleware/api-version';

export const OPENAPI_VERSION = '3.0.3';

export function generateOpenAPISpec(): Record<string, unknown> {
  const versionInfo = API_VERSIONS[DEFAULT_API_VERSION];

  return {
    openapi: OPENAPI_VERSION,
    info: {
      title: 'NeuroKind API',
      description: `Official API for NeuroKind - A supportive platform for parents of autistic children.

## Authentication

The API supports two authentication methods:

### Session-Based (v1)
Use your session cookie from browser authentication.

### API Key (v2+)
Include your API key in the Authorization header:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Versioning

API versions are specified via the \`X-API-Version\` header:
\`\`\`
X-API-Version: ${DEFAULT_API_VERSION}
\`\`\`

Current stable version: **${DEFAULT_API_VERSION}**

## Rate Limits

- General API: 100 requests/minute
- AI Chat: 20 requests/hour
- Authentication: 5 requests/minute
- File uploads: 10 requests/minute

## Response Format

All responses follow a consistent format:

### Success
\`\`\`json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-08T18:00:00Z",
    "durationMs": 45
  },
  "pagination": {
    "limit": 20,
    "hasMore": true,
    "nextCursor": "cursor_xyz"
  }
}
\`\`\`

### Error
\`\`\`json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "requestId": "req_abc123",
  "fieldErrors": {
    "fieldName": "Validation error message"
  }
}
\`\`\``,
      version: versionInfo.id,
      contact: {
        name: 'NeuroKind API Support',
        email: 'api-support@neurokind.com',
        url: 'https://neurokind.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://api.neurokind.com/api',
        description: 'Production server',
      },
      {
        url: 'https://staging-api.neurokind.com/api',
        description: 'Staging server',
      },
      {
        url: 'http://localhost:3000/api',
        description: 'Local development',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and session management' },
      { name: 'Posts', description: 'Community posts and discussions' },
      { name: 'Comments', description: 'Comments on posts' },
      { name: 'AI', description: 'AI-powered features and chat' },
      { name: 'Users', description: 'User profiles and management' },
      { name: 'Daily Wins', description: 'Daily achievement tracking' },
      { name: 'Therapy', description: 'Therapy session management' },
      { name: 'Emergency', description: 'Emergency cards and information' },
      { name: 'Connections', description: 'User connections and networking' },
      { name: 'Messages', description: 'Direct messaging' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'System', description: 'System health and status' },
    ],
    paths: {
      // Posts
      '/posts': {
        get: {
          tags: ['Posts'],
          summary: 'List posts',
          description: 'Get a paginated list of community posts',
          parameters: [
            { $ref: '#/components/parameters/LimitParam' },
            { $ref: '#/components/parameters/CursorParam' },
            {
              name: 'sort',
              in: 'query',
              schema: { type: 'string', enum: ['hot', 'top', 'new'], default: 'hot' },
              description: 'Sort order',
            },
            {
              name: 'categoryId',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by category ID',
            },
            {
              name: 'tag',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by tag slug',
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search query for full-text search',
            },
          ],
          responses: {
            '200': {
              description: 'List of posts',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PostListResponse' },
                },
              },
            },
            '429': { $ref: '#/components/responses/RateLimitError' },
          },
        },
        post: {
          tags: ['Posts'],
          summary: 'Create post',
          description: 'Create a new community post',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreatePostInput' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Post created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PostResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '422': { $ref: '#/components/responses/ValidationError' },
            '429': { $ref: '#/components/responses/RateLimitError' },
          },
        },
      },
      '/posts/{id}': {
        get: {
          tags: ['Posts'],
          summary: 'Get post',
          description: 'Get a single post by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Post ID',
            },
          ],
          responses: {
            '200': {
              description: 'Post details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PostResponse' },
                },
              },
            },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        patch: {
          tags: ['Posts'],
          summary: 'Update post',
          description: 'Update an existing post',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Post ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdatePostInput' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Post updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PostResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
        delete: {
          tags: ['Posts'],
          summary: 'Delete post',
          description: 'Delete a post',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Post ID',
            },
          ],
          responses: {
            '204': { description: 'Post deleted' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },
      // AI
      '/ai/chat': {
        post: {
          tags: ['AI'],
          summary: 'Chat with AI',
          description: 'Send a message to the AI assistant',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChatRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'AI response',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ChatResponse' },
                },
              },
            },
            '202': {
              description: 'Request accepted for async processing',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AsyncJobResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '429': { $ref: '#/components/responses/RateLimitError' },
          },
        },
      },
      // Users
      '/user/profile': {
        get: {
          tags: ['Users'],
          summary: 'Get user profile',
          description: 'Get the current user\'s profile',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserProfileResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        patch: {
          tags: ['Users'],
          summary: 'Update profile',
          description: 'Update the current user\'s profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateProfileInput' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Profile updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserProfileResponse' },
                },
              },
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '422': { $ref: '#/components/responses/ValidationError' },
          },
        },
      },
      // Health
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          description: 'Check API health status',
          responses: {
            '200': {
              description: 'System healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                },
              },
            },
            '503': {
              description: 'Service unavailable',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API key',
          description: 'API key authentication',
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
          description: 'Session-based authentication',
        },
      },
      parameters: {
        LimitParam: {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Number of items to return',
        },
        CursorParam: {
          name: 'cursor',
          in: 'query',
          schema: { type: 'string' },
          description: 'Pagination cursor for next page',
        },
        OffsetParam: {
          name: 'offset',
          in: 'query',
          schema: { type: 'integer', minimum: 0, default: 0 },
          description: 'Number of items to skip',
        },
      },
      schemas: {
        // Meta
        Meta: {
          type: 'object',
          properties: {
            requestId: { type: 'string', example: 'req_abc123xyz' },
            timestamp: { type: 'string', format: 'date-time', example: '2026-02-08T18:00:00Z' },
            durationMs: { type: 'integer', example: 45 },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            limit: { type: 'integer', example: 20 },
            offset: { type: 'integer', example: 0 },
            cursor: { type: 'string', nullable: true },
            nextCursor: { type: 'string', nullable: true, example: 'cursor_xyz789' },
            hasMore: { type: 'boolean', example: true },
            total: { type: 'integer', example: 150 },
          },
        },
        Links: {
          type: 'object',
          properties: {
            self: { type: 'string', example: 'https://api.neurokind.com/api/posts?limit=20' },
            next: { type: 'string', nullable: true, example: 'https://api.neurokind.com/api/posts?limit=20&cursor=xyz789' },
            prev: { type: 'string', nullable: true },
            first: { type: 'string', example: 'https://api.neurokind.com/api/posts?limit=20' },
            last: { type: 'string', example: 'https://api.neurokind.com/api/posts?limit=20&offset=140' },
          },
        },
        // User
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user_abc123' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            profile: { $ref: '#/components/schemas/UserProfile' },
            roles: { type: 'array', items: { type: 'string' }, example: ['USER'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'email', 'roles', 'createdAt'],
        },
        UserProfile: {
          type: 'object',
          properties: {
            username: { type: 'string', example: 'johndoe' },
            displayName: { type: 'string', example: 'John Doe' },
            bio: { type: 'string', example: 'Autism advocate and parent' },
            avatarUrl: { type: 'string', format: 'uri' },
            verifiedTherapist: { type: 'boolean', example: false },
          },
        },
        // Post
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'post_xyz789' },
            title: { type: 'string', example: 'Tips for managing sensory overload' },
            content: { type: 'string', example: 'Here are some strategies that have worked for us...' },
            author: { $ref: '#/components/schemas/User' },
            category: { $ref: '#/components/schemas/Category' },
            tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
            voteScore: { type: 'integer', example: 42 },
            commentCount: { type: 'integer', example: 15 },
            viewCount: { type: 'integer', example: 523 },
            isPinned: { type: 'boolean', example: false },
            isLocked: { type: 'boolean', example: false },
            isAnonymous: { type: 'boolean', example: false },
            status: { type: 'string', enum: ['ACTIVE', 'DELETED', 'ARCHIVED'], example: 'ACTIVE' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'title', 'content', 'voteScore', 'commentCount', 'viewCount', 'isPinned', 'isLocked', 'isAnonymous', 'status', 'createdAt', 'updatedAt'],
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cat_sensory' },
            name: { type: 'string', example: 'Sensory Issues' },
            slug: { type: 'string', example: 'sensory-issues' },
            description: { type: 'string' },
          },
          required: ['id', 'name', 'slug'],
        },
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'tag_tips' },
            name: { type: 'string', example: 'Tips' },
            slug: { type: 'string', example: 'tips' },
          },
          required: ['id', 'name', 'slug'],
        },
        // AI
        ChatMessage: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['user', 'assistant', 'system'], example: 'user' },
            content: { type: 'string', example: 'I\'m feeling overwhelmed today' },
          },
          required: ['role', 'content'],
        },
        ChatRequest: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: { $ref: '#/components/schemas/ChatMessage' },
              example: [{ role: 'user', content: 'Hello!' }],
            },
            conversationId: { type: 'string', example: 'conv_abc123' },
          },
          required: ['messages'],
        },
        ChatResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                message: { $ref: '#/components/schemas/ChatMessage' },
                conversationId: { type: 'string', example: 'conv_abc123' },
                tokensUsed: { type: 'integer', example: 150 },
              },
            },
            meta: { $ref: '#/components/schemas/Meta' },
          },
          required: ['data'],
        },
        AsyncJobResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                jobId: { type: 'string', example: 'job_xyz789' },
                status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'], example: 'pending' },
                estimatedWaitSeconds: { type: 'integer', example: 5 },
              },
            },
            meta: { $ref: '#/components/schemas/Meta' },
          },
        },
        // Request/Response wrappers
        PostListResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
            meta: { $ref: '#/components/schemas/Meta' },
            pagination: { $ref: '#/components/schemas/Pagination' },
            links: { $ref: '#/components/schemas/Links' },
          },
          required: ['data'],
        },
        PostResponse: {
          type: 'object',
          properties: {
            data: { $ref: '#/components/schemas/Post' },
            meta: { $ref: '#/components/schemas/Meta' },
          },
          required: ['data'],
        },
        CreatePostInput: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 5, maxLength: 200, example: 'My post title' },
            content: { type: 'string', minLength: 10, maxLength: 50000, example: 'Post content here...' },
            categoryId: { type: 'string', example: 'cat_abc123' },
            tags: { type: 'array', items: { type: 'string' }, example: ['tips', 'sensory'] },
            isAnonymous: { type: 'boolean', default: false },
            images: { type: 'array', items: { type: 'string', format: 'uri' } },
          },
          required: ['title', 'content', 'categoryId'],
        },
        UpdatePostInput: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 5, maxLength: 200 },
            content: { type: 'string', minLength: 10, maxLength: 50000 },
            categoryId: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
        UserProfileResponse: {
          type: 'object',
          properties: {
            data: { $ref: '#/components/schemas/User' },
            meta: { $ref: '#/components/schemas/Meta' },
          },
          required: ['data'],
        },
        UpdateProfileInput: {
          type: 'object',
          properties: {
            displayName: { type: 'string', maxLength: 100 },
            bio: { type: 'string', maxLength: 500 },
            avatarUrl: { type: 'string', format: 'uri' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'], example: 'healthy' },
                version: { type: 'string', example: '2024-01-15' },
                timestamp: { type: 'string', format: 'date-time' },
                checks: {
                  type: 'object',
                  properties: {
                    database: { type: 'string', enum: ['up', 'down'], example: 'up' },
                    redis: { type: 'string', enum: ['up', 'down'], example: 'up' },
                    aiService: { type: 'string', enum: ['up', 'down', 'degraded'], example: 'up' },
                  },
                },
              },
            },
            meta: { $ref: '#/components/schemas/Meta' },
          },
          required: ['data'],
        },
        // Errors
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'ERROR_CODE' },
            message: { type: 'string', example: 'Human-readable error message' },
            requestId: { type: 'string', example: 'req_abc123xyz' },
            fieldErrors: {
              type: 'object',
              additionalProperties: { type: 'string' },
              example: { 'title': 'Title is required' },
            },
            retryAfter: { type: 'integer', example: 60 },
          },
          required: ['error', 'message', 'requestId'],
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'UNAUTHORIZED',
                message: 'Authentication required',
                requestId: 'req_abc123xyz',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'FORBIDDEN',
                message: 'Access denied',
                requestId: 'req_abc123xyz',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'RESOURCE_NOT_FOUND',
                message: 'Post with id xyz not found',
                requestId: 'req_abc123xyz',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'VALIDATION_ERROR',
                message: 'Validation failed',
                requestId: 'req_abc123xyz',
                fieldErrors: {
                  title: 'Title must be at least 5 characters',
                  categoryId: 'Category is required',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          headers: {
            'Retry-After': {
              schema: { type: 'integer' },
              description: 'Seconds until retry is allowed',
            },
          },
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'RATE_LIMIT_EXCEEDED',
                message: 'Rate limit exceeded. Please try again later.',
                requestId: 'req_abc123xyz',
                retryAfter: 60,
              },
            },
          },
        },
      },
    },
  };
}
