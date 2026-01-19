# NeuroKind

_Last updated: 2026-01-19_

> **A comprehensive platform supporting families navigating autism spectrum disorder (ASD)**

NeuroKind is a full-stack web application designed to provide evidence-based resources, community support, and professional guidance for families with autistic children. The platform combines autism screening tools, provider directories, AI-powered support, and a thriving community forum.

---

## 🎯 Vision & Mission

**Vision:** To be the most trusted and comprehensive resource platform for autism families worldwide.

**Mission:** Empower parents and caregivers with:

- Evidence-based information and resources
- Access to qualified autism professionals
- Peer support through community engagement
- AI-assisted guidance for daily challenges
- Validated screening tools for early detection

---

## ✨ Core Features

### 1. **Autism Screening Tools**

- Age-appropriate screening questionnaires (Toddler, Child, Teen, Adult)
- Instant risk assessment and scoring
- Personalized recommendations based on results
- Direct connection to qualified providers

### 2. **Provider Directory**

- Comprehensive database of autism specialists
- Filter by specialty, location, age group, and insurance
- Verified credentials and ratings
- Direct booking capabilities

### 3. **Community Forum**

- Reddit-style discussion platform
- Category-based organization (Parenting, Education, Therapies, etc.)
- Voting, commenting, and bookmarking
- Advanced content moderation system

### 4. **AI Support Assistant**

- 24/7 AI-powered chat support
- Context-aware autism guidance
- Evidence-based responses
- Personalized recommendations

### 5. **Resource Library**

- Curated autism resources
- Filter by type, age group, and topic
- Expert articles and guides
- External resource links

---

## 🏗️ Technology Stack

### **Frontend**

- **Next.js 16.1.2** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **TanStack React Query** - Server state management

### **Backend**

- **Next.js API Routes** - Serverless backend
- **NextAuth.js** - Authentication (Credentials + Google OAuth)
- **Prisma ORM** - Database management
- **PostgreSQL 16** - Primary database
- **Redis 7** - Caching and rate limiting

### **Infrastructure**

- **Docker Compose** - Local development environment
- **Vercel** - Deployment platform (recommended)
- **Turbopack** - Fast bundler for development

---

## 📁 Project Structure

```
neurokind/
├── prisma/                      # Database schema and migrations
│   ├── schema.prisma           # Prisma schema definition
│   └── migrations/             # Database migration files
│
├── web/                        # Main Next.js application
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── (auth)/        # Authentication pages
│   │   │   │   ├── login/     # Login page
│   │   │   │   └── register/  # Registration page
│   │   │   │
│   │   │   ├── api/           # API Routes
│   │   │   │   ├── auth/      # NextAuth.js configuration
│   │   │   │   ├── posts/     # Community posts API
│   │   │   │   ├── comments/  # Comments API
│   │   │   │   ├── ai/        # AI chat API
│   │   │   │   ├── moderation/ # Content moderation API
│   │   │   │   ├── user/      # User management API
│   │   │   │   └── ...        # Other API endpoints
│   │   │   │
│   │   │   ├── community/     # Community forum
│   │   │   │   ├── page.tsx   # Main forum page
│   │   │   │   ├── new/       # Create post page
│   │   │   │   └── [id]/      # Individual post page
│   │   │   │
│   │   │   ├── providers/     # Provider directory
│   │   │   ├── ai-support/    # AI chat interface
│   │   │   ├── screening/     # Screening tools
│   │   │   ├── resources/     # Resource library
│   │   │   ├── dashboard/     # User dashboard
│   │   │   ├── settings/      # User settings
│   │   │   ├── moderation/    # Moderation panel
│   │   │   ├── about/         # About page
│   │   │   ├── trust/         # Trust & Safety page
│   │   │   │
│   │   │   ├── layout.tsx     # Root layout with navbar
│   │   │   ├── page.tsx       # Landing page
│   │   │   └── globals.css    # Global styles
│   │   │
│   │   ├── components/        # React components
│   │   │   ├── ui/           # Reusable UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── community/    # Forum-specific components
│   │   │   │   ├── PostCard.tsx
│   │   │   │   ├── CommentSection.tsx
│   │   │   │   ├── CategorySidebar.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── theme/        # Theme components
│   │   │   │   └── ThemeToggle.tsx
│   │   │   │
│   │   │   └── navbar.tsx    # Main navigation
│   │   │
│   │   ├── lib/              # Utility libraries
│   │   │   ├── auth.ts       # Authentication helpers
│   │   │   ├── prisma.ts     # Prisma client singleton
│   │   │   ├── validators.ts  # Zod validation schemas
│   │   │   ├── rateLimit.ts  # Rate limiting
│   │   │   ├── moderation.ts # Content moderation
│   │   │   └── ...
│   │   │
│   │   └── data/             # Static data
│   │       └── providers.json # Provider directory data
│   │
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (symlink to root)
│   │   ├── seed.ts           # Database seeding script
│   │   └── migrations/       # Database migrations
│   │
│   ├── public/               # Static assets
│   │   └── ...               # Images, fonts, etc.
│   │
│   ├── scripts/              # Utility scripts
│   │   ├── test-api.ps1     # API testing script
│   │   └── ...
│   │
│   ├── .env.local           # Local environment variables
│   ├── .env.example         # Environment template
│   ├── package.json         # Dependencies and scripts
│   ├── tsconfig.json        # TypeScript configuration
│   ├── next.config.ts       # Next.js configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── middleware.ts        # Next.js middleware (auth)
│
├── docker-compose.yml       # Docker services (PostgreSQL, Redis)
└── .gitignore              # Git ignore rules
```

