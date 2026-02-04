# NeuroKid - Project Knowledge Base & AI Training Manual

## 1. Project Identity & Mission
**Name:** NeuroKid (formerly NeuroKind)
**Tagline:** "The All-in-One Autism Support App for Kids and Parents"
**Mission:** To provide a comprehensive, safe, and supportive digital ecosystem for autistic children and their parents. The platform bridges the gap between communication tools (AAC), therapeutic tracking, and community support.
**Target Audience:**
-   **Children:** Autistic children (verbal and non-verbal/minimally verbal).
-   **Parents/Caregivers:** Seeking support, resources, community, and tools to manage their child's development.
-   **Providers:** Therapists and specialists (ABA, OT, Speech) offering services.

## 2. Technical Architecture

### Tech Stack
-   **Frontend Framework:** Next.js 16.1.4 (React 19, App Router)
-   **Language:** TypeScript
-   **Styling:**
    -   Tailwind CSS v4 (Utility-first CSS)
    -   Radix UI (Accessible, unstyled primitives)
    -   Lucide React (Iconography)
    -   Framer Motion (Animations & Micro-interactions)
    -   Shadcn/UI (Component library base)
-   **Backend:**
    -   **Database:** PostgreSQL (via Supabase)
    -   **ORM:** Prisma
    -   **Authentication:** NextAuth.js
-   **Cloud & Services:**
    -   **Deployment:** Vercel
    -   **AI Services:** OpenAI (likely for chat/stories), Amazon Polly (TTS for stories).
    -   **Monitoring:** Sentry
    -   **Email:** Resend

### Folder Structure
-   `src/app`: Application routes (Next.js App Router).
-   `src/components`: Reusable UI components (buttons, cards, layout).
-   `src/features`: Feature-specific logic (AAC, Games, etc.).
-   `prisma`: Database schema and seeds.
-   `public`: Static assets (images, icons).

## 3. Core Features & Usage

### A. Communication (AAC)
**Route:** `/aac`
-   **Purpose:** Give a voice to non-verbal children.
-   **Functionality:**
    -   Visual symbol-based communication board.
    -   Text-to-Speech (TTS) integration.
    -   Customizable vocabulary and categories.
    -   "Lock" mode to prevent accidental exits (guided access feel).

### B. AI Companion ("Calm Buddy")
**Route:** `/calm` (or integrated into games)
-   **Purpose:** A safe, non-judgmental AI friend for the child.
-   **Functionality:**
    -   Voice-activated conversation.
    -   Emotional regulation support.
    -   Encouraging interactive dialogue.

### C. AI Storytelling
**Route:** `/stories`
-   **Purpose:** Personalized social and entertainment stories.
-   **Technology:** Uses AI to generate text + Amazon Polly for child-friendly audio.
-   **Key Features:**
    -   Read-aloud functionality.
    -   Custom themes.

### D. Parent Community & Support
**Route:** `/community` & `/ai-support`
-   **Community Hub:** Forum-like structure with posts, comments, categories, and tags.
-   **AI Support:** AI-powered assistant to answer questions about IEPs, behavioral strategies, and rights.
-   **Moderation:** Robust reporting and moderation system (`Report`, `ModerationAction` models) to keep the space safe.

### E. Health & Application Tools
-   **Therapy Log (`/therapy-log`):** Track sessions, notes, and mood (Encrypted).
-   **Screening (`/screening`):** Clinical tools to track milestones.
-   **Emergency Card (`/emergency-card`):** Digital ID with critical info (allergies, triggers, calming strategies). **Security:** Uses field-level encryption for PHI.
-   **Daily Wins / Visual Schedules (`/daily-wins`):** Routine tracking and positive reinforcement.

### F. Provider Directory
**Route:** `/providers`
-   **Functionality:** Search for ABA, OT, and Speech therapists.
-   **Features:** Location-based search, verified provider status, reviews, and claiming system for professionals.

### G. Autism Navigator (Roadmap)
**Route:** `/autism-navigator`
-   **Purpose:** A guided visual roadmap for parents post-diagnosis.
-   **Content:** Step-by-step guides on insurance, therapy, and state resources.

## 4. Database & Data Model (Prisma)
*Key Relations:*
-   **User:** The central entity. Has One Profile. Has Many Posts, Comments, Logs.
-   **Data Security:** Sensitive fields in `TherapySession` and `EmergencyCard` are explicitly noted as encrypted strings.
-   **Community:** Standard relational model (User -> Post -> Comment).
-   **Role-Based Access:** Users can be Parents, Providers, or Admins/Moderators.

## 5. UI/UX Philosophy
-   **Aesthetics:** "Calm, Premium, Playful".
-   **Palette:** Emeralds, Teals, Soft Blues (calming colors), with specific high-contrast support.
-   **Interactivity:** Heavy use of 3D tilt effects, smooth transitions, and "glassmorphism" to make the app feel modern and alive without being overstimulating.
-   **Accessibility:** Priority on clear typography, large touch targets, and visual supports (symbols).

## 6. Current Implementation Details
-   **Authentication:** Requires login for most features (`/dashboard` is the hub).
-   **Profile Guard:** Users are forced to complete a profile setup before accessing the app to ensure personalization.
-   **Navigation:** A "Conditional Navbar" handles different states (Guest vs. User).

---
*This document serves as the ground truth for understanding the NeuroKid architecture and feature set.*
