# NeuroKid

## Overview

NeuroKid is a comprehensive full-stack web platform designed to support families navigating autism spectrum disorder (ASD). The application combines multiple features into a single cohesive platform:

- **Community Forum** - Reddit-style discussion platform with categories, voting, and threaded comments
- **Provider Directory** - Database of autism specialists with filtering and reviews
- **AI Support Assistant** - 24/7 AI-powered guidance using Groq/OpenAI
- **Screening Tools** - Age-appropriate autism assessments with risk scoring
- **Resource Library** - Curated educational content for families

The platform prioritizes accessibility, sensory-friendly design, and HIPAA-compliant architecture.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with custom design tokens for sensory-friendly theming
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Authentication**: NextAuth.js v4 with Prisma adapter, supporting credentials and Google OAuth
- **UI Components**: Custom component library in `src/components/` with accessibility focus

### Backend Architecture
- **API Routes**: Next.js API routes in `src/app/api/`
- **Database ORM**: Prisma with PostgreSQL
- **Validation**: Zod schemas for request/response validation
- **Logging**: Pino logger with structured JSON output in production
- **Error Handling**: Centralized error response formatting with request correlation IDs

### Data Storage
- **Primary Database**: PostgreSQL via Prisma
- **Caching**: Redis (optional) with in-memory fallback for development
- **Rate Limiting**: Token bucket algorithm with Redis or in-memory store

### Authentication & Authorization
- **Auth Provider**: NextAuth.js with session-based authentication
- **Role-Based Access Control**: Custom RBAC system with roles (PARENT, THERAPIST, MODERATOR, ADMIN)
- **Profile Guard**: Middleware to enforce profile completion before accessing protected routes

### Key Design Patterns
- API handler wrapper for consistent logging, error handling, and request correlation
- Lazy Redis initialization with graceful fallback
- Environment validation with Zod at startup
- Sensitive field redaction in logs
- Service layer pattern for business logic separation (`src/services/`)
- Standardized API response structure (`src/lib/apiResponse.ts`)

### Security Architecture
- **Rate Limiting**: Token bucket algorithm with Redis/in-memory fallback
  - Login: 10/min per email
  - Registration: 5/hour per IP
  - Password reset: 5 per 5 min
  - API endpoints: Various limits based on action type
- **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **XSS Protection**: HTML sanitization for user-generated content (`src/lib/security.ts`)
- **IDOR Protection**: Resource ownership verification utilities
- **Security Audit Logging**: All security events logged to database (`src/lib/securityAudit.ts`)

### Feature Flags
- Safe rollout system for new features (`src/lib/featureFlags.ts`)
- Environment variable overrides: `FEATURE_<FLAG_NAME>=true`
- Percentage-based rollout support

### Data Governance
- User data export capability (GDPR/CCPA compliant)
- Data anonymization and deletion services
- Audit log retention policies
- See `docs/DATA_GOVERNANCE.md` for full documentation

## External Dependencies

### Database
- **PostgreSQL**: Primary data store accessed via Prisma ORM
- **Redis**: Optional caching and rate limiting (graceful degradation if unavailable)

### Third-Party APIs
- **Groq/OpenAI**: AI chat functionality for the support assistant
- **Google OAuth**: Social authentication
- **Google Places API**: Location-based provider search (optional)
- **Resend**: Transactional email for verification and notifications

### Owner Dashboard (Private Admin)
- Accessible at `/owner` route within the main application
- Password-protected with ADMIN_PASSWORD secret (secure session tokens)
- Completely separate from user-facing pages
- Access URL: `yourdomain.com/owner`
- Features:
  - **Dashboard Overview**: Total users, active users, new users, posts, comments, votes statistics
  - **Users Section**: List all users with search, pagination, view user details with full activity
  - **User Detail Page**: View individual user's posts, comments, votes, audit logs, login history
  - **Posts Section**: All forum posts with author, category, engagement metrics
  - **Comments Section**: All comments with post context and author info
  - **Votes Section**: Track all upvotes/downvotes with filtering by type
  - **Activity Log**: Audit trail of all user actions with action filtering

### Admin Console (Role-Based)
- Accessible at `/admin` route for users with ADMIN role
- Uses NextAuth.js session-based authentication
- Features data governance tools (data catalog, lineage, etc.)

### Testing
- **Vitest**: Test framework with integration tests
- **Test Database**: Separate PostgreSQL database for isolated testing
- Uses `prisma db push` for test schema management

### Deployment
- **Vercel**: Primary deployment target (configured in `vercel.json`)
- **Replit**: Development environment with custom port configuration (5000)