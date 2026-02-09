# NeuroKid 🧠

> **An evidence-based platform empowering families navigating autism spectrum disorder**

NeuroKind is a production-ready, full-stack web application built for **parents, caregivers, and families** with autistic children. It combines an interactive community forum (Reddit-style), provider directory, evidence-based screening tools, AI-powered support, and a curated resource library—all in one seamless platform.

**Live:** [www.neurokid.help](https://www.neurokid.help) | **Status:** Production ✅

---

## 🎯 Why NeuroKid?

Raising an autistic child comes with unique challenges. Parents need **trusted information, peer support, qualified providers, and practical tools**—often from multiple sources. NeuroKid brings it all together in one place.

✅ **Community-driven** - Connect with thousands of families on the forum  
✅ **Evidence-based** - Tools and resources grounded in research  
✅ **AI-powered** - Get guidance 24/7 from an intelligent support assistant  
✅ **Provider access** - Find verified autism specialists near you  
✅ **Private & safe** - HIPAA-compliant architecture with advanced moderation  

---

## 🌟 Core Features

### 🤝 **Community Forum**
A Reddit-style discussion platform where families share experiences, ask questions, and support each other.
- Category-based organization (Parenting, Education, Therapies, Sensory Support, etc.)
- Voting & sorting (Hot, New, Top) for meaningful discussions
- Threaded comments with reply nesting
- Bookmarks to save posts for later
- User profiles with verified badges for therapists

### 🧪 **Autism Screening Tools**
Evidence-based questionnaires for early detection and assessment.
- Age-specific screening (Toddler, Child, Teen, Adult)
- Instant risk scoring with detailed results
- Personalized recommendations based on assessment
- Provider matching - connect directly with specialists

### 🏥 **Provider Directory**
Find qualified autism professionals in your area.
- Advanced filtering (Specialty, Location, Insurance, Age Group)
- Verified credentials and professional ratings
- Provider reviews from real families
- Booking integration (coming soon)

### 🤖 **AI Support Assistant**
24/7 intelligent guidance powered by AI.
- Context-aware responses tailored to autism challenges
- Evidence-based recommendations backed by research
- Conversation history for continuity
- Private & secure conversations

### 📚 **Resource Library**
Curated collection of autism resources and guides.
- Organized by category (Education, Therapy, Nutrition, Legal, etc.)
- Vetted expert content from trusted sources
- Searchable & filterable for easy discovery
- Saved resources for quick access

### 📝 **Daily Wins Journal**
Celebrate small victories and track progress.
- Daily reflection on accomplishments
- Mood tracking with calendar view
- Category-based wins (therapy, school, social, etc.)
- Progress insights over time

### 🎮 **Therapeutic Games**
Educational, calming games for children on the spectrum.
- Memory Match, Calming Bubbles, Emotion Match, and 8+ more
- Designed by educational specialists
- Sensory & skill-building focus

### 💬 **Private Messaging**
LinkedIn-style direct messaging between parents and professionals.
- One-on-one conversations with threaded messages
- Block functionality for safety
- Read receipts for reliability

### 🔔 **Smart Notifications**
Stay informed without information overload.
- Post replies & mentions
- Connection requests from community members
- Custom preferences - control what you're notified about

---

## 🛠️ Tech Stack

**NeuroKind is built with enterprise-grade technologies for scalability, security, and performance.**

### Frontend Stack
| Tech | Version | Purpose |
|------|---------|---------|
| **Next.js** | 16.1.2 | React framework with App Router (SSR/SSG) |
| **React** | 19.2.3 | Modern UI library |
| **TypeScript** | 5 | Type-safe JavaScript |
| **Tailwind CSS** | 4 | Utility-first styling |
| **React Query** | 5.90 | Server state management |
| **React Hook Form** | 7.71 | Efficient form handling |
| **Zod** | 3.22 | Runtime validation |

### Backend Stack
| Tech | Version | Purpose |
|------|---------|---------|
| **Next.js API Routes** | 16.1.2 | Serverless backend |
| **NextAuth.js** | 4.24 | Authentication + OAuth |
| **Prisma ORM** | 5.22 | Type-safe DB queries |
| **PostgreSQL** | 16 | Production database |
| **Redis** | 7 | Caching & rate limiting |
| **Pino** | 9.0 | Structured logging |

### Infrastructure
| Tech | Purpose |
|------|---------|
| **Vercel** | Serverless deployment |
| **Docker Compose** | Local development |
| **GitHub Actions** | CI/CD pipeline |

---

## 📁 Project Architecture

### Folder Structure
```
neurokind/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, register, reset)
│   │   ├── api/               # API endpoints
│   │   │   ├── auth/          # NextAuth configuration
│   │   │   ├── posts/         # Community CRUD
│   │   │   ├── comments/      # Comments API
│   │   │   ├── messages/      # Private messaging
│   │   │   ├── connections/   # Connection requests
│   │   │   ├── daily-wins/    # Daily wins journal
│   │   │   ├── ai/            # AI chat
│   │   │   ├── users/         # User profiles & search
│   │   │   └── ...            # 10+ more endpoints
│   │   ├── community/         # Forum UI
│   │   ├── screening/         # Screening tools
│   │   ├── providers/         # Provider directory
│   │   ├── ai-support/        # AI chat UI
│   │   ├── dashboard/         # User dashboard
│   │   ├── messages/          # Messaging UI
│   │   ├── games/             # Therapeutic games
│   │   ├── resources/         # Resource library
│   │   └── layout.tsx         # Root layout
│   │
│   ├── components/            # Reusable React components
│   │   ├── ui/               # Base components (Button, Card, Input)
│   │   ├── community/        # Forum components
│   │   └── navbar.tsx        # Navigation
│   │
│   ├── lib/                   # Utility functions
│   │   ├── auth.ts           # Authentication
│   │   ├── prisma.ts         # Database client
│   │   ├── logger.ts         # Structured logging
│   │   ├── redis.ts          # Caching & rate limiting
│   │   ├── validators.ts     # Zod schemas
│   │   ├── rbac.ts           # Role-based access control
│   │   ├── apiHandler.ts     # Request wrapper
│   │   └── mailer.ts         # Email service
│   │
│   └── __tests__/            # Comprehensive test suite
│       ├── integration/      # API endpoint tests
│       ├── unit/             # Unit tests
│       └── helpers/          # Test utilities
│
├── prisma/
│   ├── schema.prisma         # 30+ data models
│   ├── migrations/           # Database history
│   └── seed.ts               # Initial data
│
├── public/                   # Static assets
├── scripts/                  # Utility scripts
├── docs/                     # Technical documentation
└── docker-compose.yml        # Local dev environment
```

### Database Models (30+)

**Auth & Users**
- User, Profile, UserRole
- EmailVerification, PasswordResetToken

**Community**
- Post, Comment, Vote
- Category, Tag, Bookmark
- Report, ModerationAction, ModActionLog

**Providers**
- Provider, ProviderReview, ProviderClaimRequest

**Messaging & Connections**
- Conversation, DirectMessage, BlockedUser
- ConnectionRequest, MessageReport

**Features**
- DailyWin, TherapySession, EmergencyCard
- AIConversation, AIMessage
- Notification, Resource, SavedResource

**Governance**
- AuditLog, Dataset, DataOwner (enterprise data catalog)
- DataQualityRule, DataQualityResult (automated quality gates)
- SensitiveAccessLog, UserConsent (HIPAA compliance)
- DataLineageNode, DataLineageEdge (data flow tracking)

---

## 🏛️ Data Governance Architecture

**NeuroKind implements enterprise-grade data governance patterns for healthcare compliance.**

### Privacy Engine (`python_tasks/services/governance.py`)

The Privacy Engine provides HIPAA Safe Harbor de-identification with automated PHI detection:

```
┌─────────────────────────────────────────────────────────────┐
│                    Privacy Engine Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Input Text] ──▶ [PHI Scanner] ──▶ [Risk Engine] ──▶ [Audit Log]
│                        │                 │                  │
│                        ▼                 ▼                  │
│               [Redacted Output]    [Risk Level]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Detected PHI Types:**
- Social Security Numbers (SSN) → `XXX-XX-XXXX`
- Dates of Birth (DOB) → `XX/XX/XXXX`
- Medical Record Numbers (MRN) → `MRN: [REDACTED]`
- Phone Numbers → `(XXX) XXX-XXXX`
- Email Addresses → `[REDACTED_EMAIL]`

### Quality Gate & Quarantine Pattern (`python_tasks/services/quality.py`)

Invalid data is isolated rather than rejected, enabling ETL pipelines to continue:

```python
# Quarantine Pattern - Invalid data wrapped in QuarantineRecord
result = quality_gate.validate(User, incoming_data)

if isinstance(result, ValidatedRecord):
    # Safe to persist
    await save_to_db(result.record)
elif isinstance(result, QuarantineRecord):
    # Isolated for review
    await save_to_quarantine(result)
    log.warning(f"Quarantined: {result.error_message}")
```

### Z-Score Anomaly Detection

Automated anomaly detection using statistical methods:

| Rule Type | Description | Threshold |
|-----------|-------------|-----------|
| `NULL_CHECK` | Detect missing required values | 0% tolerance |
| `ANOMALY_DETECTION` | Z-Score outlier detection | σ > 3 |
| `RANGE_CHECK` | Value boundary validation | Configurable |
| `REGEX_MATCH` | Pattern matching (email, phone) | 95% compliance |

### Data Lineage Tracking

Full traceability from source to report:

```
SOURCE → TRANSFORM → STORE → AGGREGATE → REPORT
  │          │         │         │          │
  └──────────┴─────────┴─────────┴──────────┘
         All transitions logged in DataLineageEdge
```

### Compliance Automation

```bash
# Generate HIPAA compliance audit report
cd python_tasks
python generate_audit_report.py --output-dir ./reports

# Run industry-standard data validation (Great Expectations)
python run_standard_checks.py --verbose
```

**Report includes:**
- Trust Score calculation (Quality, Privacy, Integrity, Governance)
- PHI/PII data inventory
- Access audit trail
- Consent compliance metrics
- Quarantine status

### Trust Center Dashboard

Visual governance monitoring at `/owner/trust`:
- Real-time Trust Score gauge
- PHI Redaction Counter
- Privacy Scanner status (Active/Idle)
- HIPAA Safe Harbor compliance badge
- Access audit metrics

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7 (optional, with in-memory fallback)

### Installation

```bash
# Clone repository
git clone https://github.com/pulishashank8/neurokid.git
cd neurokid

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your database & auth credentials

# Setup database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Visit http://localhost:3000

### Key Commands
```bash
npm run dev              # Start dev server
npm run build           # Production build
npm run start           # Start production server
npm test                # Run tests
npm run lint            # Lint code
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed database
```

---

## 🧪 Testing

NeuroKind includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# View test UI
npm run test:ui
```

**Test Suite:**
- 20+ integration tests for API endpoints
- Unit tests for validators and utilities
- Mock database for isolated testing
- Mock authentication for auth flows

---

## 🔒 Security Features

✅ **Authentication**
- Email verification with OTP
- Password reset tokens
- Google OAuth integration
- NextAuth.js with secure sessions

✅ **Data Protection**
- Password hashing with bcrypt
- Zod input validation (all endpoints)
- SQL injection prevention (Prisma ORM)
- CSRF protection via NextAuth

✅ **Content Moderation**
- Content moderation system with flags
- Moderator roles with escalation
- HTML sanitization for user content
- Rate limiting on sensitive endpoints

✅ **Privacy**
- HIPAA-compliant architecture
- Sensitive data redaction in logs
- Role-based access control (RBAC)
- Audit logging for all actions

---

## 📊 Performance

- **Lighthouse Score:** 95+ on desktop
- **API Response Time:** <200ms (avg)
- **Database Queries:** Optimized with indexes
- **Caching:** Redis caching with TTL
- **Build Size:** 2.5MB gzipped

---

## 🤝 Contributing

Contributions are welcome! Please follow our development guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Development Workflow:**
```bash
# Ensure tests pass
npm test

# Check code quality
npm run lint

# Type checking
npx tsc --noEmit
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙋 Support

- **Documentation:** [/docs](./docs/) directory
- **Issues:** [GitHub Issues](https://github.com/pulishashank8/neurokid/issues)
- **Email:** pulishashank8@gmail.com
- **Website:** [www.neurokid.help](https://www.neurokid.help)

---

## 👨‍💻 Author

**Shahank Puli**
- GitHub: [@pulishashank8](https://github.com/pulishashank8)
- Website: [www.neurokid.help](https://www.neurokid.help)

---

## 🎉 Acknowledgments

- The autism community for inspiration and feedback
- Healthcare professionals who validated our approach
- Open source libraries that power NeuroKind
- Families who trusted us with their support journey

---

**Made with ❤️ for autism families worldwide**