---

## 📋 Key Files Explained

### **Database & ORM**

- **`prisma/schema.prisma`**: Database schema defining all tables (User, Post, Comment, Category, etc.)
- **`web/src/lib/prisma.ts`**: Prisma client singleton for database queries
- **`web/prisma/seed.ts`**: Seeds database with initial data (categories, demo users, sample posts)

### **Authentication**

- **`web/src/app/api/auth/[...nextauth]/route.ts`**: NextAuth.js configuration with Google OAuth and credentials
- **`web/src/lib/auth.ts`**: Auth helper functions (getServerSession, requireAuth, etc.)
- **`web/middleware.ts`**: Protects routes requiring authentication

### **API Routes**

- **`web/src/app/api/posts/route.ts`**: CRUD operations for community posts
- **`web/src/app/api/comments/route.ts`**: Comment management
- **`web/src/app/api/ai/chat/route.ts`**: AI chat endpoint (mock implementation)
- **`web/src/app/api/moderation/*/route.ts`**: Content moderation APIs

### **Core Pages**

- **`web/src/app/page.tsx`**: Landing page with hero and 4 pillars
- **`web/src/app/community/page.tsx`**: Main forum with posts, categories, and sorting
- **`web/src/app/providers/page.tsx`**: Provider directory with search and filters
- **`web/src/app/screening/page.tsx`**: Screening tool entry point
- **`web/src/app/ai-support/page.tsx`**: AI chat interface

### **UI Components**

- **`web/src/components/ui/`**: Reusable design system components (Button, Card, Input, etc.)
- **`web/src/components/navbar.tsx`**: Main navigation with mobile menu
- **`web/src/components/community/`**: Forum-specific components (PostCard, CommentSection, etc.)

### **Configuration**

- **`web/.env.local`**: Environment variables (DATABASE_URL, NEXTAUTH_SECRET, Google OAuth credentials)
- **`web/package.json`**: npm scripts (`dev`, `build`, `start`, `db:seed`, etc.)
- **`docker-compose.yml`**: Local PostgreSQL and Redis setup

---

## 🚀 Getting Started

### **Prerequisites**

- Node.js 18+ and npm
- Docker Desktop (for database)
- Google Cloud Console account (for OAuth)

### **Installation**

1. **Clone the repository**

   ```bash
   git clone https://github.com/pulishashank8/neurokind.git
   cd neurokind
   ```

