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
- Animated breathing circle with multiple patterns (4-4-4, 4-7-8, energizing, sleep prep)
- Visual countdown and progress ring
- Tracks completed breathing cycles
- Designed for use during meltdowns or overwhelming moments

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
- **Platform**: About, Trust & Safety, Settings

## Recent Updates (Jan 2026)
- Added Breathing/Calm Tool with animated exercises
- Created Crisis Resources page with emergency hotlines
- Built Therapy Session Log feature with database persistence
- Created Emergency Info Card generator with print functionality
- Added prominent "Get Help" button to navbar (desktop + mobile)
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
