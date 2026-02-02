# NeuroKid 🧠

> **An evidence-based platform empowering families navigating autism spectrum disorder**

NeuroKid is a production-ready, full-stack web application designed to support **parents, caregivers, and families** with autistic children. It integrates community support, professional care, and interactive tools into one seamless, premium experience.

---

## 👨‍💻 About the Founder

<div align="center">
  <img src="public/founder-v2.jpg" alt="Shashank Puli" width="200" style="border-radius: 50%; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3); border: 2px solid #10b981;" />
  <h3>Shashank Puli</h3>
  <p><i>"Building a global infrastructure of hope."</i></p>
</div>

**Shashank Puli** is the visionary behind NeuroKid. Driven by the realization that many families face a "diagnosis without a roadmap," Shashank built this platform to bridge the gap between awareness and action. His mission is to transform confusion into clarity, stigma into empowerment, and isolation into community.

- **Vision:** To create a world where neurodiversity is celebrated and families feel empowered.
- **Goal:** To provide every autism family with a village in their pocket.
- **Contact:** [pulishashank8@gmail.com](mailto:pulishashank8@gmail.com)
- **GitHub:** [@pulishashank8](https://github.com/pulishashank8)

---

## 🌟 Core Components & Features

NeuroKid is built on several key pillars, each designed to address a specific need in the autism journey:

### 1. 🤝 Community Forum (`/features/community`)
A sophisticated, Reddit-inspired platform for shared experiences.
- **Nested Discussions:** Organized by category (Therapy, Education, Legal, etc.).
- **Voting & Ranking:** High-quality content surfaces naturally.
- **Safe Space:** Advanced moderation tools ensure a supportive environment.

### 2. 🗺️ Autism Navigator (`/features/autism-navigator`)
A personalized roadmap for post-diagnosis guidance.
- **Step-by-Step Guidance:** From understanding the diagnosis to finding state resources.
- **Personalized Roadmap:** Tailored to the user's specific state and needs.
- **Resource Matching:** Connects users directly with relevant government and medical contacts.

### 3. 🏥 Provider Directory (`/app/providers`)
A vetted directory of autism specialists.
- **Verified Specialists:** ABA, OT, Speech-Language Pathologists, and more.
- **Search & Filter:** Find the best care based on location, insurance, and specialty.
- **Professional Ratings:** Real feedback from other parents.

### 4. 🤖 AI Companion (`/app/ai-support`)
24/7 intelligent assistance for immediate questions.
- **IEP & Behavior Support:** Instant guidance on complex paperwork and behavioral challenges.
- **Evidence-Based:** Responses grounded in clinical research.
- **Private Chat:** A secure space to ask questions anytime.

### 5. 🗣️ AAC Communicator (`/features/aac`)
A digital voice for non-verbal children.
- **Visual Board:** Customizable picture symbols for communication.
- **Ease of Use:** Designed for children to express needs quickly.
- **Essential Tool:** Bridging the communication gap at home or school.

### 6. ✨ Therapeutic Games (`/app/games`)
Educational games designed by specialists for neurodivergent children.
- **Skill Building:** Focus on memory, emotion recognition, and pattern matching.
- **Calming Activities:** Low-overload designs for sensory-friendly play.

### 7. 📈 Progress Trackers (`/app/daily-wins` & `/app/therapy-log`)
Tools for celebrating success and monitoring development.
- **Daily Wins:** Record small victories to maintain positive momentum.
- **Therapy Log:** Track sessions and progress across different specialties.

### 8. 🛡️ Data Governance Engine (`/python_tasks`)
A state-of-the-art backend system for privacy and compliance.
- **HIPAA Redaction:** Automated PHI detection and masking.
- **Quality Gates:** Ensuring data integrity across the platform.
- **Audit Logging:** Full transparency for security and trust.

---

## 🏗️ Project Architecture

Our codebase is perfectly structured for scalability and clarity:

- **`src/app`**: The core routing and page-level logic using Next.js App Router.
- **`src/features`**: Self-contained modules for major functionalities (AAC, Navigator, Community).
- **`src/components/ui`**: A library of premium, reusable design tokens and components.
- **`src/lib`**: Centralized utilities for authentication, database access, and caching.
- **`src/services`**: Shared business logic and API orchestration.
- **`python_tasks`**: Advanced data engineering and governance microservice.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js Server Components, Prisma ORM, PostgreSQL
- **Real-time:** Redis (Caching), Supabase (Storage/Realtime)
- **AI/ML:** FastAPI (Python), LLM Integration
- **Infrastructure:** Vercel, Docker

---

**Made with ❤️ by Shashank Puli for autism families worldwide.**

