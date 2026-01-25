# NeuroKid

## Overview
NeuroKid is a Next.js-based community platform for parents of autistic children. It features forums, verified provider directories, AI chat support, and resources. The app uses PostgreSQL with Prisma ORM for data persistence.

## Project Structure
- `/web` - Main Next.js application
  - `/src/app` - Next.js App Router pages and API routes
  - `/src/components` - React components
  - `/src/lib` - Utility functions and shared code
  - `/prisma` - Database schema and migrations
- `/prisma` - Root level Prisma schema (reference)
- `/docs` - Documentation files

## Tech Stack
- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js
- **Styling**: TailwindCSS with PostCSS

## Development
- Dev server runs on port 5000
- Database schema is managed via Prisma
- Run `cd web && npm run dev` to start development

## Database Commands
- `cd web && npx prisma db push` - Sync schema with database
- `cd web && npx prisma studio` - Open database GUI
- `cd web && npm run db:seed` - Seed database with sample data

## Premium UI Design System
The platform uses a premium, luxurious UI with the following features:
- **3D Card Effects**: Cards have hover tilt effects and layered shadows (`.card-3d`, `.shadow-premium`)
- **Glassmorphism**: Frosted glass effects with backdrop blur (`.glass`, `.glass-subtle`)
- **Animated Interactions**: Micro-animations for voting, bookmarks, and buttons (`.animate-vote-pop`, `.animate-fade-up`)
- **Premium Buttons**: Shine effects and smooth transitions (`.btn-premium`)
- **Glow Effects**: Subtle glows for primary elements (`.glow-primary`)
- **Staggered Animations**: Child elements animate in sequence (`.stagger-children`)
- **Custom Scrollbar**: Premium styled scrollbar matching the theme
- **Color Scheme**: Emerald green primary with sensory-friendly, accessible contrast

## Support Tools (Free & Useful)
These features are 100% free (no paid APIs) and designed for real-world use by families:

### Calm/Breathing Tool (`/calm`)
- Animated breathing circle with 4 distinctly different patterns:
  - **Box Breathing** (4-4-4-4): Equal intervals for anxiety, panic, regaining focus
  - **Deep Relaxation** (4-7-8): Long exhale activates parasympathetic system, for post-meltdown calming
  - **Wake Up Breath** (2-0-2): Quick rhythmic breathing for energy and alertness
  - **Grounding Breath** (5-2-7-3): Slow extended pattern for sensory overload or dissociation
- Visual countdown and progress ring
- Tracks completed breathing cycles
- Each pattern shows timing and purpose description

### Crisis Resources (`/crisis`)
- Emergency hotlines (988, Crisis Text Line, Autism Society)
- Meltdown management tips (during and after)
- Local resource finder links
- Prominent "Get Help" button always visible in navbar

### Therapy Session Log (`/therapy-log`)
- Log therapy sessions with date, therapist, type
- Track what went well and areas to work on
- Mood tracking (1-5 emoji scale)
- View session history
- Supports ABA, Speech, OT, and other therapy types

### Emergency Info Cards (`/emergency-card`)
- Create cards with child's name, triggers, calming strategies
- Add emergency contacts and doctor info
- Printable format for teachers, babysitters, caregivers
- Expandable cards to view full details

### Legal Pages
- `/disclaimer` - Medical disclaimer for AI and screening tools
- `/privacy` - Privacy policy explaining data handling
- `/terms` - Terms of service

## Navigation Structure
- **Community**: Forums, Saved Posts
- **Care Compass**: Find Care, M-CHAT-R/F Screening
- **Support**: Calm Tool, Crisis Help, Therapy Log, Emergency Cards
- **Knowledge**: Resources, AI Companion
- **Platform**: About, Marketplace, Trust & Safety, Settings, Sign Out

## Dashboard Layout
The dashboard has a side-by-side layout below the main module cards:

