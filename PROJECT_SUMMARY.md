# NeuroKid - Complete Project Summary

**Document Version:** 1.0  
**Last Updated:** January 18, 2026  
**Project Type:** Full-Stack Web Application  
**Primary Purpose:** Comprehensive autism support platform for families and professionals

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Design](#architecture--design)
4. [Database Schema](#database-schema)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Features & Functionality](#features--functionality)
8. [Security Implementation](#security-implementation)
9. [File Structure](#file-structure)
10. [Development Workflow](#development-workflow)

---

## 🎯 Project Overview

### What is NeuroKid?

NeuroKid is a **comprehensive digital platform** designed to support families navigating autism spectrum disorder (ASD). It combines:

- **Community Forum** - Reddit-style discussion platform
- **Provider Directory** - Database of autism specialists
- **AI Support Assistant** - 24/7 AI-powered guidance
- **Screening Tools** - Age-appropriate autism assessments
- **Resource Library** - Curated educational content

### Mission & Vision

**Mission:** Empower parents and caregivers with evidence-based information, professional access, peer support, AI assistance, and validated screening tools.

**Vision:** To be the most trusted and comprehensive resource platform for autism families worldwide.

---

## 💻 Technology Stack

### Why These Technologies?

Each technology was chosen for specific reasons:

### **Frontend Stack**

| Technology               | Version | Why We Chose It                                                                                                                                   |
| ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js**              | 16.1.2  | Modern React framework with App Router, server-side rendering (SSR), static site generation (SSG), API routes, and excellent developer experience |
| **React**                | 19.2.3  | Industry-standard UI library with component-based architecture, virtual DOM for performance, and massive ecosystem                                |
| **TypeScript**           | 5.x     | Type safety prevents bugs, better IDE support, self-documenting code, and improved maintainability                                                |
| **Tailwind CSS**         | 4.x     | Utility-first CSS framework for rapid UI development, consistent design system, and minimal CSS bundle size                                       |
| **TanStack React Query** | 5.90.18 | Server state management, automatic caching, background refetching, and optimistic updates                                                         |

### **Backend Stack**

| Technology             | Version | Why We Chose It                                                                                                    |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| **Next.js API Routes** | 16.1.2  | Serverless backend functions, same codebase as frontend, automatic API routing, and easy deployment                |
| **NextAuth.js**        | 4.24.0  | Complete authentication solution with OAuth support, session management, and secure credential handling            |
| **Prisma ORM**         | 5.22.0  | Type-safe database client, automatic migrations, intuitive schema definition, and excellent TypeScript integration |
| **PostgreSQL**         | 16      | Robust relational database with ACID compliance, complex query support, full-text search, and proven reliability   |
| **Redis**              | 7       | In-memory data store for caching, rate limiting, session storage, and real-time features                           |

### **Development Tools**

| Tool               | Purpose                                                          |
| ------------------ | ---------------------------------------------------------------- |
| **Docker Compose** | Local development environment with PostgreSQL + Redis containers |
| **ESLint**         | Code quality and consistency enforcement                         |
| **Turbopack**      | Fast bundler for development (Next.js 16 default)                |
| **tsx**            | TypeScript execution for database seeding                        |

### **External Services**

| Service          | Purpose                                                               |
| ---------------- | --------------------------------------------------------------------- |
| **Groq API**     | AI chat functionality using Llama 3.3 70B model (free tier available) |
| **Google OAuth** | Social login authentication                                           |
| **Vercel**       | Recommended deployment platform (production)                          |

---

## 🏗️ Architecture & Design

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  React UI  │  │  Next.js   │  │   Auth     │            │
│  │ Components │←→│  Router    │←→│  Session   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Middleware│  │  API       │  │  Server    │            │
│  │  (Auth)    │→ │  Routes    │←→│  Components│            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         ↓              ↓                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Prisma    │  │  Redis     │  │  External  │            │
│  │  Client    │  │  Client    │  │  APIs      │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
        ↓              ↓              ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │ │  Groq API    │
│  Database    │ │   Cache      │ │  (AI Chat)   │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Design Patterns Used

1. **Repository Pattern**: Prisma abstracts database operations
2. **Middleware Pattern**: Authentication and security headers
3. **API Route Handlers**: RESTful API endpoints in Next.js
4. **Server Components**: React Server Components for improved performance
5. **Client Components**: Interactive UI with "use client" directive
6. **Token Bucket Algorithm**: Rate limiting implementation
7. **Role-Based Access Control (RBAC)**: Authorization system

### Why Next.js App Router?

- **Server Components by Default**: Reduced JavaScript bundle, better performance
- **Streaming & Suspense**: Progressive page loading
- **File-Based Routing**: Intuitive route organization
- **API Routes**: Backend and frontend in one codebase
- **Automatic Code Splitting**: Optimized bundle sizes
- **Built-in Middleware**: Authentication and security

---

## 🗄️ Database Schema

### Database: PostgreSQL

**Why PostgreSQL?**

- Relational data model fits our complex relationships
- ACID compliance for data integrity
- Full-text search capabilities
- JSON support for flexible data (notification preferences, metadata)
- Proven reliability and performance at scale

### Core Data Models

#### 1. **Authentication & Users**

```prisma
User {
  - id: String (CUID)
  - email: String (unique)
  - hashedPassword: String
  - createdAt, updatedAt, lastLoginAt: DateTime

  Relations:
  - profile: Profile (1:1)
  - userRoles: UserRole[] (1:many)
  - posts, comments, votes, bookmarks (1:many)
}

Profile {
  - userId: String (unique)
  - username: String (unique, 50 chars)
  - displayName: String (255 chars)
  - bio, avatarUrl, location, website
  - verifiedTherapist: Boolean
  - shadowbanned: Boolean
  - notificationPrefs: JSON
}

UserRole {
  - userId, role: Role (composite unique)
  - Enum Role: PARENT | THERAPIST | MODERATOR | ADMIN
}
```

#### 2. **Community Forum**

```prisma
Category {
  - id, name, slug: String
  - description, icon: String
  - order: Int
}

Tag {
  - id, name, slug: String
  - color: String (hex color)
}

Post {
  - id, title, content
  - authorId (nullable for anonymous)
  - categoryId: String
  - isAnonymous: Boolean
  - status: PostStatus (ACTIVE | REMOVED | LOCKED | PINNED | DRAFT)
  - viewCount, commentCount, voteScore: Int
  - isPinned, isLocked: Boolean

  Relations:
  - author: User
  - category: Category
  - tags: Tag[] (many-to-many)
  - comments: Comment[]
}

Comment {
  - id, content, authorId, postId
  - parentCommentId (for nested comments)
  - status: CommentStatus (ACTIVE | REMOVED | HIDDEN)
  - isAnonymous: Boolean
  - voteScore: Int

  Relations:
  - author: User
  - post: Post
  - parentComment: Comment (self-relation)
  - childComments: Comment[]
}

Vote {
  - userId, targetType, targetId
  - value: Int (-1 or +1)
  - Unique constraint: [userId, targetId, targetType]
}

Bookmark {
  - userId, postId
  - Unique constraint: [userId, postId]
}
```

#### 3. **Moderation System**

```prisma
Report {
  - reporterId, targetType, targetId
  - reason: ReportReason (SPAM | HARASSMENT | MISINFO | SELF_HARM | etc.)
  - status: ReportStatus (OPEN | UNDER_REVIEW | RESOLVED | DISMISSED)
  - description, notes
  - reviewedBy, reviewedAt
}

ModerationAction {
  - action: ModerationActionType (REMOVE | LOCK | PIN | SHADOWBAN | WARN | etc.)
  - actorId (moderator)
  - targetUserId, postId, commentId
  - notes
}

ModActionLog {
  - Complete audit trail of all moderation actions
}
```

#### 4. **Provider Directory**

```prisma
Provider {
  - externalSource: ProviderSource (GOOGLE_PLACES | OSM | MANUAL)
  - externalId: String
  - name, phone, email, website
  - address, city, state, zipCode
  - latitude, longitude: Float
  - specialties: ProviderSpecialty[] (ABA | OT | SLP | etc.)
  - rating: Decimal, totalReviews: Int
  - isVerified: Boolean
  - claimedByUserId
}

ProviderReview {
  - providerId, authorId
  - rating: Int (1-5)
  - content, status
  - helpful: Int (upvote count)
}
```

#### 5. **AI Chat System**

```prisma
AIConversation {
  - userId, title
  - messages: AIMessage[]
}

AIMessage {
  - conversationId, userId
  - role: String ("user" | "assistant" | "system")
  - content, tokens
}
```

#### 6. **Supporting Systems**

```prisma
Notification {
  - userId, type: NotificationType
  - payload: JSON (flexible data)
  - readAt
}

Resource {
  - title, content, link
  - category: ResourceCategory
  - createdBy, status
  - views: Int
}

AuditLog {
  - userId, action, targetType, targetId
  - changes: JSON
  - ipAddress, userAgent
}

RateLimitLog {
  - userId, actionType
  - For tracking rate limit hits
}
```

### Database Indexes

**Strategic indexing for performance:**

- **User lookups**: `email`, `createdAt`
- **Post queries**: `authorId`, `categoryId`, `status`, `createdAt`, `viewCount`
- **Comment queries**: `authorId`, `postId`, `parentCommentId`, `status`
- **Vote lookups**: Composite index on `[userId, targetId, targetType]`
- **Geospatial**: Composite index on `[latitude, longitude]` for provider search
- **Search optimization**: Indexes on `name`, `slug`, `username`

---

## ⚙️ Backend Implementation

### API Routes Structure

**Located in:** `web/src/app/api/`

#### Authentication APIs

```
/api/auth/[...nextauth]/route.ts  - NextAuth.js configuration
  - Credentials provider (email/password)
  - Google OAuth provider
  - Session management
  - JWT token handling

/api/auth/register/route.ts       - User registration
  - POST: Create new user account
  - Password hashing with bcrypt
  - Automatic PARENT role assignment
  - Profile creation
```

#### Community APIs

```
/api/posts/route.ts
  - GET: List posts (with pagination, sorting, filtering)
  - POST: Create new post

/api/posts/[id]/route.ts
  - GET: Get single post details
  - PUT: Update post (author only)
  - DELETE: Delete post (author/moderator)

/api/posts/[id]/comments/route.ts
  - GET: Get post comments (with nested replies)
  - POST: Create comment

/api/comments/[id]/route.ts
  - PUT: Update comment
  - DELETE: Delete comment

/api/categories/route.ts
  - GET: List all categories

/api/tags/route.ts
  - GET: List all tags

/api/votes/route.ts
  - POST: Create/update/remove vote

/api/bookmarks/route.ts
  - GET: Get user bookmarks
  - POST: Toggle bookmark
```

#### Moderation APIs

```
/api/reports/route.ts
  - GET: List reports (moderator only)
  - POST: Create report

/api/reports/[id]/route.ts
  - PUT: Update report status (moderator only)

/api/mod/reports/route.ts
  - GET: Moderation dashboard data
```

#### Provider APIs

```
/api/providers/route.ts
  - GET: Search providers by location/specialty
  - Returns filtered provider list from database
```

#### AI Support APIs

```
/api/ai/chat/route.ts
  - POST: Send message to AI assistant
  - Integration with Groq API (Llama 3.3 70B)
  - Context-aware autism guidance
  - Rate limiting (10 requests per minute)
```

#### User Management APIs

```
/api/user/profile/route.ts
  - GET: Get current user profile
  - PUT: Update user profile

/api/user/change-password/route.ts
  - POST: Change password

/api/user/delete-account/route.ts
  - DELETE: Delete user account

/api/resources/route.ts
  - GET: List resources (filtered by category)
```

#### Health Check API

```
/api/health/route.ts
  - GET: System health check
  - Database connectivity test
  - Redis connectivity test (optional)
  - Returns status + version
```

### Core Backend Libraries

#### Authentication (`lib/auth.ts`)

```typescript
Features:
- getServerSession(): Get authenticated session
- getCurrentUser(): Get user with profile and roles
- requireAuth(): Throw error if not authenticated
- getUserById(): Admin lookup by ID
```

#### Authorization (`lib/rbac.ts`)

```typescript
Role-Based Access Control:
- hasRole(userId, role): Check user role
- hasAnyRole(userId, roles[]): Check multiple roles
- requireRole(role): Enforce role requirement
- getUserRoles(userId): Get all user roles
- currentUserHasRole(role): Check current user role
```

#### Security (`lib/security.ts`)

```typescript
Security Utilities:
- sanitizeUser(): Remove sensitive fields (passwords)
- sanitizeError(): Safe error messages for production
- sanitizeInput(): Prevent injection attacks
- isDisposableEmail(): Block disposable email domains
- removeNullFields(): Clean response objects
```

#### Rate Limiting (`lib/rateLimit.ts`)

```typescript
Token Bucket Algorithm:
- Redis-based (production)
- In-memory fallback (development)
- Configurable limits per action
- Automatic retry-after calculation

Usage:
const limiter = new RateLimiter("register", 3, 3600); // 3 per hour
if (!await limiter.checkLimit(ipAddress)) {
  return 429 Rate Limit Exceeded
}
```

#### Caching (`lib/cache.ts`)

```typescript
Redis Integration:
- Lazy connection initialization
- Automatic fallback handling
- Cache invalidation helpers
- TTL management
```

#### Database Client (`lib/prisma.ts`)

```typescript
Prisma Client Singleton:
- Single instance across app
- Connection pooling
- Development hot-reload safe
- Type-safe queries
```

### Middleware (`middleware.ts`)

**Purpose:** Global request processing before route handlers

```typescript
Features:
1. Authentication Check
   - Public routes: /, /login, /register, /about
   - Public APIs: /api/auth/*, /api/health
   - Protected routes: Redirect to /login if not authenticated

2. Security Headers
   - X-Frame-Options: DENY (prevent clickjacking)
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: Restrict browser APIs
   - Content-Security-Policy: Strict CSP rules
   - HSTS: Force HTTPS in production

3. Request Logging
   - Path and authentication status
   - Helps debugging auth issues
```

---

## 🎨 Frontend Implementation

### UI Framework: React + TypeScript

**Why React?**

- Component reusability
- Virtual DOM performance
- Massive ecosystem and community
- Excellent TypeScript support
- Hooks for state management

**Why TypeScript?**

- Type safety prevents runtime errors
- Better IDE autocomplete and refactoring
- Self-documenting code
- Easier team collaboration

### Styling: Tailwind CSS 4

**Why Tailwind CSS?**

- Rapid development with utility classes
- Consistent design system
- Minimal CSS bundle (unused styles purged)
- Responsive design utilities
- Dark mode support built-in
- Customizable design tokens

**Design System:**

```css
Colors:
- Primary: Blue (#3B82F6)
- Accent: Purple/Indigo
- Semantic: Success (green), Error (red), Warning (orange)

Typography:
- Font Family: Geist Sans (primary), Geist Mono (code)
- Scale: text-xs to text-6xl

Spacing:
- Consistent 4px grid
- gap-2, gap-4, gap-6, etc.

Borders & Radius:
- rounded-lg, rounded-xl, rounded-2xl
- Soft, modern aesthetic
```

### Component Architecture

#### Page Components

**Located in:** `web/src/app/*/page.tsx`

```
Landing Page (/)
- Hero section with value proposition
- 4 pillars showcase (Community, Providers, AI, Screening)
- CTA buttons (Sign In, Join Now)
- Auto-redirect authenticated users to /dashboard

Authentication Pages
- /login: Credential + Google OAuth login
- /register: Email/password registration with validation

Dashboard (/dashboard)
- Personalized welcome
- Quick access to all features
- Recent activity feed

Community Forum (/community)
- Post listing with filters (Hot, New, Top)
- Category sidebar
- Search functionality
- Sort tabs
- Pagination

Post Detail (/community/[id])
- Full post content
- Author information
- Vote buttons
- Comment thread (nested replies)
- Bookmark & report buttons

Create Post (/community/new)
- Rich text editor
- Category selection
- Tag selection (multi-select)
- Anonymous posting option

Provider Directory (/providers)
- Search by location
- Filter by specialty, age group
- Provider cards with ratings
- Map integration ready

AI Support (/ai-support)
- Chat interface
- Message history
- Context-aware responses
- Rate limiting indicator

Screening Tools (/screening)
- Age selection form
- Multi-group support (toddler, child, teen, adult)
- Questionnaire interface
- Results page with recommendations

Resource Library (/resources)
- Filterable resource cards
- Categories (Education, Therapy, Behavior, etc.)
- External links
- View tracking

Moderation Panel (/moderation)
- Report queue (moderator only)
- Bulk actions
- Moderation history
- User management

Settings (/settings)
- Profile editing
- Password change
- Account deletion
- Notification preferences
```

#### Reusable UI Components

**Located in:** `web/src/components/ui/`

```typescript
Button.tsx
- Variants: primary, secondary, outline, ghost
- Sizes: sm, md, lg
- Loading state support
- Disabled state styling

Card.tsx
- Consistent card layout
- Header, body, footer sections
- Hover effects

Input.tsx
- Text, email, password, number types
- Error state styling
- Label integration
- Validation feedback

Drawer.tsx
- Side panel component
- Smooth animations
- Overlay backdrop
- Mobile-friendly
```

#### Community Components

**Located in:** `web/src/components/community/`

```typescript
PostCard.tsx
- Compact post preview
- Vote buttons (vertical on desktop, horizontal on mobile)
- Author info, category badge, tags
- Status indicators (Pinned, Locked, Removed)
- Comment count, timestamp

CommentThread.tsx
- Nested comment display
- Reply functionality
- Collapse/expand threads
- Vote buttons per comment

CategorySidebar.tsx
- Category navigation
- Active category highlight
- Post counts per category

SearchBar.tsx
- Debounced search input
- Search suggestions
- Clear button

SortTabs.tsx
- Hot, New, Top sorting
- Active tab indication
- Responsive design

TagSelector.tsx
- Multi-select tag picker
- Tag creation
- Color-coded tags

VoteButtons.tsx
- Upvote/downvote UI
- Score display
- Optimistic updates
- Authentication check

BookmarkButton.tsx
- Toggle bookmark status
- Filled/outline states
- Optimistic UI updates

ReportButton.tsx
- Report modal trigger
- Reason selection
- Form validation

PostEditor.tsx
- Rich text composition
- Markdown support
- Preview mode
- Auto-save (future)

EmptyState.tsx
- No content placeholder
- Action suggestions
- Friendly messaging

LoadingSkeletons.tsx
- Skeleton screens for posts
- Improved perceived performance
```

#### Navigation Component

**Located in:** `web/src/components/navbar.tsx`

```typescript
NavBar Features:
- Logo and branding
- Authentication-aware navigation
- Desktop: Full menu
- Mobile: Hamburger menu
- User profile dropdown
- Logout functionality
- Active route highlighting
```

### State Management

#### Server State (TanStack React Query)

**Why React Query?**

- Automatic caching
- Background refetching
- Optimistic updates
- Deduplication of requests
- Built-in loading and error states

```typescript
Example Usage:
const { data: posts, isLoading } = useQuery({
  queryKey: ['posts', category, sort],
  queryFn: () => fetchPosts(category, sort)
});
```

#### Client State (React Hooks)

```typescript
useState - Local component state
useEffect - Side effects
useCallback - Memoized callbacks
useMemo - Memoized values
useContext - Theme, session context
```

#### Session Management (NextAuth)

```typescript
const { data: session, status } = useSession();

Session provides:
- user.id
- user.email
- user.name
- user.roles
- Access token
```

### Routing Strategy

**File-Based Routing (Next.js App Router)**

```
Directory structure = URL structure

src/app/
  page.tsx          → /
  about/page.tsx    → /about
  community/
    page.tsx        → /community
    [id]/page.tsx   → /community/123
    new/page.tsx    → /community/new
  api/
    posts/route.ts  → /api/posts
```

**Benefits:**

- Intuitive organization
- Automatic route creation
- Type-safe navigation
- Dynamic routes with [param]
- Route groups with (folder)

---

## 🎯 Features & Functionality

### 1. Community Forum (Reddit-Style)

**What We Built:**

- Full-featured discussion platform
- Post creation with categories and tags
- Nested comment threads (infinite depth)
- Voting system (upvote/downvote)
- Bookmark functionality
- Anonymous posting option
- Content moderation system
- Search and filtering
- Sorting (Hot, New, Top)
- Pagination

**How It Works:**

1. User creates post → Stored in Post table
2. Other users comment → Comment table with parentCommentId for nesting
3. Voting → Vote table with composite unique constraint
4. Moderators can lock, pin, remove content
5. Report system for community moderation

**Technologies:**

- React for UI
- Next.js API routes for backend
- Prisma for database operations
- Optimistic updates for instant feedback

### 2. Provider Directory

**What We Built:**

- Searchable database of autism specialists
- Filter by specialty (ABA, OT, SLP, etc.)
- Location-based search
- Provider profiles with contact info
- Rating and review system
- Provider claim requests

**Data Sources:**

- Google Places API integration (ready)
- OpenStreetMap integration (ready)
- Manual entry by admins

**Technologies:**

- PostgreSQL with geospatial indexing
- JSON data storage for provider seed data
- Decimal type for precise ratings

### 3. AI Support Assistant

**What We Built:**

- Real-time chat interface
- Context-aware autism guidance
- Evidence-based responses
- Conversation history
- Token usage tracking
- Rate limiting (10 per minute)

**AI Model:**

- Groq API with Llama 3.3 70B
- Fast inference (free tier)
- System prompt with autism expertise
- Safety guardrails (no medical diagnosis)

**How It Works:**

1. User sends message
2. Backend adds to AIConversation + AIMessage tables
3. Calls Groq API with conversation history
4. Returns AI response
5. Stores response in database
6. Updates conversation title

**Technologies:**

- Groq API (OpenAI-compatible)
- Streaming responses (future enhancement)
- React hooks for chat UI

### 4. Screening Tools

**What We Built:**

- Age-appropriate questionnaires
- Toddler (18-36 months) screening
- Child (3-12 years) screening
- Instant risk assessment
- Personalized recommendations
- Provider connection flow

**Questionnaires:**

- Based on M-CHAT, SCQ standards
- Multiple-choice format
- Scoring algorithm
- Risk categories (Low, Moderate, High)

**How It Works:**

1. Parent enters child age
2. Routed to appropriate questionnaire
3. Answers stored in sessionStorage
4. Scoring calculated client-side
5. Results page with next steps
6. Option to save (future: in database)

**Technologies:**

- React forms
- Client-side scoring for privacy
- TypeScript for type-safe questionnaire data

### 5. Authentication & Authorization

**What We Built:**

- Email/password registration
- Email/password login
- Google OAuth integration
- Session management
- Role-based access control
- Password change
- Account deletion

**Roles:**

- PARENT (default)
- THERAPIST (verified)
- MODERATOR
- ADMIN

**Security Measures:**

- bcrypt password hashing
- JWT tokens
- Secure HTTP-only cookies
- CSRF protection (NextAuth built-in)
- Rate limiting on auth endpoints

**Technologies:**

- NextAuth.js v4
- Prisma adapter
- bcrypt for hashing
- JWT for tokens

### 6. Moderation System

**What We Built:**

- User reporting system
- Moderation queue
- Bulk moderation actions
- Moderation audit log
- Shadowban functionality
- Content locking/pinning
- User warnings

**Moderator Capabilities:**

- Review reports
- Remove content
- Lock posts (prevent comments)
- Pin posts (sticky to top)
- Shadowban users (hide content from others)
- Verify therapist accounts

**Technologies:**

- RBAC system
- Audit logging
- Status tracking (Open, Under Review, Resolved)

### 7. Resource Library

**What We Built:**

- Curated resource database
- Categories (Education, Therapy, Behavior, etc.)
- External link support
- View tracking
- Admin management

**Technologies:**

- Simple CRUD operations
- PostgreSQL for storage
- Filtering by category

### 8. User Dashboard

**What We Built:**

- Personalized landing page
- Quick access to features
- User statistics (future)
- Recent activity feed (future)
- Notifications (future)

### 9. Security Features

**What We Implemented:**

#### Headers (middleware.ts)

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: Strict CSP
- HSTS (production only)
- Permissions-Policy: Restrict APIs

#### Input Validation

- Zod schemas for API validation
- Sanitization functions
- Max length checks
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (DOMPurify for HTML)

#### Rate Limiting

- Redis-based (production)
- In-memory fallback (development)
- Per-action limits
- IP-based tracking
- Token bucket algorithm

#### Data Protection

- Password hashing (bcrypt, 12 rounds)
- Sensitive data removal in API responses
- Audit logging
- Secure session management

---

## 🔒 Security Implementation

### Authentication Flow

```
1. User Registration
   → Email/password validation
   → Password hashing (bcrypt, 12 rounds)
   → User + Profile creation
   → PARENT role assignment
   → Auto-login with session

2. User Login
   → Credential verification
   → bcrypt.compare(password, hashedPassword)
   → Session creation (NextAuth)
   → JWT token in HTTP-only cookie
   → Client receives session

3. Protected Routes
   → Middleware checks for token
   → Redirects to /login if missing
   → Passes callbackUrl for post-login redirect

4. API Authorization
   → getServerSession() in route handlers
   → Extract user.id from session
   → Check user roles if needed
   → Return 401 Unauthorized if invalid
```

### Input Validation

**Zod Schemas** for type-safe validation:

```typescript
Example (Post Creation):
const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(10000),
  categoryId: z.string().cuid(),
  tagIds: z.array(z.string().cuid()).optional(),
  isAnonymous: z.boolean().default(false)
});

Usage in API:
const body = await request.json();
const validated = createPostSchema.parse(body);
// Throws error if invalid
```

### SQL Injection Prevention

**Prisma ORM** automatically parameterizes all queries:

```typescript
// Safe - Prisma uses parameterized queries
const posts = await prisma.post.findMany({
  where: { categoryId: userInput },
});

// Never needed:
// prisma.$queryRaw`SELECT * FROM Post WHERE id = ${userInput}` ❌
```

### XSS Prevention

**Strategies:**

1. React auto-escapes rendered content
2. DOMPurify for user-generated HTML (markdown)
3. Content-Security-Policy headers
4. No `dangerouslySetInnerHTML` unless sanitized

### CSRF Protection

**NextAuth.js built-in:**

- CSRF tokens in forms
- SameSite cookie attribute
- Origin header validation

### Rate Limiting

**Implementation locations:**

- Registration: 3 per hour per IP
- Login: 5 per 15 minutes per IP
- AI chat: 10 per minute per user
- Report creation: 5 per hour per user
- Comment posting: 20 per hour per user

### Sensitive Data Handling

**Never expose:**

- Hashed passwords (sanitizeUser removes)
- Internal IDs in URLs (using CUIDs)
- Stack traces in production (sanitizeError)
- Database credentials (environment variables)

---

## 📂 File Structure

### Complete Project Structure

```
neurokid/
├── README.md                    # Project documentation
├── docker-compose.yml           # PostgreSQL + Redis containers
├── PROJECT_SUMMARY.md           # This document
│
├── prisma/                      # Database layer
│   └── schema.prisma           # Root schema (imports from web/)
│
└── web/                        # Main Next.js application
    ├── package.json            # Dependencies and scripts
    ├── tsconfig.json           # TypeScript configuration
    ├── next.config.ts          # Next.js configuration
    ├── middleware.ts           # Global middleware (auth + security)
    ├── eslint.config.mjs       # ESLint rules
    ├── postcss.config.mjs      # PostCSS for Tailwind
    ├── tailwind.config.ts      # Tailwind CSS configuration
    │
    ├── prisma/                 # Database schema and migrations
    │   ├── schema.prisma       # Prisma data models
    │   ├── seed.ts             # Database seeding script
    │   └── migrations/         # Migration history
    │       └── 20260117211927_init/
    │           └── migration.sql
    │
    ├── public/                 # Static assets
    │   └── favicon.ico
    │
    ├── scripts/                # Utility scripts
    │   ├── test-api.ps1       # PowerShell API tester
    │   ├── test-smoke.mjs     # Smoke tests
    │   └── test-create-post.mjs
    │
    └── src/                    # Source code
        ├── app/                # Next.js App Router
        │   ├── layout.tsx      # Root layout (NavBar, SessionProvider)
        │   ├── page.tsx        # Landing page
        │   ├── globals.css     # Global styles (Tailwind imports)
        │   ├── providers.tsx   # Client providers wrapper
        │   ├── theme-provider.tsx
        │   │
        │   ├── (auth)/         # Auth route group
        │   │   ├── layout.tsx  # Auth-specific layout
        │   │   ├── login/page.tsx
        │   │   └── register/page.tsx
        │   │
        │   ├── about/page.tsx
        │   ├── dashboard/page.tsx
        │   ├── trust/page.tsx
        │   │
        │   ├── community/      # Forum pages
        │   │   ├── page.tsx    # Post listing
        │   │   ├── [id]/page.tsx  # Post detail
        │   │   └── new/page.tsx   # Create post
        │   │
        │   ├── providers/page.tsx
        │   ├── ai-support/page.tsx
        │   ├── screening/
        │   │   ├── page.tsx    # Screening intro
        │   │   ├── [group]/page.tsx  # Questionnaire
        │   │   └── result/page.tsx
        │   │
        │   ├── resources/page.tsx
        │   ├── bookmarks/page.tsx
        │   ├── settings/page.tsx
        │   │
        │   ├── moderation/     # Moderation panel
        │   │   ├── page.tsx
        │   │   └── [id]/page.tsx
        │   │
        │   └── api/            # API routes
        │       ├── health/route.ts
        │       │
        │       ├── auth/
        │       │   ├── [...nextauth]/route.ts  # NextAuth config
        │       │   └── register/route.ts
        │       │
        │       ├── posts/
        │       │   ├── route.ts           # GET, POST
        │       │   └── [id]/
        │       │       ├── route.ts       # GET, PUT, DELETE
        │       │       └── comments/route.ts
        │       │
        │       ├── comments/[id]/route.ts
        │       ├── votes/route.ts
        │       ├── bookmarks/route.ts
        │       ├── categories/route.ts
        │       ├── tags/route.ts
        │       │
        │       ├── providers/route.ts
        │       ├── resources/route.ts
        │       │
        │       ├── ai/chat/route.ts
        │       │
        │       ├── reports/
        │       │   ├── route.ts           # GET, POST
        │       │   └── [id]/route.ts      # PUT
        │       │
        │       ├── mod/reports/route.ts
        │       │
        │       └── user/
        │           ├── profile/route.ts
        │           ├── change-password/route.ts
        │           └── delete-account/route.ts
        │
        ├── components/         # React components
        │   ├── navbar.tsx      # Main navigation
        │   ├── FacilitySearchExample.tsx
        │   │
        │   ├── ui/             # Reusable UI components
        │   │   ├── Button.tsx
        │   │   ├── Card.tsx
        │   │   ├── Input.tsx
        │   │   ├── Drawer.tsx
        │   │   ├── index.ts
        │   │   └── README.md
        │   │
        │   ├── community/      # Forum components
        │   │   ├── PostCard.tsx
        │   │   ├── PostEditor.tsx
        │   │   ├── CommentThread.tsx
        │   │   ├── CommentComposer.tsx
        │   │   ├── VoteButtons.tsx
        │   │   ├── BookmarkButton.tsx
        │   │   ├── ReportButton.tsx
        │   │   ├── CategorySidebar.tsx
        │   │   ├── SearchBar.tsx
        │   │   ├── SortTabs.tsx
        │   │   ├── TagSelector.tsx
        │   │   ├── EmptyState.tsx
        │   │   └── LoadingSkeletons.tsx
        │   │
        │   └── theme/
        │       ├── ThemeProvider.tsx
        │       └── ThemeToggle.tsx
        │
        ├── lib/                # Utility libraries
        │   ├── prisma.ts       # Prisma client singleton
        │   ├── auth.ts         # Auth utilities
        │   ├── rbac.ts         # Role-based access control
        │   ├── security.ts     # Security utilities
        │   ├── rateLimit.ts    # Rate limiting
        │   ├── cache.ts        # Redis cache
        │   ├── redis.ts        # Redis client
        │   ├── env.ts          # Environment variables
        │   ├── validators.ts   # Validation utilities
        │   ├── facilities.ts   # Provider search logic
        │   ├── next-auth.d.ts  # NextAuth type extensions
        │   │
        │   ├── actions/        # Server actions (future)
        │   ├── clients/        # External API clients
        │   ├── constants/      # App constants
        │   ├── hooks/          # Custom React hooks
        │   ├── services/       # Business logic services
        │   ├── types/          # TypeScript type definitions
        │   └── validations/    # Zod schemas
        │
        ├── data/
        │   └── providers.json  # Seed data for providers
        │
        └── generated/          # Generated Prisma client
            └── prisma/         # (auto-generated, not committed)
```

### Key Configuration Files

#### package.json

- **Dependencies**: React, Next.js, Prisma, NextAuth, etc.
- **Scripts**: dev, build, lint, db:push, db:seed
- **Dev Dependencies**: TypeScript, ESLint, Tailwind

#### tsconfig.json

- **Target**: ES2017
- **Module**: esnext
- **JSX**: react-jsx (React 19)
- **Paths**: `@/*` → `./src/*`
- **Strict mode**: Enabled

#### next.config.ts

- **Images**: Remote patterns for Google OAuth avatars
- **TypeScript**: Enabled by default
- **Turbopack**: Default bundler in Next.js 16

#### docker-compose.yml

- **PostgreSQL 16**: Port 5432
- **Redis 7**: Port 6379
- **Volumes**: Persistent data storage

---

## 🛠️ Development Workflow

### Local Development Setup

**Prerequisites:**

- Node.js 20+
- Docker Desktop (for PostgreSQL + Redis)
- Git

**Initial Setup:**

```bash
# 1. Clone repository
git clone https://github.com/pulishashank8/neurokid.git
cd neurokid

# 2. Install dependencies
cd web
npm install

# 3. Start database containers
docker-compose up -d

# 4. Configure environment
cp .env.example .env.local
# Edit .env.local with:
# - DATABASE_URL
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
# - GOOGLE_CLIENT_ID (optional)
# - GOOGLE_CLIENT_SECRET (optional)
# - GROQ_API_KEY (optional)
# - REDIS_URL (optional)

# 5. Run database migrations
npx prisma migrate deploy

# 6. Seed database
npm run db:seed

# 7. Start development server
npm run dev

# 8. Open browser
# http://localhost:3000
```

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Database commands
npm run db:push          # Push schema changes
npm run db:seed          # Seed sample data
npm run db:generate      # Regenerate Prisma client
npm run db:studio        # Open Prisma Studio GUI

# API testing
npm run api:health       # Test health endpoint
npm run api:posts        # Test posts endpoint
npm run test:smoke       # Run smoke tests

# Migrations
npm run prisma:migrate:deploy  # Apply migrations
npm run prisma:migrate:status  # Check migration status
npm run prisma:migrate:reset   # Reset database
```

### Git Workflow

**Branch Strategy:**

- `main` - Production-ready code
- Feature branches for development

**Commit Conventions:**

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `style:` - Code formatting
- `refactor:` - Code restructuring
- `test:` - Tests
- `chore:` - Build/config changes

### Deployment

**Recommended Platform: Vercel**

**Why Vercel?**

- Built by Next.js creators
- Zero-configuration deployment
- Automatic CI/CD
- Serverless functions
- Global CDN
- Free tier available

**Deployment Steps:**

1. Push to GitHub
2. Connect Vercel to repository
3. Configure environment variables
4. Deploy (automatic on push)

**Environment Variables (Production):**

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<production-secret>
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
GROQ_API_KEY=<groq-api-key>
REDIS_URL=redis://...
NODE_ENV=production
```

**Database Hosting:**

- **Recommended**: Supabase, Neon, Railway, Render
- **Requirements**: PostgreSQL 16 compatible

**Redis Hosting:**

- **Recommended**: Upstash (serverless Redis)
- **Alternative**: Railway, Render
- **Note**: Redis is optional (falls back to in-memory)

### Testing Strategy

**Current State:**

- Manual API testing scripts
- Smoke tests for health checks
- No automated test suite yet

**Future Testing:**

- Jest + React Testing Library
- API integration tests
- E2E tests with Playwright
- Accessibility testing

---

## 📊 Project Statistics

### Codebase Metrics

| Metric               | Value          |
| -------------------- | -------------- |
| **Total Files**      | ~150+          |
| **Lines of Code**    | ~10,000+       |
| **API Endpoints**    | 27 routes      |
| **Database Tables**  | 20+ models     |
| **React Components** | 30+ components |
| **Pages**            | 15+ pages      |

### Technology Breakdown

**Languages:**

- TypeScript: ~95%
- CSS (Tailwind): ~3%
- JSON (configs): ~2%

**Framework Distribution:**

- Next.js: Full-stack framework
- React: Frontend UI
- Prisma: Database layer
- NextAuth: Authentication
- TanStack Query: State management

---

## 🎓 What We Learned

### Key Decisions & Rationale

#### 1. **Why Next.js?**

- **Unified codebase**: Frontend + Backend in one project
- **Performance**: Server-side rendering, static generation
- **Developer experience**: Fast refresh, TypeScript support
- **Deployment**: Vercel integration, serverless functions
- **SEO**: Server components for better crawlability

#### 2. **Why PostgreSQL over MongoDB?**

- **Relational data**: Complex relationships (users, posts, comments, votes)
- **ACID compliance**: Data integrity critical for votes, reports
- **Mature ecosystem**: Proven reliability
- **Full-text search**: Built-in search capabilities
- **Geospatial queries**: Provider location search

#### 3. **Why Prisma over Raw SQL?**

- **Type safety**: Auto-generated TypeScript types
- **Migration management**: Declarative schema, automatic migrations
- **Developer experience**: Intuitive API, great autocomplete
- **SQL injection prevention**: Parameterized queries by default
- **Database agnostic**: Can switch databases if needed

#### 4. **Why NextAuth over Custom Auth?**

- **Security**: Battle-tested, secure by default
- **OAuth support**: Google, GitHub, etc.
- **Session management**: HTTP-only cookies, JWT
- **Adapter system**: Prisma integration
- **Documentation**: Extensive guides

#### 5. **Why Tailwind CSS?**

- **Productivity**: Rapid UI development
- **Consistency**: Design system enforced
- **Performance**: Purges unused styles
- **Responsiveness**: Mobile-first utilities
- **Customization**: Easy theming

#### 6. **Why Redis for Caching?**

- **Speed**: In-memory data store
- **Rate limiting**: Token bucket implementation
- **Session storage**: Fast session retrieval
- **Future features**: Real-time notifications, pub/sub

#### 7. **Why TypeScript?**

- **Type safety**: Catch errors at compile time
- **Refactoring**: Safer code changes
- **Documentation**: Types as documentation
- **Team collaboration**: Clear contracts
- **Tooling**: Better IDE support

---

## 🚀 Future Enhancements

### Planned Features

1. **Real-time Notifications**
   - WebSocket integration
   - Browser notifications
   - In-app notification center

2. **Advanced Search**
   - Full-text search across posts
   - ElasticSearch integration
   - Search filters and facets

3. **Direct Messaging**
   - Private messages between users
   - Message threads
   - Notifications

4. **Enhanced AI Chat**
   - Streaming responses
   - Conversation branching
   - File uploads (images, documents)
   - Voice input

5. **Mobile App**
   - React Native version
   - Push notifications
   - Offline support

6. **Analytics Dashboard**
   - User engagement metrics
   - Content analytics
   - Community health monitoring

7. **Email System**
   - Transactional emails (welcome, password reset)
   - Notification emails
   - Newsletter functionality

8. **Gamification**
   - User reputation points
   - Badges and achievements
   - Leaderboards

9. **Advanced Moderation**
   - AI-powered content filtering
   - Automated spam detection
   - Trust scores

10. **Provider Enhancements**
    - Direct booking system
    - Video consultations
    - Insurance verification
    - Appointment reminders

---

## 📝 Conclusion

### Project Summary

**NeuroKid** is a comprehensive full-stack web application built with modern technologies to support families navigating autism spectrum disorder.

**What We Built:**

- ✅ Full-featured community forum with voting, comments, bookmarks
- ✅ Provider directory with search and filtering
- ✅ AI-powered support assistant (Groq + Llama 3.3)
- ✅ Autism screening tools for multiple age groups
- ✅ Resource library with curated content
- ✅ Complete authentication system (credentials + OAuth)
- ✅ Role-based access control (PARENT, THERAPIST, MODERATOR, ADMIN)
- ✅ Comprehensive moderation system
- ✅ Rate limiting and security features
- ✅ Responsive UI with Tailwind CSS
- ✅ Type-safe codebase with TypeScript
- ✅ Production-ready database schema
- ✅ Docker-based development environment

**Technology Choices:**

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + NextAuth.js + Prisma ORM
- **Database**: PostgreSQL 16 (relational data, ACID compliance)
- **Caching**: Redis 7 (rate limiting, sessions)
- **AI**: Groq API with Llama 3.3 70B
- **Deployment**: Vercel (recommended)

**Why These Choices?**
Each technology was selected for specific advantages:

- Next.js for unified full-stack development
- TypeScript for type safety and maintainability
- PostgreSQL for complex relational data
- Prisma for type-safe database access
- Tailwind for rapid UI development
- NextAuth for secure authentication
- Redis for performance optimization

**Security Implementations:**

- Password hashing (bcrypt)
- SQL injection prevention (Prisma)
- XSS prevention (React + DOMPurify)
- CSRF protection (NextAuth)
- Rate limiting (Redis + token bucket)
- Security headers (middleware)
- Input validation (Zod)
- Audit logging

**Current Status:**
✅ Production-ready MVP  
✅ Fully functional core features  
✅ Secure and performant  
✅ Scalable architecture  
⏳ Ready for deployment  
⏳ Future enhancements planned

---

**Document End**

_For questions or contributions, please refer to the README.md or open an issue on GitHub._
