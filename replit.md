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
