# @neurokind/api-client

Official TypeScript/JavaScript client for the NeuroKind API.

## Installation

```bash
npm install @neurokind/api-client
# or
yarn add @neurokind/api-client
# or
pnpm add @neurokind/api-client
```

## Quick Start

```typescript
import { NeuroKindClient } from '@neurokind/api-client';

// Create client instance
const client = new NeuroKindClient({
  baseUrl: 'https://api.neurokind.com',
  sessionToken: 'your-session-token',  // For v1 (session-based auth)
  // apiKey: 'your-api-key',            // For v2 (API key auth)
});

// List posts
const posts = await client.posts.list({
  limit: 20,
  sort: 'hot',
});

console.log(posts.data);
```

## Authentication

### Session-Based Authentication (v1)

```typescript
const client = new NeuroKindClient({
  sessionToken: 'your-session-token',
});
```

### API Key Authentication (v2+)

```typescript
const client = new NeuroKindClient({
  apiKey: 'nk_your_api_key',
});
```

## Usage Examples

### Posts

```typescript
// List posts
const posts = await client.posts.list({
  limit: 20,
  sort: 'hot',
  categoryId: 'cat_123',
  search: 'sensory overload',
});

// Get a post
const post = await client.posts.get('post_123');

// Create a post
const newPost = await client.posts.create({
  title: 'Tips for managing sensory overload',
  content: 'Here are some strategies...',
  categoryId: 'cat_123',
  tags: ['sensory', 'tips'],
  isAnonymous: false,
});

// Update a post
const updated = await client.posts.update('post_123', {
  title: 'Updated title',
  content: 'Updated content',
});

// Delete a post
await client.posts.delete('post_123');
```

### Comments

```typescript
// List comments for a post
const comments = await client.comments.list('post_123', {
  limit: 50,
  offset: 0,
  parentCommentId: null,  // Top-level comments only
});

// Create a comment
const comment = await client.comments.create('post_123', {
  content: 'Great tips!',
  parentCommentId: 'comment_456',  // Reply to another comment
});

// Update a comment
await client.comments.update('comment_123', {
  content: 'Updated comment',
});

// Delete a comment
await client.comments.delete('comment_123');
```

### AI Chat

```typescript
// Chat with AI
const response = await client.ai.chat([
  { role: 'user', content: 'I\'m feeling overwhelmed' },
]);

console.log(response.data.message.content);
console.log(`Tokens used: ${response.data.tokensUsed}`);

// Continue conversation
const followUp = await client.ai.chat(
  [
    { role: 'user', content: 'I\'m feeling overwhelmed' },
    { role: 'assistant', content: response.data.message.content },
    { role: 'user', content: 'What can I do right now?' },
  ],
  response.data.conversationId
);

// Get chat history
const history = await client.ai.getChatHistory('conv_123');

// Text-to-speech
const audio = await client.ai.textToSpeech('Hello, this is a test', 'en-US-Neural2-C');
console.log(audio.data.audioUrl);
```

### User Profile

```typescript
// Get current user profile
const profile = await client.users.getProfile();

// Update profile
await client.users.updateProfile({
  displayName: 'John Doe',
  bio: 'Autism advocate',
  avatarUrl: 'https://...',
});

// Export user data (GDPR)
const exportData = await client.users.exportData();
console.log(`Download URL: ${exportData.data.downloadUrl}`);
console.log(`Expires: ${exportData.data.expiresAt}`);

// Delete account (GDPR)
await client.users.deleteAccount('user_password');
```

### Daily Wins

```typescript
// List daily wins
const wins = await client.dailyWins.list({
  limit: 20,
  category: 'independence',
});

// Create a daily win
await client.dailyWins.create({
  title: 'Made breakfast independently',
  description: 'I made scrambled eggs without help!',
  category: 'independence',
  date: '2026-02-08',
  isPrivate: false,
});

// Get streak
const streak = await client.dailyWins.getStreak();
console.log(`Current streak: ${streak.data.currentStreak} days`);
```

### Therapy Sessions

```typescript
// List therapy sessions
const sessions = await client.therapy.list({
  limit: 20,
  therapyType: 'OT',
});

// Create a therapy session
await client.therapy.create({
  sessionDate: '2026-02-08',
  therapyType: 'OT',
  duration: 60,
  notes: 'Worked on fine motor skills',
  wentWell: 'Improved pencil grip',
  toWorkOn: 'Button fastening',
  mood: 'happy',
});
```

### Emergency Cards