2. **Install dependencies**

   ```bash
   cd web
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add:

   ```env
   DATABASE_URL="postgresql://neurokind:neurokind@localhost:5432/neurokind"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-random-secret-min-32-chars"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Start Docker services**

   ```bash
   cd ..
   docker-compose up -d
   ```

5. **Run database migrations**

   ```bash
   cd web
   npx prisma migrate deploy
   ```

6. **Seed the database**

   ```bash
   npm run db:seed
   ```

7. **Start development server**

   ```bash
   npm run dev
   ```

8. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 👤 Demo Credentials

After seeding the database, you can log in with:

- **Admin**: `admin@neurokind.local` / `admin123`
- **Moderator**: `moderator@neurokind.local` / `moderator123`
- **Parent**: `parent@neurokind.local` / `parent123`
- **Therapist**: `therapist@neurokind.local` / `therapist123`

Or use **Google Sign-In** (requires Google OAuth setup)

---

## 📊 Database Schema

### **Core Tables**

- **User**: User accounts and authentication
- **Profile**: User profiles with display names and avatars
- **UserRole**: Role-based access control (ADMIN, MODERATOR, PARENT, THERAPIST)
- **Post**: Community forum posts
- **Comment**: Post comments
- **Category**: Post categories (Parenting, Education, etc.)
- **Tag**: Post tags for filtering
- **Vote**: Post and comment upvotes/downvotes
- **Bookmark**: User bookmarks
- **ModerationLog**: Content moderation history
- **Resource**: Curated resource library

---

## 🎨 Design System

### **Color Palette**

- **Primary**: `#4A90E2` (Blue)
- **Accent**: `#50E3C2` (Teal)
- **Success**: `#7ED321` (Green)
- **Warning**: `#F5A623` (Orange)
- **Error**: `#D0021B` (Red)

### **Typography**

- **Font**: System font stack (Inter fallback)
- **Headings**: Bold, responsive sizing
- **Body**: Regular weight, readable line-height

### **Responsive Breakpoints**

- **Mobile**: 360px - 639px
- **Tablet**: 640px - 1023px
- **Desktop**: 1024px - 1365px
- **Large Desktop**: 1366px+

### **Touch Targets**

- Minimum height: **44px** (mobile-friendly)
- Buttons: **48px** minimum

---

## 🔒 Security Features

- **Authentication**: NextAuth.js with secure session management
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Redis-based API rate limiting
- **Content Moderation**: Automated flagging and manual review
- **Input Validation**: Zod schemas for all user input
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: React's built-in XSS prevention
- **CSRF Protection**: NextAuth.js CSRF tokens

---

## 🧪 Testing

### **Run Development Server**

```bash
npm run dev
```

### **Test Database Connection**

```bash
npx prisma studio
```

### **Check API Endpoints**

```bash
# Windows PowerShell
.\scripts\test-api.ps1
```

---

## 📦 Deployment

### **Vercel (Recommended)**

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Deploy

### **Environment Variables for Production**

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secret-min-32-chars"
GOOGLE_CLIENT_ID="production-google-client-id"
GOOGLE_CLIENT_SECRET="production-google-client-secret"
```

---

## 🛠️ npm Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:seed      # Seed database with demo data
npx prisma studio    # Open Prisma Studio (DB GUI)
npx prisma migrate   # Create new migration
```

---

## 🤝 User Roles

### **Parent**

- Create posts and comments
- Bookmark resources
- Access screening tools
- View provider directory

### **Therapist**

- All Parent permissions
- Provide professional insights
- Respond to community questions

### **Moderator**

- All Parent permissions
- Review flagged content
- Edit/delete inappropriate posts
- Ban/unban users

### **Admin**

- All Moderator permissions
- Manage users and roles
- System configuration
- Access analytics

---

## 📈 Future Enhancements

- [ ] Real AI integration (OpenAI GPT-4)
- [ ] Video resources and webinars
- [ ] Direct messaging between users
- [ ] Provider booking system
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Telehealth integration

---

## 📄 License

This project is proprietary and confidential.

---

## 📧 Contact

For questions or support, please contact the NeuroKind team.

---

**Built with ❤️ for autism families worldwide**
