/**
 * NeuroKind API Client SDK
 *
 * Official TypeScript/JavaScript client for the NeuroKind API
 *
 * @packageDocumentation
 */

export interface NeuroKindClientOptions {
  /**
   * Base URL for API requests
   * @default 'https://api.neurokind.com'
   */
  baseUrl?: string;

  /**
   * API key for authentication (v2+ only)
   */
  apiKey?: string;

  /**
   * Session token for authentication (v1)
   */
  sessionToken?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Enable automatic retries for failed requests
   * @default true
   */
  retry?: boolean;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Custom fetch implementation
   * @default globalThis.fetch
   */
  fetch?: typeof fetch;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
    durationMs?: number;
  };
  pagination?: {
    limit: number;
    offset?: number;
    cursor?: string;
    nextCursor?: string | null;
    hasMore: boolean;
    total?: number;
  };
  links?: {
    self?: string;
    next?: string | null;
    prev?: string | null;
  };
}

export interface ApiError {
  error: string;
  message: string;
  requestId: string;
  fieldErrors?: Record<string, string>;
  retryAfter?: number;
  stack?: string;
}

export class NeuroKindApiError extends Error {
  constructor(
    public readonly error: string,
    public readonly statusCode: number,
    public readonly requestId: string,
    public readonly fieldErrors?: Record<string, string>,
    public readonly retryAfter?: number
  ) {
    super(`API Error ${statusCode}: ${error}`);
    this.name = 'NeuroKindApiError';
  }
}

