# COMPREHENSIVE QA TEST STRATEGY
## NeuroKid Application - Full System Testing & Mobile Responsiveness

**Document Version:** 1.0  
**Date:** 2026-02-06  
**Status:** CRITICAL - All tests must pass before deployment

---

## TABLE OF CONTENTS

1. [Coverage Summary](#1-coverage-summary)
2. [Existing Test Coverage Mapping](#2-existing-test-coverage-mapping)
3. [Missing Test Areas](#3-missing-test-areas)
4. [Functional Test Cases](#4-functional-test-cases)
5. [API Test Cases](#5-api-test-cases)
6. [Security Test Cases](#6-security-test-cases)
7. [Database Test Cases](#7-database-test-cases)
8. [Responsive & Cross-Device Test Cases](#8-responsive--cross-device-test-cases)
9. [File-by-File Execution Plan](#9-file-by-file-execution-plan)
10. [Failure Handling Strategy](#10-failure-handling-strategy)
11. [Automation Priority Recommendation](#11-automation-priority-recommendation)

---

## 1. COVERAGE SUMMARY

### Current Test Statistics
| Category | Existing Tests | Required Tests | Coverage % |
|----------|---------------|----------------|------------|
| Unit Tests | 3 | 25 | 12% |
| Integration Tests | 17 | 45 | 38% |
| API Tests | 15 | 60 | 25% |
| Security Tests | 2 | 35 | 6% |
| Responsive Tests | 0 | 120 | 0% |
| E2E Tests | 1 | 25 | 4% |
| **TOTAL** | **38** | **310** | **12%** |

### Critical Gaps Identified
- ❌ NO mobile responsive tests (120 test cases needed)
- ❌ NO AAC feature tests
- ❌ NO therapy log tests
- ❌ NO games/sensory tool tests
- ❌ Limited authentication flow tests
- ❌ NO real-time messaging tests
- ❌ NO accessibility tests (a11y)
- ❌ NO performance tests

---

## 2. EXISTING TEST COVERAGE MAPPING

### 2.1 Unit Tests (`src/__tests__/unit/`)

| Test File | Coverage Area | Status | Lines Covered |
|-----------|--------------|--------|---------------|
| `mailer.test.ts` | Email service | ✅ | ~50 |
| `screening-scoring.test.ts` | M-CHAT scoring logic | ✅ | ~30 |
| `validators.test.ts` | Input validation | ✅ | ~40 |

### 2.2 Integration Tests (`src/__tests__/integration/`)

| Test File | Coverage Area | Status | Priority |
|-----------|--------------|--------|----------|
| `auth.test.ts` | User registration | ✅ | P1 |
| `auth-forgot-password.test.ts` | Password reset | ✅ | P1 |
| `auth-verification.test.ts` | Email verification | ✅ | P1 |
| `bookmarks.test.ts` | Post bookmarks | ✅ | P2 |
| `categories.test.ts` | Category management | ✅ | P2 |
| `comments.test.ts` | Comment system | ✅ | P1 |
| `database-connection.test.ts` | DB connectivity | ✅ | P0 |
| `e2e-full-project.test.ts` | End-to-end flows | ✅ | P0 |
| `health.test.ts` | Health check API | ✅ | P0 |
| `moderation.test.ts` | Content moderation | ✅ | P1 |
| `posts.test.ts` | Post CRUD | ✅ | P1 |
| `providers.test.ts` | Provider directory | ✅ | P2 |
| `reports.test.ts` | User reporting | ✅ | P1 |
| `resources.test.ts` | Resource library | ✅ | P2 |
| `screening.test.tsx` | Screening tool | ✅ | P1 |
| `tags.test.ts` | Tag management | ✅ | P3 |
| `user.test.ts` | User management | ✅ | P1 |
| `votes.test.ts` | Voting system | ✅ | P2 |
| `ai-chat.test.ts` | AI conversations | ✅ | P1 |

### 2.3 Python Backend Tests (`python_tasks/tests/`)

| Test File | Coverage Area | Status | Priority |
|-----------|--------------|--------|----------|
| `test_api.py` | Python API routes | ⚠️ Partial | P1 |
| `test_governance.py` | Data governance | ⚠️ Partial | P2 |
| `test_integrations.py` | External integrations | ⚠️ Partial | P2 |
| `test_quality.py` | Data quality | ⚠️ Partial | P2 |
| `test_tasks.py` | Background tasks | ⚠️ Partial | P2 |

---

## 3. MISSING TEST AREAS

### 3.1 Critical Missing Tests (P0 - Must Have)

| Feature Module | Test Type | Priority | Risk if Untested |
|----------------|-----------|----------|------------------|
| AAC Communicator | Full feature | P0 | Core functionality broken |
| Therapy Log | Full feature | P0 | HIPAA compliance risk |
| Emergency Cards | Full feature | P0 | Safety-critical |
| Daily Wins | Full feature | P0 | User engagement |
| Autism Navigator | Full feature | P0 | Core feature |
| Messages/Chat | Real-time | P0 | Communication broken |
| Games (30+ games) | All games | P0 | Child engagement |
| Mobile Responsive | All breakpoints | P0 | 70% of users mobile |

### 3.2 High Priority Missing Tests (P1)

| Feature Module | Test Type | Priority |
|----------------|-----------|----------|
| Theme Toggle (Dark/Light) | Cross-page | P1 |
| Onboarding Flow | E2E | P1 |
| Notification System | Real-time | P1 |
| Search Functionality | API + UI | P1 |
| File Upload | Security + UI | P1 |
| Session Management | Security | P1 |
| Rate Limiting | Security | P1 |
| Google OAuth | Integration | P1 |

### 3.3 Medium Priority Missing Tests (P2)

| Feature Module | Test Type | Priority |
|----------------|-----------|----------|
| Marketplace | Browse + Cart | P2 |
| AI Stories | Content generation | P2 |
| Crisis/Help Page | Emergency | P2 |
| Privacy/Terms Pages | Content | P2 |
| Sitemap/SEO | Meta tags | P2 |
| Analytics | Data collection | P2 |

---

## 4. FUNCTIONAL TEST CASES

### 4.1 Authentication & User Management

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| AUTH-001 | `login/page.tsx` | Login | Valid credentials | User registered | 1. Navigate to /login<br>2. Enter valid email<br>3. Enter valid password<br>4. Click Login | Redirect to dashboard, session created | UI | P0 |
| AUTH-002 | `login/page.tsx` | Login | Invalid password | User registered | 1. Enter valid email<br>2. Enter wrong password<br>3. Click Login | Error message shown, no redirect | UI | P0 |
| AUTH-003 | `login/page.tsx` | Login | Non-existent user | - | 1. Enter unregistered email<br>2. Enter any password<br>3. Click Login | "Invalid credentials" error | UI | P0 |
| AUTH-004 | `login/page.tsx` | Login | Empty fields | - | 1. Leave fields empty<br>2. Click Login | Validation errors displayed | UI | P1 |
| AUTH-005 | `login/page.tsx` | Login | SQL injection attempt | - | 1. Enter `' OR 1=1 --` in email<br>2. Click Login | Input sanitized, login fails | Security | P0 |
| AUTH-006 | `login/page.tsx` | Login | XSS in email field | - | 1. Enter `<script>alert(1)</script>`<br>2. Click Login | Script not executed, escaped | Security | P0 |
| AUTH-007 | `login/page.tsx` | Login | Password visibility toggle | On login page | 1. Enter password<br>2. Click eye icon<br>3. Click again | Password visibility toggles | UI | P2 |
| AUTH-008 | `login/page.tsx` | Login | Remember me | - | 1. Check "Remember me"<br>2. Login<br>3. Close browser<br>4. Reopen | Session persisted | UI | P2 |
| AUTH-009 | `register/page.tsx` | Registration | Valid new user | - | 1. Fill all required fields<br>2. Valid password<br>3. Click Register | Account created, verification email sent | UI | P0 |
| AUTH-010 | `register/page.tsx` | Registration | Duplicate email | User exists | 1. Use existing email<br>2. Fill other fields<br>3. Click Register | Error: Email already exists | UI | P0 |
| AUTH-011 | `register/page.tsx` | Registration | Weak password | - | 1. Enter "123" as password<br>2. Click Register | Password strength error | UI | P1 |
| AUTH-012 | `register/page.tsx` | Registration | Password mismatch | - | 1. Different passwords in fields<br>2. Click Register | "Passwords don't match" error | UI | P1 |
| AUTH-013 | `register/page.tsx` | Registration | Invalid email format | - | 1. Enter "notanemail"<br>2. Click Register | Email validation error | UI | P1 |
| AUTH-014 | `register/page.tsx` | Registration | Long username (>50 chars) | - | 1. Enter 51+ char username<br>2. Click Register | Truncation or error | UI | P2 |
| AUTH-015 | `register/page.tsx` | Registration | Special chars in username | - | 1. Enter "user@#$%"<br>2. Click Register | Sanitized or rejected | UI | P2 |
| AUTH-016 | `forgot-password/page.tsx` | Password Reset | Valid email | User registered | 1. Enter registered email<br>2. Click Reset | Success message, email sent | UI | P0 |
| AUTH-017 | `forgot-password/page.tsx` | Password Reset | Invalid email | - | 1. Enter unregistered email<br>2. Click Reset | Generic success message (security) | UI | P1 |
| AUTH-018 | `reset-password/page.tsx` | Password Reset | Valid token | Valid reset token | 1. Access reset link<br>2. Enter new password<br>3. Confirm | Password updated, redirect to login | UI | P0 |
| AUTH-019 | `reset-password/page.tsx` | Password Reset | Expired token | Expired token | 1. Access expired link<br>2. Try to reset | Error: Token expired | UI | P0 |
| AUTH-020 | `reset-password/page.tsx` | Password Reset | Used token | Already used token | 1. Access used link<br>2. Try to reset | Error: Token invalid | UI | P0 |
| AUTH-021 | `api/auth/[...nextauth]/route.ts` | Google OAuth | Successful login | Google account | 1. Click "Continue with Google"<br>2. Select account<br>3. Authorize | Account created/linked, logged in | UI | P0 |
| AUTH-022 | `api/auth/[...nextauth]/route.ts` | Google OAuth | Deny permission | Google account | 1. Click Google login<br>2. Deny permissions | Return to login with error | UI | P1 |
| AUTH-023 | `api/auth/[...nextauth]/route.ts` | Google OAuth | Cancel flow | Google account | 1. Click Google login<br>2. Close popup | Return to login, no error | UI | P2 |
| AUTH-024 | `api/auth/[...nextauth]/route.ts` | Session | Token expiration | Logged in user | 1. Wait for token expiry<br>2. Perform action | Redirect to login | UI | P1 |
| AUTH-025 | `middleware.ts` | Protected Routes | Unauthenticated access | Not logged in | 1. Access /dashboard directly | Redirect to login | UI | P0 |
| AUTH-026 | `middleware.ts` | Protected Routes | Authenticated access | Logged in | 1. Access /dashboard | Dashboard loads | UI | P0 |
| AUTH-027 | `verify-email/page.tsx` | Email Verification | Valid token | Unverified user | 1. Click verification link | Email verified, success shown | UI | P0 |
| AUTH-028 | `verify-email/page.tsx` | Email Verification | Invalid token | - | 1. Click malformed link | Error message shown | UI | P1 |
| AUTH-029 | `settings/page.tsx` | Account Settings | Change password | Logged in | 1. Enter current password<br>2. Enter new password<br>3. Confirm | Password updated | UI | P1 |
| AUTH-030 | `settings/page.tsx` | Account Settings | Wrong current password | Logged in | 1. Enter wrong current password | Error: Invalid current password | UI | P1 |
| AUTH-031 | `settings/page.tsx` | Account Settings | Delete account | Logged in | 1. Click delete<br>2. Confirm password<br>3. Confirm deletion | Account deleted, data anonymized | UI | P1 |
| AUTH-032 | `settings/page.tsx` | Account Settings | Update profile | Logged in | 1. Change display name<br>2. Add bio<br>3. Save | Profile updated | UI | P2 |
| AUTH-033 | `settings/page.tsx` | Account Settings | Upload avatar | Logged in | 1. Select image file<br>2. Crop if needed<br>3. Save | Avatar updated | UI | P2 |
| AUTH-034 | `settings/page.tsx` | Account Settings | Invalid avatar file | Logged in | 1. Select .exe file<br>2. Try to upload | Error: Invalid file type | UI | P2 |
| AUTH-035 | `settings/page.tsx` | Account Settings | Large avatar file | Logged in | 1. Select >5MB image<br>2. Try to upload | Error: File too large | UI | P2 |

### 4.2 Dashboard & Navigation

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| DASH-001 | `dashboard/page.tsx` | Dashboard Load | Authenticated user | Logged in | 1. Navigate to /dashboard | Dashboard loads with user data | UI | P0 |
| DASH-002 | `dashboard/page.tsx` | Dashboard Redirect | Unauthenticated | Not logged in | 1. Access /dashboard | Redirect to /login | UI | P0 |
| DASH-003 | `dashboard/page.tsx` | Pillar Navigation | Click Community | On dashboard | 1. Click Community pillar | Navigate to /community/discussions | UI | P0 |
| DASH-004 | `dashboard/page.tsx` | Pillar Navigation | Click Providers | On dashboard | 1. Click Providers pillar | Navigate to /providers | UI | P0 |
| DASH-005 | `dashboard/page.tsx` | Pillar Navigation | Click AI Support | On dashboard | 1. Click AI Support pillar | Navigate to /ai-support | UI | P0 |
| DASH-006 | `dashboard/page.tsx` | Pillar Navigation | Click Screening | On dashboard | 1. Click Screening pillar | Navigate to /screening | UI | P0 |
| DASH-007 | `dashboard/page.tsx` | Pillar Navigation | Click AAC | On dashboard | 1. Click AAC pillar | Navigate to /aac/app | UI | P0 |
| DASH-008 | `dashboard/page.tsx` | Quote Display | Quote rotation | On dashboard | 1. Wait 8 seconds | Quote fades and changes | UI | P2 |
| DASH-009 | `dashboard/page.tsx` | Notifications | Unread count | Logged in with notifications | 1. View dashboard | Notification badge shows count | UI | P1 |
| DASH-010 | `dashboard/page.tsx` | Support Tools | Click Therapy Log | On dashboard | 1. Click Therapy Log | Navigate to /therapy-log | UI | P1 |
| DASH-011 | `dashboard/page.tsx` | Support Tools | Click Daily Wins | On dashboard | 1. Click Daily Wins | Navigate to /daily-wins | UI | P1 |
| DASH-012 | `dashboard/page.tsx` | Support Tools | Click Calm | On dashboard | 1. Click Breathe & Calm | Navigate to /calm | UI | P1 |
| DASH-013 | `dashboard/page.tsx` | Support Tools | Click Navigator | On dashboard | 1. Click Support Navigator | Navigate to /autism-navigator | UI | P1 |
| DASH-014 | `components/layout/navbar.tsx` | Navigation | Desktop dropdown | Logged in, desktop | 1. Hover over "Community"<br>2. Click submenu item | Dropdown opens, navigation works | UI | P0 |
| DASH-015 | `components/layout/navbar.tsx` | Navigation | Mobile menu | Logged in, mobile | 1. Click hamburger menu<br>2. Select item | Menu opens, navigation works | UI | P0 |
| DASH-016 | `components/layout/navbar.tsx` | Navigation | Theme toggle | Any page | 1. Click theme toggle | Theme switches dark/light | UI | P1 |
| DASH-017 | `components/layout/navbar.tsx` | Navigation | Sign out | Logged in | 1. Click user menu<br>2. Click Sign Out | Session cleared, redirect to home | UI | P0 |
| DASH-018 | `components/layout/navbar.tsx` | Navigation | Help button | Any page | 1. Click Help button | Navigate to /crisis | UI | P0 |
| DASH-019 | `components/layout/navbar.tsx` | Navigation | Active state | On Community page | 1. View navigation | Community highlighted | UI | P2 |
| DASH-020 | `components/layout/navbar.tsx` | Navigation | Scroll behavior | Scroll page | 1. Scroll down<br>2. Scroll up | Navbar style changes on scroll | UI | P2 |

### 4.3 AAC Communicator (Augmentative and Alternative Communication)

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| AAC-001 | `aac/app/page.tsx` | Board Display | Load AAC board | Logged in | 1. Navigate to /aac/app | Grid of symbol cards displayed | UI | P0 |
| AAC-002 | `aac/app/page.tsx` | Category Tabs | Switch category | On AAC page | 1. Click "Food" tab<br>2. Click "Actions" tab | Grid updates with category symbols | UI | P0 |
| AAC-003 | `features/aac/AACBoard.tsx` | Symbol Selection | Select word | On AAC page | 1. Click "I want" symbol | Word appears in sentence bar | UI | P0 |
| AAC-004 | `features/aac/AACBoard.tsx` | Sentence Building | Build sentence | On AAC page | 1. Click "I"<br>2. Click "want"<br>3. Click "water" | Sentence "I want water" built | UI | P0 |
| AAC-005 | `features/aac/AACSentenceBar.tsx` | Speech | Speak sentence | Sentence built | 1. Click speak button | Audio plays sentence | UI | P0 |
| AAC-006 | `features/aac/AACSentenceBar.tsx` | Clear | Clear sentence | Sentence built | 1. Click clear button | Sentence bar emptied | UI | P0 |
| AAC-007 | `features/aac/AACSentenceBar.tsx` | Remove Word | Remove last word | Sentence built | 1. Click backspace | Last word removed | UI | P0 |
| AAC-008 | `features/aac/AACControlPanel.tsx` | Voice Settings | Change voice | On AAC page | 1. Open settings<br>2. Select different voice | Voice changed | UI | P1 |
| AAC-009 | `features/aac/AACControlPanel.tsx` | Speed Control | Adjust speed | On AAC page | 1. Open settings<br>2. Adjust speed slider | Speech speed changed | UI | P1 |
| AAC-010 | `features/aac/AACControlPanel.tsx` | Volume Control | Adjust volume | On AAC page | 1. Open settings<br>2. Adjust volume slider | Volume changed | UI | P1 |
| AAC-011 | `features/aac/AACControlPanel.tsx` | Grid Size | Change grid size | On AAC page | 1. Open settings<br>2. Select 4x4 or 6x6 | Grid layout changes | UI | P2 |
| AAC-012 | `features/aac/AACCard.tsx` | Symbol Size | Toggle large symbols | On AAC page | 1. Enable large symbols | Symbols displayed larger | UI | P2 |
| AAC-013 | `features/aac/AACWordEditor.tsx` | Custom Word | Add custom word | On AAC page | 1. Click add word<br>2. Enter label<br>3. Upload image<br>4. Save | Custom word added to board | UI | P1 |
| AAC-014 | `features/aac/AACWordEditor.tsx` | Edit Word | Edit custom word | Custom word exists | 1. Click edit on word<br>2. Modify label<br>3. Save | Word updated | UI | P1 |
| AAC-015 | `features/aac/AACWordEditor.tsx` | Delete Word | Remove custom word | Custom word exists | 1. Click delete on word<br>2. Confirm | Word removed | UI | P1 |
| AAC-016 | `features/aac/AACPredictionBar.tsx` | Word Prediction | Show predictions | On AAC page | 1. Select "I" | "want", "like" predicted | UI | P1 |
| AAC-017 | `features/aac/AACPredictionBar.tsx` | Prediction Click | Use prediction | Predictions shown | 1. Click predicted word | Word added to sentence | UI | P1 |
| AAC-018 | `features/aac/AACCategoryTabs.tsx` | Search | Search symbols | On AAC page | 1. Type "eat" in search | Matching symbols shown | UI | P1 |
| AAC-019 | `features/aac/AACBoard.tsx` | Accessibility | Keyboard navigation | On AAC page | 1. Press Tab<br>2. Press Enter | Symbols focusable, selectable | UI | P1 |
| AAC-020 | `features/aac/AACBoard.tsx` | Accessibility | Screen reader | Screen reader on | 1. Navigate symbols | Labels announced correctly | UI | P1 |
| AAC-021 | `features/aac/services/vocabulary.ts` | Persistence | Save vocabulary | Logged in | 1. Add custom words<br>2. Log out<br>3. Log back in | Words persisted | DB | P0 |
| AAC-022 | `api/aac/vocabulary/route.ts` | API | Get vocabulary | Logged in | GET /api/aac/vocabulary | Returns user's vocabulary | API | P0 |
| AAC-023 | `api/aac/vocabulary/route.ts` | API | Add vocabulary | Logged in | POST /api/aac/vocabulary | Creates vocabulary item | API | P0 |
| AAC-024 | `api/aac/vocabulary/route.ts` | API | Update vocabulary | Own vocabulary | PATCH /api/aac/vocabulary/:id | Updates vocabulary item | API | P0 |
| AAC-025 | `api/aac/vocabulary/route.ts` | API | Delete vocabulary | Own vocabulary | DELETE /api/aac/vocabulary/:id | Deletes vocabulary item | API | P0 |
| AAC-026 | `api/aac/vocabulary/route.ts` | API | Unauthorized delete | Other user's vocab | DELETE /api/aac/vocabulary/:id | Returns 403 | API | P0 |
| AAC-027 | `api/aac/vocabulary/route.ts` | Security | XSS in label | Logged in | POST with `<script>alert(1)</script>` | Label sanitized | Security | P0 |
| AAC-028 | `api/aac/vocabulary/route.ts` | Validation | Long label | Logged in | POST with 1000 char label | Truncated or rejected | API | P1 |

### 4.4 Therapy Log

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| THER-001 | `therapy-log/page.tsx` | List View | View sessions | Logged in | 1. Navigate to /therapy-log | List of therapy sessions shown | UI | P0 |
| THER-002 | `therapy-log/page.tsx` | Empty State | No sessions | New user | 1. Navigate to /therapy-log | Empty state with CTA shown | UI | P1 |
| THER-003 | `therapy-log/TherapyLogApp.tsx` | Add Session | Create session | Logged in | 1. Click "Add Session"<br>2. Fill form<br>3. Save | Session created | UI | P0 |
| THER-004 | `therapy-log/TherapyLogApp.tsx` | Required Fields | Missing fields | Logged in | 1. Click Save without filling | Validation errors shown | UI | P0 |
| THER-005 | `therapy-log/TherapyLogApp.tsx` | Session Types | ABA therapy | Adding session | 1. Select "ABA" type<br>2. Save | Type saved correctly | UI | P0 |
| THER-006 | `therapy-log/TherapyLogApp.tsx` | Session Types | Speech therapy | Adding session | 1. Select "Speech" type<br>2. Save | Type saved correctly | UI | P0 |
| THER-007 | `therapy-log/TherapyLogApp.tsx` | Session Types | OT therapy | Adding session | 1. Select "Occupational" type<br>2. Save | Type saved correctly | UI | P0 |
| THER-008 | `therapy-log/TherapyLogApp.tsx` | Child Name | Enter child name | Adding session | 1. Enter child's name<br>2. Save | Name saved, encrypted | UI | P0 |
| THER-009 | `therapy-log/TherapyLogApp.tsx` | Therapist | Enter therapist | Adding session | 1. Enter therapist name<br>2. Save | Name saved | UI | P0 |
| THER-010 | `therapy-log/TherapyLogApp.tsx` | Date | Select date | Adding session | 1. Pick date from calendar<br>2. Save | Date saved | UI | P0 |
| THER-011 | `therapy-log/TherapyLogApp.tsx` | Future Date | Future session | Adding session | 1. Select future date<br>2. Save | Warning or allowed | UI | P2 |
| THER-012 | `therapy-log/TherapyLogApp.tsx` | Duration | Set duration | Adding session | 1. Set 60 minutes<br>2. Save | Duration saved | UI | P1 |
| THER-013 | `therapy-log/TherapyLogApp.tsx` | Notes | Add notes | Adding session | 1. Enter session notes<br>2. Save | Notes encrypted and saved | UI | P0 |
| THER-014 | `therapy-log/TherapyLogApp.tsx` | Mood Rating | Rate mood | Adding session | 1. Select mood 1-5<br>2. Save | Mood rating saved | UI | P1 |
| THER-015 | `therapy-log/TherapyLogApp.tsx` | Edit Session | Modify session | Session exists | 1. Click edit<br>2. Change notes<br>3. Save | Session updated | UI | P0 |
| THER-016 | `therapy-log/TherapyLogApp.tsx` | Delete Session | Remove session | Session exists | 1. Click delete<br>2. Confirm | Session deleted | UI | P0 |
| THER-017 | `therapy-log/TherapyLogApp.tsx` | Filter | Filter by type | Multiple sessions | 1. Select "ABA" filter | Only ABA sessions shown | UI | P2 |
| THER-018 | `therapy-log/TherapyLogApp.tsx` | Filter | Filter by date | Multiple sessions | 1. Select date range | Sessions in range shown | UI | P2 |
| THER-019 | `therapy-log/TherapyLogApp.tsx` | Search | Search notes | Multiple sessions | 1. Type keyword in search | Matching sessions shown | UI | P2 |
| THER-020 | `therapy-log/TherapyLogApp.tsx` | Sort | Sort by date | Multiple sessions | 1. Sort newest first | Correct order displayed | UI | P2 |
| THER-021 | `therapy-log/TherapyLogApp.tsx` | Export | Export sessions | Sessions exist | 1. Click Export<br>2. Select format | File downloaded | UI | P2 |
| THER-022 | `api/therapy-sessions/route.ts` | API | List sessions | Logged in | GET /api/therapy-sessions | Returns user's sessions | API | P0 |
| THER-023 | `api/therapy-sessions/route.ts` | API | Create session | Logged in | POST /api/therapy-sessions | Creates session | API | P0 |
| THER-024 | `api/therapy-sessions/[id]/route.ts` | API | Update session | Own session | PATCH /api/therapy-sessions/:id | Updates session | API | P0 |
| THER-025 | `api/therapy-sessions/[id]/route.ts` | API | Delete session | Own session | DELETE /api/therapy-sessions/:id | Deletes session | API | P0 |
| THER-026 | `lib/encryption/index.ts` | Security | PHI encryption | Session created | 1. Check database directly | Notes encrypted at rest | Security | P0 |
| THER-027 | `lib/encryption/index.ts` | Security | Decryption | Viewing session | 1. View session | Notes decrypted for display | Security | P0 |
| THER-028 | `api/therapy-sessions/route.ts` | Security | Access other user's data | Different user | GET /api/therapy-sessions | Only own sessions returned | Security | P0 |

### 4.5 Daily Wins

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| DW-001 | `daily-wins/page.tsx` | View Wins | List daily wins | Logged in | 1. Navigate to /daily-wins | Calendar and wins displayed | UI | P0 |
| DW-002 | `daily-wins/DailyWinsApp.tsx` | Add Win | Create win | Logged in | 1. Click "Add Win"<br>2. Enter content<br>3. Save | Win created for today | UI | P0 |
| DW-003 | `daily-wins/DailyWinsApp.tsx` | Category | Categorize win | Adding win | 1. Select "Communication"<br>2. Save | Category saved | UI | P1 |
| DW-004 | `daily-wins/DailyWinsApp.tsx` | Mood | Add mood | Adding win | 1. Select mood emoji<br>2. Save | Mood saved | UI | P1 |
| DW-005 | `daily-wins/DailyWinsApp.tsx` | Empty Content | Blank win | Adding win | 1. Save without content | Validation error | UI | P0 |
| DW-006 | `daily-wins/DailyWinsApp.tsx` | Long Content | Very long win | Adding win | 1. Enter 1000+ characters | Handled appropriately | UI | P2 |
| DW-007 | `daily-wins/DailyWinsApp.tsx` | Edit Win | Modify win | Win exists | 1. Click edit<br>2. Change content<br>3. Save | Win updated | UI | P1 |
| DW-008 | `daily-wins/DailyWinsApp.tsx` | Delete Win | Remove win | Win exists | 1. Click delete<br>2. Confirm | Win deleted | UI | P1 |
| DW-009 | `daily-wins/DailyWinsApp.tsx` | Calendar | Select date | Viewing wins | 1. Click past date | Wins for that date shown | UI | P1 |
| DW-010 | `daily-wins/DailyWinsApp.tsx` | Streak | View streak | Multiple days | 1. View dashboard | Streak counter displayed | UI | P2 |
| DW-011 | `daily-wins/DailyWinsApp.tsx` | Share | Share win | Win exists | 1. Click share<br>2. Select method | Sharing options shown | UI | P3 |
| DW-012 | `api/daily-wins/route.ts` | API | CRUD operations | Logged in | Test all CRUD | Operations work | API | P0 |

### 4.6 Community & Posts

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| COM-001 | `community/page.tsx` | Feed Load | View posts | - | 1. Navigate to /community | Posts displayed with pagination | UI | P0 |
| COM-002 | `community/page.tsx` | Category Filter | Filter by category | On community page | 1. Select "Diagnosis" category | Posts filtered | UI | P0 |
| COM-003 | `community/page.tsx` | Sort | Sort posts | On community page | 1. Select "Top" sort | Posts sorted by votes | UI | P1 |
| COM-004 | `community/page.tsx` | Sort | Sort by new | On community page | 1. Select "New" sort | Posts sorted by date | UI | P1 |
| COM-005 | `features/community/PostCard.tsx` | Vote | Upvote post | Logged in | 1. Click upvote arrow | Vote count increases | UI | P0 |
| COM-006 | `features/community/PostCard.tsx` | Vote | Remove vote | Voted post | 1. Click upvote again | Vote removed | UI | P0 |
| COM-007 | `features/community/PostCard.tsx` | Vote | Downvote post | Logged in | 1. Click downvote arrow | Vote count decreases | UI | P0 |
| COM-008 | `features/community/PostCard.tsx` | Bookmark | Save post | Logged in | 1. Click bookmark icon | Post saved | UI | P0 |
| COM-009 | `features/community/PostCard.tsx` | Bookmark | Remove bookmark | Bookmarked post | 1. Click bookmark again | Bookmark removed | UI | P0 |
| COM-010 | `features/community/PostCard.tsx` | Share | Share post | On post | 1. Click share<br>2. Copy link | Link copied | UI | P2 |
| COM-011 | `features/community/PostCard.tsx` | Report | Report post | Logged in | 1. Click report<br>2. Select reason<br>3. Submit | Report submitted | UI | P1 |
| COM-012 | `community/new/page.tsx` | Create Post | New post | Logged in | 1. Click "New Post"<br>2. Fill title/content<br>3. Select category<br>4. Submit | Post created | UI | P0 |
| COM-013 | `community/new/page.tsx` | Anonymous | Post anonymously | Creating post | 1. Check "Anonymous"<br>2. Submit | Posted as Anonymous | UI | P0 |
| COM-014 | `community/new/page.tsx` | Tags | Add tags | Creating post | 1. Add "#autism" tag<br>2. Submit | Tags saved | UI | P1 |
| COM-015 | `community/new/page.tsx` | Image | Upload image | Creating post | 1. Select image<br>2. Submit | Image attached | UI | P1 |
| COM-016 | `community/new/page.tsx` | Validation | Empty title | Creating post | 1. Submit without title | Error shown | UI | P0 |
| COM-017 | `community/[id]/page.tsx` | View Post | Full post | Post exists | 1. Click on post | Full post with comments | UI | P0 |
| COM-018 | `community/[id]/page.tsx` | Edit Post | Modify own post | Own post | 1. Click edit<br>2. Change content<br>3. Save | Post updated | UI | P0 |
| COM-019 | `community/[id]/page.tsx` | Delete Post | Remove own post | Own post | 1. Click delete<br>2. Confirm | Post soft-deleted | UI | P0 |
| COM-020 | `features/community/CommentComposer.tsx` | Comment | Add comment | Logged in, on post | 1. Type comment<br>2. Submit | Comment added | UI | P0 |
| COM-021 | `features/community/CommentThread.tsx` | Reply | Reply to comment | Logged in | 1. Click reply<br>2. Type<br>3. Submit | Reply nested under comment | UI | P0 |
| COM-022 | `features/community/CommentThread.tsx` | Vote | Vote on comment | Logged in | 1. Upvote comment | Vote registered | UI | P1 |
| COM-023 | `api/posts/route.ts` | API | List posts | - | GET /api/posts | Paginated posts returned | API | P0 |
| COM-024 | `api/posts/route.ts` | API | Create post | Logged in | POST /api/posts | Post created | API | P0 |
| COM-025 | `api/posts/[id]/route.ts` | API | Get post | Post exists | GET /api/posts/:id | Post details returned | API | P0 |
| COM-026 | `api/posts/[id]/route.ts` | API | Update post | Own post | PATCH /api/posts/:id | Post updated | API | P0 |
| COM-027 | `api/posts/[id]/route.ts` | API | Delete post | Own post | DELETE /api/posts/:id | Post deleted | API | P0 |
| COM-028 | `api/posts/[id]/comments/route.ts` | API | Get comments | Post exists | GET /api/posts/:id/comments | Comments returned | API | P0 |
| COM-029 | `api/posts/[id]/comments/route.ts` | API | Add comment | Logged in | POST /api/posts/:id/comments | Comment created | API | P0 |
| COM-030 | `api/votes/route.ts` | API | Vote | Logged in | POST /api/votes | Vote recorded | API | P0 |
| COM-031 | `api/bookmarks/route.ts` | API | Bookmark | Logged in | POST /api/bookmarks | Bookmark created | API | P0 |

### 4.7 Messaging System

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| MSG-001 | `messages/page.tsx` | List Conversations | View chats | Logged in | 1. Navigate to /messages | Conversation list displayed | UI | P0 |
| MSG-002 | `messages/MessagesClient.tsx` | New Message | Start chat | Logged in | 1. Click "New"<br>2. Search user<br>3. Select user<br>4. Type message<br>5. Send | Message sent, conversation created | UI | P0 |
| MSG-003 | `messages/MessagesClient.tsx` | Send Message | Reply in chat | In conversation | 1. Type message<br>2. Press Enter | Message sent | UI | P0 |
| MSG-004 | `messages/MessagesClient.tsx` | Empty Message | Send nothing | In conversation | 1. Press Enter without typing | Nothing sent | UI | P0 |
| MSG-005 | `messages/MessagesClient.tsx` | Long Message | Very long text | In conversation | 1. Type 2000+ chars<br>2. Send | Handled appropriately | UI | P1 |
| MSG-006 | `messages/MessagesClient.tsx` | Image | Send image | In conversation | 1. Click attach<br>2. Select image<br>3. Send | Image sent | UI | P1 |
| MSG-007 | `messages/MessagesClient.tsx` | Emoji | Send emoji | In conversation | 1. Open emoji picker<br>2. Select emoji | Emoji inserted and sent | UI | P2 |
| MSG-008 | `messages/MessagesClient.tsx` | Delete Message | Remove message | Own message | 1. Click menu<br>2. Select delete<br>3. Confirm | Message deleted | UI | P1 |
| MSG-009 | `messages/MessagesClient.tsx` | Block User | Block sender | In conversation | 1. Click menu<br>2. Block user | User blocked | UI | P1 |
| MSG-010 | `messages/MessagesClient.tsx` | Report | Report message | In conversation | 1. Click menu<br>2. Report<br>3. Select reason | Report submitted | UI | P1 |
| MSG-011 | `messages/MessagesClient.tsx` | Search | Find conversation | Multiple chats | 1. Type in search<br>2. Select result | Conversation opened | UI | P1 |
| MSG-012 | `messages/MessagesClient.tsx` | Real-time | Receive message | Conversation open | 1. Other user sends message | Message appears without refresh | UI | P0 |
| MSG-013 | `messages/MessagesClient.tsx` | Notifications | Unread badge | New message | 1. Receive message while elsewhere | Badge count updated | UI | P1 |
| MSG-014 | `api/messages/conversations/route.ts` | API | List conversations | Logged in | GET /api/messages/conversations | Conversations returned | API | P0 |
| MSG-015 | `api/messages/conversations/[id]/route.ts` | API | Get messages | Participant | GET /api/messages/conversations/:id | Messages returned | API | P0 |
| MSG-016 | `api/messages/conversations/[id]/route.ts` | API | Send message | Participant | POST /api/messages/conversations/:id | Message created | API | P0 |
| MSG-017 | `api/messages/block/route.ts` | API | Block user | Logged in | POST /api/messages/block | User blocked | API | P1 |
| MSG-018 | `api/messages/report/route.ts` | API | Report message | Logged in | POST /api/messages/report | Report created | API | P1 |
| MSG-019 | `api/messages/conversations/route.ts` | Security | Access unauthorized | Not participant | GET /api/messages/conversations/:id | Returns 403 | Security | P0 |
| MSG-020 | `api/messages/conversations/[id]/route.ts` | Rate Limit | Spam messages | Logged in | Send 100 messages rapidly | Rate limited | Security | P0 |

### 4.8 Autism Navigator

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| NAV-001 | `autism-navigator/page.tsx` | Load | View navigator | Logged in | 1. Navigate to /autism-navigator | Roadmap displayed | UI | P0 |
| NAV-002 | `features/autism-navigator/roadmap/RoadmapIntro.tsx` | Welcome | View intro | First visit | 1. Open navigator | Welcome modal shown | UI | P2 |
| NAV-003 | `features/autism-navigator/roadmap/RoadmapStep.tsx` | Step View | View step details | On navigator | 1. Click a step | Step details expanded | UI | P0 |
| NAV-004 | `features/autism-navigator/roadmap/StepStatusSelector.tsx` | Status | Mark complete | On step | 1. Click "Mark Complete" | Status updated | UI | P0 |
| NAV-005 | `features/autism-navigator/roadmap/StepStatusSelector.tsx` | Status | Mark in progress | On step | 1. Click "In Progress" | Status updated | UI | P0 |
| NAV-006 | `features/autism-navigator/roadmap/StepAIChat.tsx` | AI Help | Ask question | On step | 1. Click AI chat<br>2. Type question<br>3. Send | AI response shown | UI | P1 |
| NAV-007 | `features/autism-navigator/roadmap/DocumentChecklist.tsx` | Checklist | View documents | On step | 1. View checklist | Required documents listed | UI | P1 |
| NAV-008 | `features/autism-navigator/roadmap/DocumentChecklist.tsx` | Checklist | Mark document | On checklist | 1. Check checkbox | Item marked complete | UI | P1 |
| NAV-009 | `features/autism-navigator/roadmap/ProviderFinder.tsx` | Find Providers | Search providers | On step | 1. Enter ZIP code<br>2. Click search | Providers listed | UI | P0 |
| NAV-010 | `features/autism-navigator/roadmap/ProviderFinder.tsx` | Filter | Filter by specialty | Providers listed | 1. Select "ABA"<br>2. Apply | Filtered results | UI | P1 |
| NAV-011 | `features/autism-navigator/roadmap/GovernmentContactCard.tsx` | Resources | View contacts | On step | 1. Click resources tab | Government contacts shown | UI | P1 |
| NAV-012 | `features/autism-navigator/roadmap/SchoolContactCard.tsx` | School | School resources | On step | 1. Click school tab | School district info shown | UI | P1 |
| NAV-013 | `features/autism-navigator/roadmap/MedicaidContactCard.tsx` | Medicaid | Medicaid info | On step | 1. Click Medicaid tab | Contact info displayed | UI | P1 |
| NAV-014 | `features/autism-navigator/roadmap/PlainLanguageToggle.tsx` | Accessibility | Simple language | On navigator | 1. Toggle plain language | Content simplified | UI | P2 |
| NAV-015 | `features/autism-navigator/roadmap/StepProgress.tsx` | Progress | View overall progress | On navigator | 1. View progress bar | Percentage shown | UI | P2 |
| NAV-016 | `features/autism-navigator/roadmap/FutureHook.tsx` | Next Steps | View future | On completed step | 1. Complete step | Next steps suggested | UI | P2 |
| NAV-017 | `features/autism-navigator/utils/pdfGenerator.ts` | Export | Generate PDF | On navigator | 1. Click "Export"<br>2. Select PDF | PDF downloaded | UI | P2 |
| NAV-018 | `features/autism-navigator/utils/ResourceFinder.ts` | Resources | Find local resources | Entered ZIP | 1. Search resources | Local resources shown | UI | P1 |

### 4.9 Provider Directory

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| PROV-001 | `providers/page.tsx` | Search | Find by location | - | 1. Enter city/ZIP<br>2. Search | Providers in area shown | UI | P0 |
| PROV-002 | `providers/page.tsx` | Filter | Filter by specialty | Providers listed | 1. Check "ABA"<br>2. Apply | ABA providers shown | UI | P0 |
| PROV-003 | `providers/page.tsx` | Filter | Filter by rating | Providers listed | 1. Select 4+ stars | High-rated providers shown | UI | P1 |
| PROV-004 | `providers/page.tsx` | Sort | Sort by distance | Location entered | 1. Sort by nearest | Closest first | UI | P1 |
| PROV-005 | `providers/page.tsx` | Map | View map | Providers listed | 1. Click "Map View" | Map with markers shown | UI | P1 |
| PROV-006 | `providers/page.tsx` | Details | View provider | On list | 1. Click provider card | Detail view opened | UI | P0 |
| PROV-007 | `providers/page.tsx` | Contact | Call provider | On detail | 1. Click phone number | Phone app opened | UI | P1 |
| PROV-008 | `providers/page.tsx` | Directions | Get directions | On detail | 1. Click address | Maps app opened | UI | P1 |
| PROV-009 | `providers/page.tsx` | Review | Read reviews | On detail | 1. View reviews | Reviews displayed | UI | P1 |
| PROV-010 | `providers/page.tsx` | Review | Write review | Logged in | 1. Click "Write Review"<br>2. Rate<br>3. Comment<br>4. Submit | Review posted | UI | P1 |
| PROV-011 | `providers/page.tsx` | Save | Save provider | Logged in | 1. Click heart icon | Provider saved | UI | P1 |
| PROV-012 | `providers/page.tsx` | Share | Share provider | On detail | 1. Click share | Sharing options | UI | P2 |
| PROV-013 | `api/providers/route.ts` | API | Search providers | - | GET /api/providers?city=X | Providers returned | API | P0 |
| PROV-014 | `api/providers/route.ts` | API | Filter specialty | - | GET /api/providers?specialty=ABA | Filtered results | API | P0 |
| PROV-015 | `api/autism/npi/route.ts` | API | NPI lookup | - | GET /api/autism/npi?npi=XXX | Provider data returned | API | P0 |

### 4.10 Screening Tool (M-CHAT)

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| SCR-001 | `screening/page.tsx` | Start | Begin screening | - | 1. Navigate to /screening<br>2. Click Start | First question shown | UI | P0 |
| SCR-002 | `screening/page.tsx` | Disclaimer | Accept terms | First visit | 1. Read disclaimer<br>2. Check "I understand"<br>3. Continue | Screening starts | UI | P0 |
| SCR-003 | `screening/[group]/page.tsx` | Answer | Select answer | On question | 1. Click "Yes" or "No" | Answer recorded, next shown | UI | P0 |
| SCR-004 | `screening/[group]/page.tsx` | Progress | View progress | During screening | 1. Answer questions | Progress bar updates | UI | P1 |
| SCR-005 | `screening/[group]/page.tsx` | Previous | Go back | Answered questions | 1. Click "Previous" | Previous question shown | UI | P1 |
| SCR-006 | `screening/[group]/page.tsx` | Complete | Finish screening | All questions | 1. Answer last question | Results page shown | UI | P0 |
| SCR-007 | `screening/result/page.tsx` | Results | View score | Completed | 1. View results | Score and interpretation shown | UI | P0 |
| SCR-008 | `screening/result/page.tsx` | Risk Level | Low risk | Score 0-2 | 1. Complete with low score | "Low risk" message | UI | P0 |
| SCR-009 | `screening/result/page.tsx` | Risk Level | Medium risk | Score 3-7 | 1. Complete with medium score | "Medium risk" message | UI | P0 |
| SCR-010 | `screening/result/page.tsx` | Risk Level | High risk | Score 8-20 | 1. Complete with high score | "High risk" message | UI | P0 |
| SCR-011 | `screening/result/page.tsx` | Save | Save results | Logged in | 1. Click "Save Results" | Results saved to profile | UI | P1 |
| SCR-012 | `screening/result/page.tsx` | Share | Share results | On results | 1. Click "Share" | Export options shown | UI | P2 |
| SCR-013 | `screening/result/page.tsx` | Resources | View resources | On results | 1. Click "View Resources" | Relevant resources shown | UI | P1 |
| SCR-014 | `app/screening/scoring.ts` | Scoring | Calculate score | Answers submitted | 1. Submit answers | Score calculated correctly | Unit | P0 |
| SCR-015 | `app/screening/scoring.ts` | Scoring | Risk assessment | Score calculated | 1. Check score | Risk level determined | Unit | P0 |
| SCR-016 | `api/screening/route.ts` | API | Submit answers | - | POST /api/screening | Results returned | API | P0 |
| SCR-017 | `api/screening/route.ts` | API | Save results | Logged in | POST /api/screening with save | Results persisted | API | P0 |

### 4.11 Games & Calming Tools

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| GAME-001 | `games/page.tsx` | List Games | View all games | - | 1. Navigate to /games | Game grid displayed | UI | P0 |
| GAME-002 | `games/page.tsx` | Filter | Filter by type | On games page | 1. Select "Educational" | Educational games shown | UI | P1 |
| GAME-003 | `games/page.tsx` | Search | Find game | On games page | 1. Type "memory" | Matching games shown | UI | P1 |
| GAME-004 | `games/memory-match/page.tsx` | Memory Game | Play game | On game | 1. Click cards<br>2. Match pairs | Matches tracked, game completes | UI | P0 |
| GAME-005 | `games/memory-match/page.tsx` | Memory Game | Timer | Playing game | 1. Play for time | Timer counts | UI | P1 |
| GAME-006 | `games/memory-match/page.tsx` | Memory Game | Score | Playing game | 1. Complete game | Score displayed | UI | P1 |
| GAME-007 | `games/breathing-exercise/page.tsx` | Breathing | Follow exercise | On game | 1. Click start<br>2. Follow visual | Breathing animation plays | UI | P0 |
| GAME-008 | `games/breathing-exercise/page.tsx` | Breathing | Audio guide | On game | 1. Enable audio | Voice guides breathing | UI | P1 |
| GAME-009 | `games/calm-buddy/page.tsx` | Calm Buddy | Interact | On game | 1. Click buddy | Animation plays | UI | P0 |
| GAME-010 | `games/calm-buddy/page.tsx` | Calm Buddy | Customize | On game | 1. Change colors | Buddy appearance changes | UI | P2 |
| GAME-011 | `games/emotion-match/page.tsx` | Emotion Match | Match emotions | On game | 1. Drag emotion to face | Correct matches score | UI | P0 |
| GAME-012 | `games/pattern-complete/page.tsx` | Pattern | Complete pattern | On game | 1. Select missing piece | Pattern completed | UI | P0 |
| GAME-013 | `games/sound-match/page.tsx` | Sound Match | Match sounds | On game | 1. Click sound<br>2. Match | Correct matches score | UI | P0 |
| GAME-014 | `games/counting-stars/page.tsx` | Counting | Count stars | On game | 1. Count stars<br>2. Enter number | Correct answer advances | UI | P0 |
| GAME-015 | `games/alphabet-match/page.tsx` | Alphabet | Match letters | On game | 1. Match uppercase/lowercase | Matches tracked | UI | P0 |
| GAME-016 | `games/color-sort/page.tsx` | Color Sort | Sort colors | On game | 1. Drag to correct bucket | Colors sorted | UI | P0 |
| GAME-017 | `games/shape-puzzle/page.tsx` | Shapes | Complete puzzle | On game | 1. Drag shapes to slots | Puzzle completed | UI | P0 |
| GAME-018 | `games/tracing-letters/page.tsx` | Tracing | Trace letters | On game | 1. Follow path | Tracing tracked | UI | P0 |
| GAME-019 | `games/sequencer/page.tsx` | Sequence | Complete sequence | On game | 1. Select next item | Sequence completed | UI | P0 |
| GAME-020 | `games/zen-garden/page.tsx` | Zen Garden | Create garden | On game | 1. Add elements | Garden created | UI | P2 |
| GAME-021 | `games/balloon-pop/page.tsx` | Balloon Pop | Pop balloons | On game | 1. Click balloons | Balloons pop, score tracked | UI | P2 |
| GAME-022 | `games/tic-tac-toe/page.tsx` | Tic-Tac-Toe | Play game | On game | 1. Take turns | Game detects win/draw | UI | P2 |
| GAME-023 | `games/snake/page.tsx` | Snake | Play game | On game | 1. Control snake | Snake moves, game over on hit | UI | P2 |
| GAME-024 | `games/page.tsx` | Accessibility | Keyboard play | On game | 1. Use arrow keys | Game responds to keyboard | UI | P1 |
| GAME-025 | `games/page.tsx` | Fullscreen | Enter fullscreen | On game | 1. Click fullscreen | Game fills screen | UI | P2 |
| CALM-001 | `calm/page.tsx` | Calm Space | Load calm tools | - | 1. Navigate to /calm | Calming options displayed | UI | P0 |
| CALM-002 | `calm/CalmClient.tsx` | Breathing | Start exercise | On calm page | 1. Select breathing<br>2. Start | Animation plays | UI | P0 |
| CALM-003 | `calm/CalmClient.tsx` | Sounds | Play sounds | On calm page | 1. Select nature sound<br>2. Play | Audio plays | UI | P1 |
| CALM-004 | `calm/CalmClient.tsx` | Visuals | Watch visuals | On calm page | 1. Select visual<br>2. Play | Calming animation | UI | P1 |
| CALM-005 | `calm/CalmClient.tsx` | Timer | Set timer | On calm page | 1. Set 5 minutes<br>2. Start | Timer counts down | UI | P2 |

### 4.12 Emergency Card

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| EMRG-001 | `emergency-card/page.tsx` | Create Card | New card | Logged in | 1. Navigate to /emergency-card<br>2. Fill form<br>3. Save | Card created | UI | P0 |
| EMRG-002 | `emergency-card/page.tsx` | Child Info | Enter details | Creating card | 1. Enter name, age<br>2. Enter diagnosis | Info saved | UI | P0 |
| EMRG-003 | `emergency-card/page.tsx` | Triggers | Add triggers | Creating card | 1. List triggers | Triggers saved encrypted | UI | P0 |
| EMRG-004 | `emergency-card/page.tsx` | Strategies | Add calming | Creating card | 1. List strategies | Strategies saved encrypted | UI | P0 |
| EMRG-005 | `emergency-card/page.tsx` | Contacts | Add emergency contacts | Creating card | 1. Add 2 contacts | Contacts saved | UI | P0 |
| EMRG-006 | `emergency-card/page.tsx` | Medical | Add medical info | Creating card | 1. Add medications<br>2. Add allergies | Info saved encrypted | UI | P0 |
| EMRG-007 | `emergency-card/page.tsx` | Validation | Required fields | Creating card | 1. Save without name | Validation error | UI | P0 |
| EMRG-008 | `emergency-card/page.tsx` | Edit | Modify card | Card exists | 1. Click edit<br>2. Change info<br>3. Save | Card updated | UI | P0 |
| EMRG-009 | `emergency-card/page.tsx` | Print | Print card | Card exists | 1. Click print | Print dialog opened | UI | P1 |
| EMRG-010 | `emergency-card/page.tsx` | PDF | Export PDF | Card exists | 1. Click export PDF | PDF downloaded | UI | P1 |
| EMRG-011 | `emergency-card/page.tsx` | Share | Share digitally | Card exists | 1. Click share | Sharing options | UI | P2 |
| EMRG-012 | `api/emergency-cards/route.ts` | API | CRUD operations | Logged in | Test all operations | Operations work | API | P0 |
| EMRG-013 | `lib/encryption/index.ts` | Security | PHI encrypted | Card created | 1. Check database | Sensitive fields encrypted | Security | P0 |

### 4.13 AI Support & Stories

| Test Case ID | File/Module | Feature | Scenario | Preconditions | Steps | Expected Result | Type | Priority |
|--------------|-------------|---------|----------|---------------|-------|-----------------|------|----------|
| AI-001 | `ai-support/page.tsx` | Chat | Start chat | Logged in | 1. Navigate to /ai-support<br>2. Type message<br>3. Send | AI response received | UI | P0 |
| AI-002 | `ai-support/page.tsx` | Chat | Follow-up | In chat | 1. Ask follow-up question | Context maintained | UI | P0 |
| AI-003 | `ai-support/page.tsx` | History | View history | Logged in | 1. Click history | Past conversations listed | UI | P1 |
| AI-004 | `ai-support/page.tsx` | New Chat | Start fresh | In chat | 1. Click "New Chat" | New conversation started | UI | P1 |
| AI-005 | `ai-support/page.tsx` | Export | Save chat | In chat | 1. Click export | Chat saved/downloaded | UI | P2 |
| AI-006 | `stories/page.tsx` | Create Story | Generate story | Logged in | 1. Enter child name<br>2. Select theme<br>3. Click generate | Story generated | UI | P0 |
| AI-007 | `stories/page.tsx` | Read | Read story | Story generated | 1. Read through story | Story displayed with illustrations | UI | P0 |
| AI-008 | `stories/page.tsx` | Audio | Listen to story | Story generated | 1. Click play | Audio narration plays | UI | P1 |
| AI-009 | `stories/page.tsx` | Save | Save story | Story generated | 1. Click save | Story saved to library | UI | P1 |
| AI-010 | `stories/page.tsx` | Share | Share story | Story generated | 1. Click share | Sharing options | UI | P2 |
| AI-011 | `api/ai/chat/route.ts` | API | Send message | Logged in | POST /api/ai/chat | AI response returned | API | P0 |
| AI-012 | `api/ai/chat/route.ts` | API | Rate limit | Logged in | Send 100 requests fast | Rate limited | Security | P0 |
| AI-013 | `api/ai/navigator-chat/route.ts` | API | Navigator chat | Logged in | POST /api/ai/navigator-chat | Response returned | API | P0 |
| AI-014 | `api/ai/tts/route.ts` | API | Text to speech | Logged in | POST /api/ai/tts | Audio URL returned | API | P1 |

---

## 5. API TEST CASES

### 5.1 Authentication API

| Test Case ID | Endpoint | Method | Scenario | Request Body | Expected Status | Expected Response | Priority |
|--------------|----------|--------|----------|--------------|-----------------|-------------------|----------|
| API-AUTH-001 | /api/auth/register | POST | Valid registration | `{email, password, username, displayName}` | 201 | User object without password | P0 |
| API-AUTH-002 | /api/auth/register | POST | Duplicate email | Existing email | 409 | `{error: "Email exists"}` | P0 |
| API-AUTH-003 | /api/auth/register | POST | Weak password | Password: "123" | 400 | `{error: "Password too weak"}` | P0 |
| API-AUTH-004 | /api/auth/register | POST | Invalid email | Email: "notemail" | 400 | `{error: "Invalid email"}` | P0 |
| API-AUTH-005 | /api/auth/register | POST | Missing fields | `{}` | 400 | `{error: "Missing required fields"}` | P0 |
| API-AUTH-006 | /api/auth/register | POST | XSS attempt | `<script>alert(1)</script>` | 201 | Input sanitized | P0 |
| API-AUTH-007 | /api/auth/forgot-password | POST | Valid request | `{email}` | 200 | `{message: "Email sent"}` | P0 |
| API-AUTH-008 | /api/auth/forgot-password | POST | Non-existent | `{email: "fake@test.com"}` | 200 | Same as valid (security) | P0 |
| API-AUTH-009 | /api/auth/reset-password | POST | Valid reset | `{token, newPassword}` | 200 | `{message: "Success"}` | P0 |
| API-AUTH-010 | /api/auth/reset-password | POST | Expired token | Expired token | 400 | `{error: "Token expired"}` | P0 |
| API-AUTH-011 | /api/auth/reset-password | POST | Invalid token | `{token: "invalid"}` | 400 | `{error: "Invalid token"}` | P0 |
| API-AUTH-012 | /api/auth/verify-email | GET | Valid token | `?token=valid` | 200 | `{verified: true}` | P0 |
| API-AUTH-013 | /api/auth/verify-email | GET | Invalid token | `?token=invalid` | 400 | `{error: "Invalid token"}` | P0 |
| API-AUTH-014 | /api/auth/[...nextauth] | POST | Google callback | OAuth payload | 200 | Session created | P0 |
| API-AUTH-015 | /api/auth/[...nextauth] | POST | Invalid callback | Bad payload | 401 | `{error: "Authentication failed"}` | P0 |

### 5.2 User API

| Test Case ID | Endpoint | Method | Scenario | Auth Required | Expected Status | Priority |
|--------------|----------|--------|----------|---------------|-----------------|----------|
| API-USER-001 | /api/user/profile | GET | Get profile | Yes | 200 | P0 |
| API-USER-002 | /api/user/profile | PATCH | Update profile | Yes | 200 | P0 |
| API-USER-003 | /api/user/profile | GET | No auth | No | 401 | P0 |
| API-USER-004 | /api/user/change-password | POST | Change password | Yes | 200 | P0 |
| API-USER-005 | /api/user/change-password | POST | Wrong current | Yes | 400 | P0 |
| API-USER-006 | /api/user/delete-account | DELETE | Delete account | Yes | 200 | P0 |
| API-USER-007 | /api/user/delete-account | DELETE | Wrong password | Yes | 400 | P0 |
| API-USER-008 | /api/user/export-data | GET | Export data | Yes | 200 (file) | P1 |
| API-USER-009 | /api/users/search | GET | Search users | Yes | 200 | P1 |
| API-USER-010 | /api/users/:username | GET | Get user profile | No | 200 | P0 |
| API-USER-011 | /api/users/:username/saved | GET | Get saved posts | Yes | 200 | P1 |
| API-USER-012 | /api/users/:username/upvoted | GET | Get upvoted | Yes | 200 | P2 |

### 5.3 Posts API

| Test Case ID | Endpoint | Method | Scenario | Auth | Expected | Priority |
|--------------|----------|--------|----------|------|----------|----------|
| API-POST-001 | /api/posts | GET | List posts | No | 200 + posts[] | P0 |
| API-POST-002 | /api/posts | GET | With category | No | 200 + filtered | P0 |
| API-POST-003 | /api/posts | GET | With pagination | No | 200 + {posts, pagination} | P0 |
| API-POST-004 | /api/posts | POST | Create post | Yes | 201 + post | P0 |
| API-POST-005 | /api/posts | POST | No auth | No | 401 | P0 |
| API-POST-006 | /api/posts | POST | Missing title | Yes | 400 | P0 |
| API-POST-007 | /api/posts/:id | GET | Get post | No | 200 + post | P0 |
| API-POST-008 | /api/posts/:id | GET | Not found | No | 404 | P0 |
| API-POST-009 | /api/posts/:id | PATCH | Update own | Yes | 200 | P0 |
| API-POST-010 | /api/posts/:id | PATCH | Update other | Yes | 403 | P0 |
| API-POST-011 | /api/posts/:id | DELETE | Delete own | Yes | 200 | P0 |
| API-POST-012 | /api/posts/:id | DELETE | Delete other | Yes | 403 | P0 |
| API-POST-013 | /api/posts/:id/comments | GET | Get comments | No | 200 + comments[] | P0 |
| API-POST-014 | /api/posts/:id/comments | POST | Add comment | Yes | 201 | P0 |
| API-POST-015 | /api/posts/:id/lock | POST | Lock post | Mod | 200 | P1 |
| API-POST-016 | /api/posts/:id/pin | POST | Pin post | Mod | 200 | P1 |

### 5.4 All Other APIs

| Test Case ID | Endpoint | Method | Description | Auth | Status | Priority |
|--------------|----------|--------|-------------|------|--------|----------|
| API-OTHER-001 | /api/health | GET | Health check | No | 200 | P0 |
| API-OTHER-002 | /api/categories | GET | List categories | No | 200 | P0 |
| API-OTHER-003 | /api/tags | GET | List tags | No | 200 | P2 |
| API-OTHER-004 | /api/votes | POST | Vote | Yes | 200/201 | P0 |
| API-OTHER-005 | /api/bookmarks | POST | Bookmark | Yes | 201 | P0 |
| API-OTHER-006 | /api/reports | POST | Report | Yes | 201 | P0 |
| API-OTHER-007 | /api/comments/:id | PATCH | Edit comment | Yes | 200 | P0 |
| API-OTHER-008 | /api/comments/:id | DELETE | Delete comment | Yes | 200 | P0 |
| API-OTHER-009 | /api/resources | GET | List resources | No | 200 | P1 |
| API-OTHER-010 | /api/resources/save | POST | Save resource | Yes | 201 | P1 |
| API-OTHER-011 | /api/notifications | GET | Get notifications | Yes | 200 | P1 |
| API-OTHER-012 | /api/notifications/mark-seen | POST | Mark seen | Yes | 200 | P1 |
| API-OTHER-013 | /api/upload | POST | Upload file | Yes | 201 | P1 |
| API-OTHER-014 | /api/connections | GET | Get connections | Yes | 200 | P1 |
| API-OTHER-015 | /api/connections | POST | Send request | Yes | 201 | P1 |
| API-OTHER-016 | /api/connections/:id | PATCH | Accept/decline | Yes | 200 | P1 |
| API-OTHER-017 | /api/onboarding | POST | Complete onboarding | Yes | 200 | P1 |

---

## 6. SECURITY TEST CASES

### 6.1 Authentication Security

| Test Case ID | Component | Attack Vector | Test Steps | Expected Defense | Priority |
|--------------|-----------|---------------|------------|------------------|----------|
| SEC-AUTH-001 | Login | Brute force | Attempt 100 logins | Rate limit triggered | P0 |
| SEC-AUTH-002 | Login | SQL injection | `' OR 1=1 --` | Sanitized, login fails | P0 |
| SEC-AUTH-003 | Login | NoSQL injection | `{"$gt": ""}` | Sanitized | P0 |
| SEC-AUTH-004 | Login | XSS in email | `<script>alert(1)</script>` | Escaped or rejected | P0 |
| SEC-AUTH-005 | Registration | Email enumeration | Check if email exists | Generic messages | P0 |
| SEC-AUTH-006 | Registration | Mass registration | Create 1000 accounts | Rate limited | P0 |
| SEC-AUTH-007 | Password reset | Token prediction | Guess token format | Cryptographically secure | P0 |
| SEC-AUTH-008 | Password reset | Token replay | Reuse same token | Token invalidated after use | P0 |
| SEC-AUTH-009 | Session | Session fixation | Attempt fixation | New session ID on login | P0 |
| SEC-AUTH-010 | Session | Cookie security | Inspect cookies | HttpOnly, Secure, SameSite | P0 |
| SEC-AUTH-011 | Session | Token exposure | Check localStorage | Token not stored client-side | P0 |

### 6.2 XSS & Injection

| Test Case ID | Component | Payload | Context | Expected Result | Priority |
|--------------|-----------|---------|---------|-----------------|----------|
| SEC-XSS-001 | Post title | `<script>alert(1)</script>` | Post list | Sanitized or escaped | P0 |
| SEC-XSS-002 | Post content | `<img src=x onerror=alert(1)>` | Post display | Sanitized | P0 |
| SEC-XSS-003 | Comment | `javascript:alert(1)` | Comment link | Protocol stripped | P0 |
| SEC-XSS-004 | Username | `<svg onload=alert(1)>` | Profile page | Sanitized | P0 |
| SEC-XSS-005 | Bio | `\"><script>alert(1)</script>` | Profile display | Sanitized | P0 |
| SEC-XSS-006 | Search | `<script>alert(1)</script>` | Search results | Escaped | P0 |
| SEC-XSS-007 | AAC label | `<script>alert(1)</script>` | AAC board | Sanitized | P0 |
| SEC-XSS-008 | Therapy notes | `</textarea><script>alert(1)</script>` | Notes display | Sanitized | P0 |

### 6.3 Authorization

| Test Case ID | Resource | Attack | Steps | Expected | Priority |
|--------------|----------|--------|-------|----------|----------|
| SEC-AUTHZ-001 | Other's post | Edit | PATCH /api/posts/other-id | 403 Forbidden | P0 |
| SEC-AUTHZ-002 | Other's post | Delete | DELETE /api/posts/other-id | 403 Forbidden | P0 |
| SEC-AUTHZ-003 | Other's therapy | View | GET /api/therapy-sessions/other | Only own returned | P0 |
| SEC-AUTHZ-004 | Other's messages | Read | GET /api/messages/other-conv | 403 Forbidden | P0 |
| SEC-AUTHZ-005 | Admin endpoints | Access as user | Access /api/owner/* | 403 Forbidden | P0 |
| SEC-AUTHZ-006 | Mod actions | Mod as user | POST /api/mod/* | 403 Forbidden | P0 |
| SEC-AUTHZ-007 | IDOR | Sequential ID access | Try /api/posts/1,2,3... | Only authorized accessible | P0 |

### 6.4 Data Protection

| Test Case ID | Component | Check | Method | Expected | Priority |
|--------------|-----------|-------|--------|----------|----------|
| SEC-DATA-001 | PHI in therapy | Encryption at rest | DB query | Encrypted values | P0 |
| SEC-DATA-002 | PHI in emergency cards | Encryption at rest | DB query | Encrypted values | P0 |
| SEC-DATA-003 | Passwords | Hashing | DB query | Bcrypt hashed | P0 |
| SEC-DATA-004 | Tokens | Expiration | Wait for expiry | Token invalid | P0 |
| SEC-DATA-005 | HTTPS | Transport encryption | Network tab | All requests HTTPS | P0 |
| SEC-DATA-006 | PII in logs | Log inspection | Check server logs | No PII logged | P0 |
| SEC-DATA-007 | Headers | Security headers | Check response | HSTS, CSP, X-Frame-Options | P0 |

### 6.5 Abuse Prevention

| Test Case ID | Feature | Abuse | Limit | Expected | Priority |
|--------------|---------|-------|-------|----------|----------|
| SEC-ABUSE-001 | Post creation | Spam | 10/min | Rate limited | P0 |
| SEC-ABUSE-002 | Comments | Spam | 20/min | Rate limited | P0 |
| SEC-ABUSE-003 | Messages | Spam | 50/min | Rate limited | P0 |
| SEC-ABUSE-004 | AI chat | Token abuse | 100/day | Quota exceeded | P0 |
| SEC-ABUSE-005 | Login attempts | Brute force | 5/min | Account locked | P0 |
| SEC-ABUSE-006 | Registration | Mass accounts | 3/hour | IP rate limited | P0 |
| SEC-ABUSE-007 | File upload | Large files | 5MB | Rejected | P0 |
| SEC-ABUSE-008 | File upload | Malicious file | .exe | Rejected | P0 |

---

## 7. DATABASE TEST CASES

### 7.1 Data Integrity

| Test Case ID | Table | Operation | Test Scenario | Expected Result | Priority |
|--------------|-------|-----------|---------------|-----------------|----------|
| DB-001 | User | Create | Valid user creation | Record created with timestamps | P0 |
| DB-002 | User | Create | Duplicate email | Unique constraint error | P0 |
| DB-003 | User | Update | Update lastLoginAt | Timestamp updated | P1 |
| DB-004 | User | Delete | Cascade to Profile | Profile deleted with user | P0 |
| DB-005 | Profile | Create | Valid profile | Record created, user linked | P0 |
| DB-006 | Profile | Create | Duplicate username | Unique constraint error | P0 |
| DB-007 | Post | Create | Valid post | Record with category relation | P0 |
| DB-008 | Post | Create | Invalid categoryId | Foreign key error | P0 |
| DB-009 | Post | Update | Update voteScore | Atomic increment | P0 |
| DB-010 | Post | Delete | Soft delete | Status changed to REMOVED | P0 |
| DB-011 | Comment | Create | Valid comment | Parent post commentCount +1 | P0 |
| DB-012 | Comment | Delete | Cascade replies | Child comments deleted | P0 |
| DB-013 | Vote | Create | Valid vote | Unique constraint on user+target | P0 |
| DB-014 | Vote | Create | Duplicate vote | Conflict or update | P0 |
| DB-015 | Bookmark | Create | Valid bookmark | Unique constraint on user+post | P0 |
| DB-016 | TherapySession | Create | Valid session | PHI fields encrypted | P0 |
| DB-017 | TherapySession | Create | Future date | Accepted with warning | P2 |
| DB-018 | EmergencyCard | Create | Valid card | PHI encrypted at rest | P0 |
| DB-019 | AACVocabulary | Create | Custom word | Linked to user, order set | P0 |
| DB-020 | Conversation | Create | New conversation | UUID generated | P0 |
| DB-021 | Message | Create | Valid message | Conversation timestamp updated | P0 |
| DB-022 | Notification | Create | Valid notification | User notification count +1 | P1 |
| DB-023 | Report | Create | Valid report | Status set to OPEN | P0 |
| DB-024 | AuditLog | Create | Action logged | All fields populated | P1 |

### 7.2 Relationship Tests

| Test Case ID | Relationship | Test | Expected | Priority |
|--------------|--------------|------|----------|----------|
| DB-REL-001 | User → Profile | 1:1 enforcement | One profile per user | P0 |
| DB-REL-002 | User → Posts | 1:N | User has many posts | P0 |
| DB-REL-003 | Post → Comments | 1:N | Post has many comments | P0 |
| DB-REL-004 | Comment → Replies | Self-referential | Comments can nest | P0 |
| DB-REL-005 | User → Votes | 1:N | User votes on many | P0 |
| DB-REL-006 | Post → Category | N:1 | Post belongs to category | P0 |
| DB-REL-007 | Post → Tags | N:M | Post has multiple tags | P0 |
| DB-REL-008 | User → Roles | 1:N | User has multiple roles | P0 |
| DB-REL-009 | User → TherapySessions | 1:N | User tracks many sessions | P0 |
| DB-REL-010 | Conversation → Messages | 1:N | Conversation has messages | P0 |
| DB-REL-011 | Conversation → Participants | N:M | Multiple users per convo | P0 |

### 7.3 Transaction Tests

| Test Case ID | Scenario | Operations | Expected | Priority |
|--------------|----------|------------|----------|----------|
| DB-TRAN-001 | Post creation | Create post + update category count | Atomic | P0 |
| DB-TRAN-002 | Vote | Create vote + update post score | Atomic | P0 |
| DB-TRAN-003 | Comment | Create comment + increment count | Atomic | P0 |
| DB-TRAN-004 | User deletion | Delete user + all related data | Cascading | P0 |
| DB-TRAN-005 | Bookmark toggle | Delete old + create new | Atomic swap | P0 |

---

## 8. RESPONSIVE & CROSS-DEVICE TEST CASES

### 8.1 Breakpoint Definitions

| Breakpoint | Width Range | Device Types | Priority |
|------------|-------------|--------------|----------|
| XS | 320-374px | Small phones (iPhone SE) | P0 |
| SM | 375-639px | Standard phones (iPhone, Android) | P0 |
| MD | 640-767px | Large phones, small tablets | P0 |
| LG | 768-1023px | Tablets (iPad portrait) | P0 |
| XL | 1024-1279px | Tablets landscape, small laptops | P1 |
| 2XL | 1280-1535px | Laptops, desktops | P1 |
| 3XL | 1536px+ | Large monitors, widescreen | P2 |

### 8.2 Landing Page Responsive Tests

| Test Case ID | Component | Breakpoint | Test Scenario | Expected Result | Priority |
|--------------|-----------|------------|---------------|-----------------|----------|
| RESP-LAND-001 | Hero section | XS | View on small phone | Text readable, no overflow | P0 |
| RESP-LAND-002 | Hero section | SM | View on iPhone | Layout adjusts, CTA visible | P0 |
| RESP-LAND-003 | Hero section | MD | View on large phone | Proper spacing | P0 |
| RESP-LAND-004 | Hero section | LG | View on tablet | Two-column if applicable | P0 |
| RESP-LAND-005 | Service pillars | XS | 5 pillars display | Stack vertically, scrollable | P0 |
| RESP-LAND-006 | Service pillars | SM | 5 pillars display | 2x2 + 1 or scroll | P0 |
| RESP-LAND-007 | Service pillars | LG | 5 pillars display | 5-column or appropriate | P0 |
| RESP-LAND-008 | Quote carousel | XS | Quote display | Text wraps, doesn't overflow | P0 |
| RESP-LAND-009 | CTA buttons | XS | Button layout | Stack vertically, full width | P0 |
| RESP-LAND-010 | Theme toggle | XS | Toggle position | Visible, tappable | P0 |
| RESP-LAND-011 | Logo | XS | Logo size | Appropriate size, not pixelated | P0 |

### 8.3 Dashboard Responsive Tests

| Test Case ID | Component | Breakpoint | Test Scenario | Expected Result | Priority |
|--------------|-----------|------------|---------------|-----------------|----------|
| RESP-DASH-001 | Welcome header | XS | User name display | Truncates or wraps gracefully | P0 |
| RESP-DASH-002 | 5 Pillars | XS | Grid layout | 2 columns or single column | P0 |
| RESP-DASH-003 | 5 Pillars | SM | Grid layout | 2-3 columns | P0 |
| RESP-DASH-004 | 5 Pillars | LG | Grid layout | 5 columns or 3+2 | P0 |
| RESP-DASH-005 | Quote card | XS | Card width | Full width, readable text | P0 |
| RESP-DASH-006 | Main grid | XS | 2-column layout | Stacks to single column | P0 |
| RESP-DASH-007 | Main grid | LG | 2-column layout | Side by side | P0 |
| RESP-DASH-008 | AI Stories widget | XS | Widget display | Full width, content visible | P0 |
| RESP-DASH-009 | Messages widget | XS | Compact view | Icon and label visible | P0 |
| RESP-DASH-010 | Support Tools | XS | Tool list | Scrollable or stacked | P0 |
| RESP-DASH-011 | Games widget | XS | Game card | Visible, tappable | P0 |
| RESP-DASH-012 | Marketplace card | XS | Card display | Proper sizing | P0 |

### 8.4 Navigation Responsive Tests

| Test Case ID | Component | Breakpoint | Test Scenario | Expected Result | Priority |
|--------------|-----------|------------|---------------|-----------------|----------|
| RESP-NAV-001 | Desktop nav | LG+ | Full menu visible | All items visible, dropdowns work | P0 |
| RESP-NAV-002 | Mobile nav | XS-LG | Hamburger menu | Menu icon visible, tappable | P0 |
| RESP-NAV-003 | Mobile menu | XS | Menu opens | Full-screen or slide-out menu | P0 |
| RESP-NAV-004 | Mobile menu | XS | Menu items | Scrollable, all items reachable | P0 |
| RESP-NAV-005 | Mobile menu | XS | Close menu | X button or tap outside closes | P0 |
| RESP-NAV-006 | Theme toggle | XS | Toggle in menu | Accessible in mobile menu | P0 |
| RESP-NAV-007 | Sign out | XS | Sign out button | Visible, tappable | P0 |
| RESP-NAV-008 | Help button | XS | Emergency help | Prominent, always visible | P0 |
| RESP-NAV-009 | Notifications | XS | Badge display | Visible without overlap | P0 |
| RESP-NAV-010 | Logo | XS | Logo in nav | Visible, not cropped | P0 |

### 8.5 AAC Board Responsive Tests

| Test Case ID | Component | Breakpoint | Test Scenario | Expected Result | Priority |
|--------------|-----------|------------|---------------|-----------------|----------|
| RESP-AAC-001 | Symbol grid | XS | Grid columns | 2-3 columns, large touch targets | P0 |
| RESP-AAC-002 | Symbol grid | SM | Grid columns | 3-4 columns | P0 |
| RESP-AAC-003 | Symbol grid | LG | Grid columns | 6+ columns | P0 |
| RESP-AAC-004 | Sentence bar | XS | Display | Visible, scrollable if long | P0 |
| RESP-AAC-005 | Category tabs | XS | Tab display | Horizontal scroll or dropdown | P0 |
| RESP-AAC-006 | Control panel | XS | Settings access | Accessible via button | P0 |
| RESP-AAC-007 | Prediction bar | XS | Suggestions | Horizontal scroll if needed | P0 |
| RESP-AAC-008 | Symbol cards | XS | Touch target | Minimum 44x44px | P0 |
| RESP-AAC-009 | Symbol labels | XS | Text size | Readable, not truncated | P0 |
| RESP-AAC-010 | Fullscreen | XS | Landscape mode | Grid adjusts to landscape | P0 |

### 8.6 Community Responsive Tests

| Test Case ID | Component | Breakpoint | Test Scenario | Expected Result | Priority |
|--------------|-----------|------------|---------------|-----------------|----------|
| RESP-COMM-001 | Post list | XS | Post cards | Full width, stacked | P0 |
| RESP-COMM-002 | Post card | XS | Card content | Title, excerpt visible | P0 |
| RESP-COMM-003 | Post card | XS | Vote buttons | Visible, tappable | P0 |
| RESP-COMM-004 | Post card | XS | Action buttons | Accessible | P0 |
| RESP-COMM-005 | Filters | XS | Filter bar | Collapsible or scrollable | P0 |
| RESP-COMM-006 | New post form | XS | Form fields | Stacked, full width | P0 |
| RESP-COMM-007 | Post detail | XS | Content area | Readable width, no overflow | P0 |
| RESP-COMM-008 | Comments | XS | Nested comments | Indented appropriately | P0 |
| RESP-COMM-009 | Comment form | XS | Textarea | Full width, usable | P0 |
| RESP-COMM-010 | Sidebar | XS | Category list | Hidden or collapsible | P0 |
| RESP-COMM-011 | Sidebar | LG | Category list | Visible beside content | P0 |

### 8.7 Messages Responsive Tests

| Test Case ID | Component | Breakpoint | Test Scenario | Expected Result | Priority |
|--------------|-----------|------------|---------------|-----------------|----------|
| RESP-MSG-001 | Conversation list | XS | List view | Full screen or side panel | P0 |
| RESP-MSG-002 | Conversation list | XS | Conversation items | Avatar, name, preview visible | P0 |
| RESP-MSG-003 | Chat view | XS | Message bubbles | Proper width, not overflowing | P0 |
| RESP-MSG-004 | Chat input | XS | Text input | Full width, keyboard accessible | P0 |
| RESP-MSG-005 | Chat input | XS | With keyboard | Input stays visible | P0 |
| RESP-MSG-006 | Message actions | XS | Long press | Context menu on long press | P1 |
| RESP-MSG-007 | New message | XS | User search | Full-screen modal | P0 |
| RESP-MSG-008 | Split view | LG | Conversation + chat | Side-by-side layout | P0 |

### 8.8 Games Responsive Tests

| Test Case ID | Component | Breakpoint | Test Scenario | Expected Result | Priority |
|--------------|-----------|------------|---------------|-----------------|----------|
| RESP-GAME-001 | Games grid | XS | Game cards | 2 columns, scrollable | P0 |
| RESP-GAME-002 | Game canvas | XS | Memory match | Canvas fits screen | P0 |
| RESP-GAME-003 | Game canvas | XS | Touch controls | Touch targets appropriate | P0 |
| RESP-GAME-004 | Game canvas | LG | Breathing exercise | Centered, proportional | P0 |
| RESP-GAME-005 | Fullscreen | XS | Enter fullscreen | Fills viewport | P0 |
| RESP-GAME-006 | Fullscreen | XS | Exit fullscreen | Back button visible | P0 |
| RESP-GAME-007 | Game UI | XS | Score display | Visible, not overlapping | P0 |
| RESP-GAME-008 | Game UI | XS | Pause button | Tappable, always visible | P0 |

### 8.9 Forms Responsive Tests

| Test Case ID | Component | Breakpoint | Test Scenario | Expected Result | Priority |
|--------------|-----------|------------|---------------|-----------------|----------|
| RESP-FORM-001 | Login form | XS | Input fields | Full width, 16px font (no zoom) | P0 |
| RESP-FORM-002 | Login form | XS | With keyboard | Form scrolls to keep input visible | P0 |
| RESP-FORM-003 | Registration | XS | All fields | Scrollable, submit visible | P0 |
| RESP-FORM-004 | Therapy log | XS | Form layout | Stacked fields | P0 |
| RESP-FORM-005 | Therapy log | XS | Date picker | Native picker or usable custom | P0 |
| RESP-FORM-006 | Emergency card | XS | Long textareas | Expandable, scrollable | P0 |
| RESP-FORM-007 | New post | XS | Rich editor | Toolbar adapts, usable | P0 |
| RESP-FORM-008 | All forms | XS | Error messages | Visible, not clipped | P0 |
| RESP-FORM-009 | All forms | XS | Submit button | Full width, prominent | P0 |

### 8.10 Cross-Device Touch/Interaction Tests

| Test Case ID | Component | Interaction | Test Scenario | Expected Result | Priority |
|--------------|-----------|-------------|---------------|-----------------|----------|
| RESP-TOUCH-001 | All buttons | Tap | Tap instead of click | Responds to touch | P0 |
| RESP-TOUCH-002 | AAC symbols | Tap | Child tapping symbols | Registers tap, speaks | P0 |
| RESP-TOUCH-003 | Dropdowns | Tap | Opening dropdowns | Opens on tap, not hover | P0 |
| RESP-TOUCH-004 | Carousel | Swipe | Swipe to navigate | Responds to swipe gesture | P0 |
| RESP-TOUCH-005 | Maps | Pinch | Pinch to zoom | Zooms correctly | P1 |
| RESP-TOUCH-006 | Scroll areas | Scroll | Smooth scrolling | Momentum scroll works | P0 |
| RESP-TOUCH-007 | Sticky headers | Scroll | Header behavior | Stays visible, doesn't flicker | P0 |
| RESP-TOUCH-008 | Modal dialogs | Tap outside | Close modal | Closes on backdrop tap | P0 |
| RESP-TOUCH-009 | Drag games | Drag | Drag and drop | Works with touch | P0 |
| RESP-TOUCH-010 | Long press | Hold | Context menus | Triggers on long press | P1 |

### 8.11 Orientation Change Tests

| Test Case ID | Component | From | To | Expected Result | Priority |
|--------------|-----------|------|-----|-----------------|----------|
| RESP-ORIENT-001 | Dashboard | Portrait | Landscape | Layout adjusts | P0 |
| RESP-ORIENT-002 | AAC board | Portrait | Landscape | More columns visible | P0 |
| RESP-ORIENT-003 | Games | Portrait | Landscape | Game canvas resizes | P0 |
| RESP-ORIENT-004 | Messages | Portrait | Landscape | Split view if applicable | P0 |
| RESP-ORIENT-005 | Video content | Portrait | Landscape | Fullscreen option | P1 |
| RESP-ORIENT-006 | Navigation | Portrait | Landscape | Hamburger if needed | P0 |

### 8.12 Performance on Mobile Networks

| Test Case ID | Scenario | Network | Expected Load Time | Priority |
|--------------|----------|---------|-------------------|----------|
| RESP-PERF-001 | Landing page | 3G | < 5 seconds | P1 |
| RESP-PERF-002 | Dashboard | 3G | < 5 seconds | P1 |
| RESP-PERF-003 | AAC board | 3G | < 3 seconds | P0 |
| RESP-PERF-004 | Community | 3G | < 5 seconds | P1 |
| RESP-PERF-005 | Games | 3G | < 5 seconds | P1 |
| RESP-PERF-006 | Images | 3G | Lazy load, blur placeholder | P1 |
| RESP-PERF-007 | Large pages | 3G | Pagination, infinite scroll | P1 |

### 8.13 Accessibility on Mobile

| Test Case ID | Feature | Test | Expected | Priority |
|--------------|---------|------|----------|----------|
| RESP-A11Y-001 | Font size | 200% system font | Layout doesn't break | P0 |
| RESP-A11Y-002 | Screen reader | Navigate AAC board | Symbols announced | P0 |
| RESP-A11Y-003 | Screen reader | Navigate dashboard | All elements reachable | P0 |
| RESP-A11Y-004 | High contrast | Enable high contrast | Content visible | P1 |
| RESP-A11Y-005 | Reduced motion | Enable reduced motion | Animations disabled | P1 |
| RESP-A11Y-006 | Voice control | Voice commands | Buttons tappable via voice | P2 |

---

## 9. FILE-BY-FILE EXECUTION PLAN

### Phase 1: Critical Path (P0 Tests)
**Order must be followed. Stop on any failure.**

#### Week 1: Authentication & Core API
| Day | File(s) | Test Count | Dependencies |
|-----|---------|------------|--------------|
| 1 | `src/__tests__/integration/auth.test.ts` | 6 | None |
| 1 | `src/__tests__/integration/auth-forgot-password.test.ts` | 4 | auth.test.ts |
| 2 | `src/__tests__/integration/auth-verification.test.ts` | 3 | auth.test.ts |
| 2 | `src/__tests__/integration/database-connection.test.ts` | 2 | None |
| 3 | `src/__tests__/integration/health.test.ts` | 8 | database-connection.test.ts |
| 3 | `src/__tests__/integration/user.test.ts` | 8 | auth.test.ts |
| 4 | `src/__tests__/integration/posts.test.ts` | 15 | auth.test.ts, user.test.ts |
| 4 | `src/__tests__/integration/comments.test.ts` | 10 | posts.test.ts |
| 5 | `src/__tests__/integration/votes.test.ts` | 6 | posts.test.ts |
| 5 | `src/__tests__/integration/bookmarks.test.ts` | 5 | posts.test.ts |

#### Week 2: Features Integration
| Day | File(s) | Test Count | Dependencies |
|-----|---------|------------|--------------|
| 6 | `src/__tests__/integration/aac-api.test.ts` [NEW] | 12 | auth.test.ts |
| 6 | `src/__tests__/integration/therapy-log.test.ts` [NEW] | 10 | auth.test.ts |
| 7 | `src/__tests__/integration/messages.test.ts` [NEW] | 10 | auth.test.ts |
| 7 | `src/__tests__/integration/daily-wins.test.ts` [NEW] | 8 | auth.test.ts |
| 8 | `src/__tests__/integration/screening.test.ts` | 5 | None |
| 8 | `src/__tests__/integration/autism-navigator.test.ts` [NEW] | 8 | auth.test.ts |
| 9 | `src/__tests__/integration/providers.test.ts` | 6 | None |
| 9 | `src/__tests__/integration/resources.test.ts` | 5 | None |
| 10 | `src/__tests__/integration/ai-chat.test.ts` | 6 | auth.test.ts |
| 10 | `src/__tests__/integration/emergency-card.test.ts` [NEW] | 8 | auth.test.ts |

### Phase 2: Security Tests (P0-P1)
#### Week 3
| Day | File | Test Count |
|-----|------|------------|
| 11 | `src/__tests__/security/authentication.test.ts` [NEW] | 15 |
| 12 | `src/__tests__/security/xss-injection.test.ts` [NEW] | 15 |
| 13 | `src/__tests__/security/authorization.test.ts` [NEW] | 12 |
| 14 | `src/__tests__/security/data-protection.test.ts` [NEW] | 10 |
| 15 | `src/__tests__/security/abuse-prevention.test.ts` [NEW] | 10 |

### Phase 3: Responsive Tests (P0-P1)
#### Week 4
| Day | File | Test Count | Breakpoints |
|-----|------|------------|-------------|
| 16 | `src/__tests__/responsive/landing-page.test.ts` [NEW] | 20 | XS, SM, MD, LG |
| 17 | `src/__tests__/responsive/dashboard.test.ts` [NEW] | 20 | XS, SM, MD, LG |
| 18 | `src/__tests__/responsive/navigation.test.ts` [NEW] | 15 | XS, SM, LG |
| 19 | `src/__tests__/responsive/aac-board.test.ts` [NEW] | 20 | XS, SM, MD, LG |
| 20 | `src/__tests__/responsive/community.test.ts` [NEW] | 15 | XS, SM, LG |

### Phase 4: Component Unit Tests
#### Week 5
| Day | File(s) | Test Count |
|-----|---------|------------|
| 21 | `src/__tests__/unit/aac-components.test.ts` [NEW] | 15 |
| 22 | `src/__tests__/unit/form-validators.test.ts` | 10 |
| 23 | `src/__tests__/unit/screening-scoring.test.ts` | 5 |
| 24 | `src/__tests__/unit/encryption.test.ts` [NEW] | 8 |
| 25 | `src/__tests__/unit/mailer.test.ts` | 5 |

### Phase 5: E2E Flows
#### Week 6
| Day | Flow | Test Count |
|-----|------|------------|
| 26 | `src/__tests__/e2e/onboarding-flow.test.ts` [NEW] | 5 |
| 27 | `src/__tests__/e2e/complete-aac-usage.test.ts` [NEW] | 5 |
| 28 | `src/__tests__/e2e/therapy-session-workflow.test.ts` [NEW] | 5 |
| 29 | `src/__tests__/e2e/community-interaction.test.ts` [NEW] | 5 |
| 30 | `src/__tests__/e2e/messaging-workflow.test.ts` [NEW] | 5 |

### Phase 6: Python Backend Tests
#### Week 7
| Day | File | Test Count |
|-----|------|------------|
| 31 | `python_tasks/tests/test_api.py` | 10 |
| 32 | `python_tasks/tests/test_governance.py` | 8 |
| 33 | `python_tasks/tests/test_integrations.py` | 6 |
| 34 | `python_tasks/tests/test_quality.py` | 6 |
| 35 | `python_tasks/tests/test_tasks.py` | 6 |

---

## 10. FAILURE HANDLING STRATEGY

### 10.1 Failure Severity Levels

| Level | Definition | Response Time | Action |
|-------|------------|---------------|--------|
| CRITICAL | P0 test fails, security breach, data loss | Immediate | STOP all testing, alert team, fix before proceeding |
| HIGH | P1 test fails, core feature broken | 4 hours | Log issue, continue non-dependent tests, fix same day |
| MEDIUM | P2 test fails, minor feature issue | 24 hours | Log issue, continue testing, fix in next cycle |
| LOW | P3 test fails, cosmetic issue | 1 week | Log issue, continue, schedule fix |

### 10.2 Failure Protocol

```
ON TEST FAILURE:
1. RE-RUN failed test 3 times to confirm flakiness
2. IF consistently fails:
   a. Document: Test ID, error message, stack trace, environment
   b. Determine severity based on test priority
   c. Create bug ticket with:
      - Title: [TEST-FAIL] <Test Case ID>
      - Labels: severity, component, regression?
      - Steps to reproduce
      - Expected vs actual
      - Screenshots/logs
3. IF CRITICAL:
   a. STOP execution immediately
   b. Notify: QA Lead, Tech Lead, Product Owner
   c. Create P0 bug ticket
   d. Wait for fix before continuing
4. IF HIGH:
   a. Continue non-dependent tests
   b. Create P1 bug ticket
   c. Fix required before release
5. IF MEDIUM/LOW:
   a. Continue all testing
   b. Create ticket for backlog
6. AFTER FIX:
   a. Re-run failed test
   b. Verify pass
   c. Re-run dependent tests
   d. Resume execution plan
```

### 10.3 Flaky Test Handling

| Detection Method | Threshold | Action |
|------------------|-----------|--------|
| 3 runs, different results | 2/3 pass rate | Mark as flaky, quarantine |
| Environment-specific | Only fails on CI | Investigate env differences |
| Timing-related | Fails with load | Add waits, stabilize |
| Data-dependent | Fails with specific data | Fix test isolation |

### 10.4 Required Documentation on Failure

```markdown
## Bug Report Template

**Test Case ID:** 
**Severity:** [CRITICAL/HIGH/MEDIUM/LOW]
**Component:** 
**Environment:** [Browser/OS/Device]
**Date/Time:** 

### Steps to Reproduce
1. 
2. 
3. 

### Expected Result

### Actual Result

### Error Message
```

### Stack Trace
```
[paste stack trace]
```

### Screenshots/Videos
[attach]

### Additional Context
- Is this reproducible? 
- Does it happen on other environments?
- Is this a regression?
```

---

## 11. AUTOMATION PRIORITY RECOMMENDATION

### 11.1 Automation Pyramid

```
         /\
        /  \
       / E2E\           (25 tests - 10% of effort)
      /--------\
     /   API    \       (80 tests - 30% of effort)
    /------------\
   /  Integration \    (120 tests - 35% of effort)
  /----------------\
 /     Unit         \ (300 tests - 25% of effort)
/____________________\
```

### 11.2 Tools Recommendation

| Test Type | Primary Tool | Secondary | Reporting |
|-----------|--------------|-----------|-----------|
| Unit/Integration | Vitest | Jest | Vitest UI, CLI |
| API | Vitest + MSW | Postman | CLI, HTML |
| E2E | Playwright | Cypress | Playwright HTML |
| Visual/Responsive | Playwright + screenshots | Chromatic | Visual diff |
| Performance | Lighthouse CI | WebPageTest | JSON reports |
| Accessibility | axe-core | Lighthouse | CLI, HTML |
| Security | OWASP ZAP | Burp Suite | PDF reports |

### 11.3 CI/CD Integration

```yaml
# GitHub Actions Example
name: Comprehensive Test Suite

on: [push, pull_request]

jobs:
  test-matrix:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-suite: 
          - authentication  # P0
          - core-api        # P0
          - features        # P0
          - security        # P0
          - responsive      # P0
          - e2e-critical    # P0
    steps:
      - uses: actions/checkout@v3
      - name: Run ${{ matrix.test-suite }}
        run: npm run test:${{ matrix.test-suite }}
        continue-on-error: false  # NEVER continue on P0 failures
      
      - name: Upload Results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.test-suite }}
          path: test-results/
```

### 11.4 Recommended New Test Files to Create

Based on coverage gaps, create these files in priority order:

#### Priority 1 (This Sprint)
1. `src/__tests__/integration/aac-api.test.ts`
2. `src/__tests__/integration/therapy-log.test.ts`
3. `src/__tests__/integration/messages.test.ts`
4. `src/__tests__/integration/daily-wins.test.ts`
5. `src/__tests__/integration/emergency-card.test.ts`

#### Priority 2 (Next Sprint)
6. `src/__tests__/security/authentication.test.ts`
7. `src/__tests__/security/xss-injection.test.ts`
8. `src/__tests__/security/authorization.test.ts`
9. `src/__tests__/responsive/landing-page.test.ts`
10. `src/__tests__/responsive/dashboard.test.ts`

#### Priority 3 (Following Sprint)
11. `src/__tests__/responsive/aac-board.test.ts`
12. `src/__tests__/responsive/navigation.test.ts`
13. `src/__tests__/e2e/onboarding-flow.test.ts`
14. `src/__tests__/e2e/complete-aac-usage.test.ts`
15. `src/__tests__/e2e/therapy-session-workflow.test.ts`

### 11.5 Coverage Targets

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Line Coverage | ~15% | 80% | 3 months |
| Function Coverage | ~20% | 85% | 3 months |
| Branch Coverage | ~10% | 75% | 3 months |
| Statement Coverage | ~15% | 80% | 3 months |
| API Coverage | 25% | 95% | 2 months |
| Responsive Coverage | 0% | 100% | 1 month |
| Security Coverage | 5% | 100% | 2 months |

### 11.6 Success Criteria

The testing effort is considered successful when:

1. ✅ All P0 tests pass consistently
2. ✅ 90%+ of P1 tests pass
3. ✅ No critical security vulnerabilities
4. ✅ Application passes WCAG 2.1 AA accessibility
5. ✅ All breakpoints render correctly
6. ✅ Performance budgets met (Lighthouse 90+)
7. ✅ Zero flaky tests in critical path
8. ✅ Test execution time < 10 minutes for PR checks

---

## APPENDIX A: Test Environment Requirements

### Hardware
- iPhone SE (320px)
- iPhone 12/13/14 (390px)
- iPad Air (820px)
- MacBook Air (1280px)
- External monitor (1920px+)

### Software
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Edge (latest)
- iOS Safari
- Chrome Android

### Network Conditions
- 4G/LTE
- 3G (simulated)
- Offline (PWA tests)

---

## APPENDIX B: Test Data Requirements

### Users Needed
- Standard parent user
- Therapist user
- Admin user
- Moderator user
- Child account (if applicable)
- Banned user
- Unverified user

### Content Needed
- 100+ posts across categories
- 500+ comments
- 50+ therapy sessions
- 200+ AAC vocabulary items
- 20+ conversations with messages

---

**END OF COMPREHENSIVE QA TEST STRATEGY**

*This document must be reviewed and updated weekly during the testing phase.*