**Left Section - Support Tools** (stacked vertically):
1. **Breathe & Calm** - Animated breathing exercises
2. **Screening** - M-CHAT developmental screening
3. **Therapy Log** - Track therapy sessions

**Right Section - Marketplace**:
- Title and description about Amazon products
- "Browse Collection" button linking to 150+ products
- Responsive: stacks on mobile, side-by-side on tablet+

## Marketplace
The Marketplace (`/marketplace`) is a curated shopping experience with 150+ Amazon product links across categories:
- **Gifts**: Subscription boxes, weighted animals, building sets
- **Communication**: PECS books, visual schedules, talking flashcards
- **Safety**: Door alarms, GPS trackers, ID bracelets
- **Sensory**: Swings, weighted blankets, chew toys, bubble tubes
- **Toys**: Fidgets, kinetic sand, trampolines, puzzles
- **Clothing**: Seamless socks, compression vests, adaptive wear
- **Education**: Books, flashcards, scissors, social skills games
- **Daily Living**: Adaptive utensils, visual timers, potty watches
- **Tech**: Noise-cancelling headphones, GPS trackers, star projectors

## LinkedIn-Style Private Messaging (`/messages`)
The platform includes a connection-based private messaging system similar to LinkedIn:

### Connection Request Flow
1. **Search Users**: Find users by their unique username
2. **Send Connection Request**: Send a request with an optional message
3. **Respond to Requests**: Accept or decline incoming requests
4. **Messaging**: Only connected users can message each other

### Features
- **User Search**: Search by username to find and connect with other users
- **Connection Requests**: Send requests with optional intro message (300 char limit)
- **Pending Requests Tab**: View/manage incoming and sent requests
- **Active Conversations**: Chat with accepted connections
- **Rate Limiting**: 20 messages per minute, 5 new conversations per day
- **User Safety**: Block/unblock users, report users for moderation

### Google OAuth Onboarding
- Users who sign up via Google must complete their profile before accessing the app
- Required fields: unique username and display name
- Profile completion page at `/onboarding`

### Database Tables
- `ConnectionRequest`: Stores connection requests (sender, receiver, message, status)
- `Conversation`: Stores 1:1 conversation between connected users
- `DirectMessage`: Individual messages with soft delete support
- `BlockedUser`: Blocked user relationships
- `MessageReport`: User reports for moderation
- `MessageRateLimit`: Rate limit tracking

### Access Points
- Messages link in navbar under Community dropdown
- Three tabs: Search Users, Pending Requests, Active Conversations

## Recent Updates (Jan 2026)
- Refactored messaging to LinkedIn-style connection request system
- Added Google OAuth onboarding for username/display name collection
- Removed direct messaging buttons from posts/comments (require connection first)
- Added Breathing/Calm Tool with animated exercises
- Created Crisis Resources page with emergency hotlines
- Built Therapy Session Log feature with database persistence
- Created Emergency Info Card generator with print functionality
- Added prominent "Get Help" button to navbar (rose/red for visibility)
- Added Medical Disclaimer, Privacy Policy, Terms of Service pages
- Updated navbar with new Support navigation group
- Added premium 3D card effects and glassmorphism to globals.css
- Redesigned PostCard with 3D hover effects and improved visual hierarchy
- Enhanced VoteButtons with animated counters and satisfying pop feedback
- Updated CategorySidebar with premium styling and smooth animations
- Improved SearchBar with focus states and scale transitions
- Redesigned SortTabs with pill-style toggle buttons
- Premium-styled BookmarkButton and ReportButton with micro-interactions
- Enhanced LoadingSkeletons with premium animation effects
- Added Marketplace to Platform navigation dropdown
- Moved Sign Out to Platform dropdown (desktop) and mobile menu
- Dashboard features 15 rotating inspirational quotes (compact size)
- Improved theme toggle with clear Sun/Moon icons with labels
- Cleaned up dashboard - removed redundant elements
- Full responsiveness across all device sizes (mobile, tablet, desktop)