export class NeuroKindClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly sessionToken?: string;
  private readonly timeout: number;
  private readonly retry: boolean;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;

  // Resource endpoints
  public readonly posts: PostsApi;
  public readonly comments: CommentsApi;
  public readonly ai: AIApi;
  public readonly users: UsersApi;
  public readonly dailyWins: DailyWinsApi;
  public readonly therapy: TherapyApi;
  public readonly emergency: EmergencyApi;
  public readonly connections: ConnectionsApi;
  public readonly messages: MessagesApi;
  public readonly notifications: NotificationsApi;

  constructor(options: NeuroKindClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://api.neurokind.com';
    this.apiKey = options.apiKey;
    this.sessionToken = options.sessionToken;
    this.timeout = options.timeout || 30000;
    this.retry = options.retry !== false;
    this.maxRetries = options.maxRetries || 3;
    this.fetchImpl = options.fetch || fetch;

    // Initialize resource endpoints
    this.posts = new PostsApi(this);
    this.comments = new CommentsApi(this);
    this.ai = new AIApi(this);
    this.users = new UsersApi(this);
    this.dailyWins = new DailyWinsApi(this);
    this.therapy = new TherapyApi(this);
    this.emergency = new EmergencyApi(this);
    this.connections = new ConnectionsApi(this);
    this.messages = new MessagesApi(this);
    this.notifications = new NotificationsApi(this);
  }

  /**
   * Internal method to make HTTP requests
   */
  async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<ApiResponse<T>> {
    const url = new URL(path, this.baseUrl);

    // Add query parameters
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authentication
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    } else if (this.sessionToken) {
      headers.Cookie = `next-auth.session-token=${this.sessionToken}`;
    }

    // Make request with retry logic
    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts <= this.maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await this.fetchImpl(url.toString(), {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const json = await response.json();

        if (!response.ok) {
          const error = json as ApiError;
          throw new NeuroKindApiError(
            error.error,
            response.status,
            error.requestId,
            error.fieldErrors,
            error.retryAfter
          );
        }

        return json as ApiResponse<T>;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof NeuroKindApiError && error.statusCode < 500) {
          throw error;
        }

        // Don't retry if retry is disabled
        if (!this.retry) {
          throw error;
        }

        attempts++;

        // Wait before retrying (exponential backoff)
        if (attempts <= this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

// ===== Posts API =====

export interface Post {
  id: string;
  title: string;
  content: string;
  author?: {
    id: string;
    profile?: {
      username?: string;
      displayName?: string;
      avatarUrl?: string;
    };
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  voteScore: number;
  commentCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListPostsOptions {
  limit?: number;
  cursor?: string;
  sort?: 'hot' | 'top' | 'new';
  categoryId?: string;
  tag?: string;
  search?: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  categoryId: string;
  tags?: string[];
  isAnonymous?: boolean;
  images?: string[];
}

export class PostsApi {
  constructor(private client: NeuroKindClient) {}

  async list(options: ListPostsOptions = {}): Promise<ApiResponse<Post[]>> {
    return this.client.request('GET', '/api/posts', { query: options as any });
  }

  async get(id: string): Promise<ApiResponse<Post>> {
    return this.client.request('GET', `/api/posts/${id}`);
  }

  async create(input: CreatePostInput): Promise<ApiResponse<Post>> {
    return this.client.request('POST', '/api/posts', { body: input });
  }

  async update(id: string, input: Partial<CreatePostInput>): Promise<ApiResponse<Post>> {
    return this.client.request('PATCH', `/api/posts/${id}`, { body: input });
  }

  async delete(id: string): Promise<void> {
    await this.client.request('DELETE', `/api/posts/${id}`);
  }
}

// ===== Comments API =====

export interface Comment {
  id: string;
  content: string;
  author?: {
    id: string;
    profile?: {
      username?: string;
      displayName?: string;
      avatarUrl?: string;
    };
  };
  postId: string;
  parentCommentId?: string | null;
  voteScore: number;
  isAnonymous: boolean;
  status: string;
  _count?: {
    childComments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export class CommentsApi {
  constructor(private client: NeuroKindClient) {}

  async list(
    postId: string,
    options: { limit?: number; offset?: number; parentCommentId?: string | null } = {}
  ): Promise<ApiResponse<Comment[]>> {
    return this.client.request('GET', `/api/posts/${postId}/comments`, {
      query: options as any,
    });
  }

  async create(
    postId: string,
    input: { content: string; parentCommentId?: string }
  ): Promise<ApiResponse<Comment>> {
    return this.client.request('POST', `/api/posts/${postId}/comments`, { body: input });
  }

  async update(id: string, input: { content: string }): Promise<ApiResponse<Comment>> {
    return this.client.request('PATCH', `/api/comments/${id}`, { body: input });
  }

  async delete(id: string): Promise<void> {
    await this.client.request('DELETE', `/api/comments/${id}`);
  }
}

// ===== AI API =====

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
  tokensUsed: number;
}

export class AIApi {
  constructor(private client: NeuroKindClient) {}

  async chat(
    messages: ChatMessage[],
    conversationId?: string
  ): Promise<ApiResponse<ChatResponse>> {
    return this.client.request('POST', '/api/ai/chat', {
      body: { messages, conversationId },
    });
  }

  async getChatHistory(conversationId: string): Promise<ApiResponse<{ messages: ChatMessage[] }>> {
    return this.client.request('GET', '/api/ai/chat/history', {
      query: { conversationId },
    });
  }

  async textToSpeech(
    text: string,
    voice?: string
  ): Promise<ApiResponse<{ audioUrl: string }>> {
    return this.client.request('POST', '/api/ai/tts', {
      body: { text, voice },
    });
  }
}

// ===== Users API =====

export interface UserProfile {
  id: string;
  email: string;
  profile?: {
    username?: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    verifiedTherapist?: boolean;
  };
  roles: string[];
  createdAt: string;
}

export class UsersApi {
  constructor(private client: NeuroKindClient) {}

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.client.request('GET', '/api/user/profile');
  }

  async updateProfile(input: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<ApiResponse<UserProfile>> {
    return this.client.request('PATCH', '/api/user/profile', { body: input });
  }

  async exportData(): Promise<ApiResponse<{ downloadUrl: string; expiresAt: string }>> {
    return this.client.request('POST', '/api/user/export-data');
  }

  async deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
    return this.client.request('POST', '/api/user/delete-account', {
      body: { password, confirm: 'DELETE MY ACCOUNT' },
    });
  }
}

// ===== Daily Wins API =====

export interface DailyWin {
  id: string;
  title: string;
  description?: string;
  category?: string;
  date: string;
  isPrivate: boolean;
  createdAt: string;
}

export class DailyWinsApi {
  constructor(private client: NeuroKindClient) {}

  async list(options: {
    limit?: number;
    cursor?: string;
    category?: string;
  } = {}): Promise<ApiResponse<DailyWin[]>> {
    return this.client.request('GET', '/api/daily-wins', { query: options as any });
  }

  async create(input: {
    title: string;
    description?: string;
    category?: string;
    date: string;
    isPrivate?: boolean;
  }): Promise<ApiResponse<DailyWin>> {
    return this.client.request('POST', '/api/daily-wins', { body: input });
  }

  async getStreak(): Promise<ApiResponse<{ currentStreak: number; longestStreak: number }>> {
    return this.client.request('GET', '/api/daily-wins/streak');
  }
}

// ===== Therapy API =====

export interface TherapySession {
  id: string;
  sessionDate: string;
  therapyType: string;
  duration?: number;
  notes?: string;
  wentWell?: string;
  toWorkOn?: string;
  mood?: string;
  createdAt: string;
}

export class TherapyApi {
  constructor(private client: NeuroKindClient) {}

  async list(options: {
    limit?: number;
    cursor?: string;
    therapyType?: string;
  } = {}): Promise<ApiResponse<TherapySession[]>> {
    return this.client.request('GET', '/api/therapy-sessions', { query: options as any });
  }

  async create(input: {
    sessionDate: string;
    therapyType: string;
    duration?: number;
    notes?: string;
    wentWell?: string;
    toWorkOn?: string;
    mood?: string;
  }): Promise<ApiResponse<TherapySession>> {
    return this.client.request('POST', '/api/therapy-sessions', { body: input });
  }
}

// ===== Emergency API =====

export interface EmergencyCard {
  id: string;
  name: string;
  triggers?: string;
  calmingStrategies?: string;
  communication?: string;
  emergencyContacts?: Array<{ name: string; phone: string }>;
  createdAt: string;
}

export class EmergencyApi {
  constructor(private client: NeuroKindClient) {}

  async list(): Promise<ApiResponse<EmergencyCard[]>> {
    return this.client.request('GET', '/api/emergency-cards');
  }

  async create(input: {
    name: string;
    triggers?: string;
    calmingStrategies?: string;
    communication?: string;
    emergencyContacts?: Array<{ name: string; phone: string }>;
  }): Promise<ApiResponse<EmergencyCard>> {
    return this.client.request('POST', '/api/emergency-cards', { body: input });
  }
}

// ===== Connections API =====

export interface Connection {
  id: string;
  user: {
    id: string;
    profile?: {
      username?: string;
      displayName?: string;
      avatarUrl?: string;
    };
  };
  status: string;
  createdAt: string;
}

export class ConnectionsApi {
  constructor(private client: NeuroKindClient) {}

  async list(): Promise<ApiResponse<Connection[]>> {
    return this.client.request('GET', '/api/connections');
  }

  async sendRequest(receiverId: string): Promise<ApiResponse<Connection>> {
    return this.client.request('POST', '/api/connections', { body: { receiverId } });
  }

  async respond(id: string, action: 'accept' | 'reject'): Promise<ApiResponse<Connection>> {
    return this.client.request('PATCH', `/api/connections/${id}`, { body: { action } });
  }
}

// ===== Messages API =====

export interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    profile?: {
      username?: string;
      displayName?: string;
    };
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export class MessagesApi {
  constructor(private client: NeuroKindClient) {}

  async listConversations(): Promise<ApiResponse<Conversation[]>> {
    return this.client.request('GET', '/api/messages/conversations');
  }

  async getMessages(
    conversationId: string,
    options: { limit?: number; cursor?: string } = {}
  ): Promise<ApiResponse<Message[]>> {
    return this.client.request('GET', `/api/messages/conversations/${conversationId}`, {
      query: options as any,
    });
  }

  async send(
    conversationId: string,
    content: string,
    imageUrl?: string
  ): Promise<ApiResponse<Message>> {
    return this.client.request('POST', `/api/messages/conversations/${conversationId}`, {
      body: { content, imageUrl },
    });
  }
}

// ===== Notifications API =====

export interface Notification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt?: string | null;
  createdAt: string;
}

export class NotificationsApi {
  constructor(private client: NeuroKindClient) {}

  async list(options: {
    limit?: number;
    unreadOnly?: boolean;
  } = {}): Promise<ApiResponse<Notification[]>> {
    return this.client.request('GET', '/api/notifications', { query: options as any });
  }

  async markAsRead(notificationIds: string[]): Promise<ApiResponse<{ success: boolean }>> {
    return this.client.request('POST', '/api/notifications/mark-seen', {
      body: { notificationIds },
    });
  }
}

// ===== Default Export =====

export default NeuroKindClient;