```typescript
// List emergency cards
const cards = await client.emergency.list();

// Create an emergency card
await client.emergency.create({
  name: 'My Emergency Card',
  triggers: 'Loud noises, crowds',
  calmingStrategies: 'Deep breathing, noise-canceling headphones',
  communication: 'I may need time to process',
  emergencyContacts: [
    { name: 'Mom', phone: '555-0100' },
    { name: 'Dad', phone: '555-0101' },
  ],
});
```

### Connections

```typescript
// List connections
const connections = await client.connections.list();

// Send connection request
await client.connections.sendRequest('user_456');

// Accept connection request
await client.connections.respond('conn_123', 'accept');

// Reject connection request
await client.connections.respond('conn_123', 'reject');
```

### Messages

```typescript
// List conversations
const conversations = await client.messages.listConversations();

// Get messages in a conversation
const messages = await client.messages.getMessages('conv_123', {
  limit: 50,
  cursor: 'cursor_abc',
});

// Send a message
await client.messages.send('conv_123', 'Hello!', 'https://image-url...');
```

### Notifications

```typescript
// List notifications
const notifications = await client.notifications.list({
  limit: 20,
  unreadOnly: true,
});

// Mark notifications as read
await client.notifications.markAsRead(['notif_123', 'notif_456']);
```

## Error Handling

```typescript
import { NeuroKindClient, NeuroKindApiError } from '@neurokind/api-client';

const client = new NeuroKindClient();

try {
  const posts = await client.posts.list();
} catch (error) {
  if (error instanceof NeuroKindApiError) {
    console.error(`API Error: ${error.error} (${error.statusCode})`);
    console.error(`Request ID: ${error.requestId}`);

    // Handle specific errors
    switch (error.error) {
      case 'RATE_LIMIT_EXCEEDED':
        console.log(`Retry after ${error.retryAfter} seconds`);
        break;

      case 'VALIDATION_ERROR':
        console.log('Field errors:', error.fieldErrors);
        break;

      case 'UNAUTHORIZED':
        console.log('Please log in');
        break;
    }
  }
}
```

## Configuration Options

```typescript
const client = new NeuroKindClient({
  // Base URL (default: 'https://api.neurokind.com')
  baseUrl: 'https://api.neurokind.com',

  // Authentication
  apiKey: 'nk_your_api_key',        // v2+
  sessionToken: 'session_token',    // v1

  // Request timeout in milliseconds (default: 30000)
  timeout: 60000,

  // Enable automatic retries (default: true)
  retry: true,

  // Maximum number of retry attempts (default: 3)
  maxRetries: 5,

  // Custom fetch implementation
  fetch: customFetch,
});
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import type {
  Post,
  Comment,
  ChatMessage,
  DailyWin,
  TherapySession,
  ApiResponse,
} from '@neurokind/api-client';

const post: Post = {
  id: 'post_123',
  title: 'My Post',
  content: 'Content',
  // ... fully typed
};
```

## Pagination

```typescript
// Cursor-based pagination (posts, comments, messages)
let cursor: string | undefined;
const allPosts: Post[] = [];

do {
  const response = await client.posts.list({ limit: 100, cursor });
  allPosts.push(...response.data);
  cursor = response.pagination?.nextCursor || undefined;
} while (cursor);

// Offset-based pagination (admin endpoints)
const response = await client.posts.list({ limit: 20, offset: 40 });
console.log(`Total: ${response.pagination?.total}`);
```

## Rate Limiting

The API enforces rate limits:

- **Authentication**: 5 requests/minute
- **General API**: 100 requests/minute
- **AI Chat**: 20 requests/hour
- **File Uploads**: 10 requests/minute

Rate limit information is available in error responses:

```typescript
try {
  await client.posts.list();
} catch (error) {
  if (error.retryAfter) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  }
}
```

## Node.js vs Browser

The SDK works in both Node.js and browser environments:

```typescript
// Node.js
import { NeuroKindClient } from '@neurokind/api-client';

// Browser
import { NeuroKindClient } from '@neurokind/api-client';

// Using custom fetch (e.g., node-fetch in Node < 18)
import fetch from 'node-fetch';

const client = new NeuroKindClient({
  fetch: fetch as any,
});
```

## Support

- **Documentation**: https://docs.neurokind.com
- **API Reference**: https://docs.neurokind.com/api
- **Support**: support@neurokind.com
- **GitHub**: https://github.com/neurokind/neurokind
- **Discord**: https://discord.gg/neurokind

## License

MIT © NeuroKind
