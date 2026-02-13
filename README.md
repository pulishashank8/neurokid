# NeuroKid — End-to-End Autism Support

**An evidence-based platform empowering families navigating autism spectrum disorder.**

NeuroKid is a production-ready web application that supports parents, caregivers, and families with autistic children. It brings together community support, professional care resources, and interactive tools in one seamless experience.

🔗 **Repository:** [github.com/pulishashank8/Neurokid-End-to-end-autism-support](https://github.com/pulishashank8/Neurokid-End-to-end-autism-support)

---

## What NeuroKid Does

NeuroKid helps families:

- **Connect** through a supportive community forum where parents share experiences and advice
- **Navigate** post-diagnosis with a personalized, step-by-step roadmap based on their state and needs
- **Find care** via a vetted directory of autism specialists (ABA, OT, Speech, etc.)
- **Get answers** 24/7 through an AI companion trained on evidence-based autism resources
- **Communicate** using built-in AAC (Augmentative and Alternative Communication) tools for non-verbal children
- **Track progress** with daily wins journaling and therapy session logging
- **Play and learn** with therapeutic games designed for neurodivergent children

---

## Tech Stack

| Layer      | Technology                          |
| ---------- | ------------------------------------ |
| Frontend   | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend    | Next.js API Routes, Prisma ORM, PostgreSQL |
| Auth       | NextAuth.js                          |
| Caching    | Redis                                |
| AI         | Groq (Llama), FastAPI (Python)       |
| Deploy     | Vercel, Docker                       |

---

## Folder Structure

```
neurokind/
├── src/
│   ├── app/              # Next.js App Router (pages, API routes, layouts)
│   ├── features/         # Feature modules (AAC, Autism Navigator, Community)
│   ├── components/       # Reusable UI, layout, animations
│   ├── lib/              # Shared utilities, auth, API helpers, config
│   │   └── api/          # API handlers, error handling, security
│   ├── services/         # Business logic
│   ├── repositories/     # Data access layer
│   └── domain/           # Domain types and errors
├── prisma/               # Database schema and migrations
├── python_tasks/         # Data governance microservice (HIPAA, audit)
└── scripts/              # Seed scripts, migrations, dev utilities
```

---

## Installation

### Prerequisites

- Node.js 20.x
- PostgreSQL
- (Optional) Redis for rate limiting and caching

### Steps

1. **Clone and install**

   ```bash
   git clone https://github.com/pulishashank8/Neurokid-End-to-end-autism-support.git
   cd neurokind
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set at least:
   - `DATABASE_URL` – PostgreSQL connection string
   - `NEXTAUTH_SECRET` – Generate with: `openssl rand -base64 32`
   - `NEXTAUTH_URL` – e.g. `http://localhost:5000`

3. **Setup database**

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:5000` by default.

---

## Environment Variables

| Variable               | Required | Description                                   |
| ---------------------- | -------- | --------------------------------------------- |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                   |
| `NEXTAUTH_SECRET`      | Yes      | Secret for sessions (min 32 chars)             |
| `NEXTAUTH_URL`         | Yes      | App URL (e.g. `http://localhost:5000`)        |
| `GOOGLE_CLIENT_ID`     | No       | Google OAuth (enables "Sign in with Google")  |
| `GOOGLE_CLIENT_SECRET`| No       | Google OAuth secret                           |
| `REDIS_URL`            | No       | Redis URL (falls back to in-memory rate limit)|
| `GROQ_API_KEY`         | No       | Groq API key for AI chat                       |

See `.env.example` for the full list.

---

## Main Features

- **Community Forum** – Categories, nested comments, voting, moderation
- **Autism Navigator** – Personalized roadmap, state resources, provider search
- **Provider Directory** – Search, filter, and review autism specialists
- **AI Support** – Chat for IEP, behavior, and general questions
- **AAC Tools** – Picture-based communication boards
- **Therapeutic Games** – Memory, emotions, calming activities
- **Daily Wins & Therapy Log** – Progress and session tracking
- **Data Governance** – Python-based HIPAA-style redaction and audit

---

## Scripts

| Command            | Description                    |
| ------------------ | ------------------------------ |
| `npm run dev`      | Start development server      |
| `npm run build`    | Build for production           |
| `npm run start`    | Start production server        |
| `npm run db:push`  | Apply Prisma schema to DB      |
| `npm run db:seed`  | Seed database                  |
| `npm run test`     | Run Vitest tests               |
| `npm run test:python` | Run Python tests            |

---

## Notes

- **Vercel**: Primary deployment target; `vercel.json` configures the build.
- **Netlify**: Alternative config in `netlify.toml` (builds from `web/` if applicable).
- **Docker**: Use `docker-compose up -d` for local PostgreSQL (and optionally Redis).

---

## About Me

Hi, I'm **Shashank Puli**, the creator of NeuroKid. I built this platform because I believe every family navigating autism deserves support, clarity, and community. I'm passionate about technology and care deeply about making a meaningful difference for neurodivergent children and their parents.

If you'd like to connect or have feedback: [pulishashank8@gmail.com](mailto:pulishashank8@gmail.com)

---

**Built by Shashank Puli for autism families worldwide.**
