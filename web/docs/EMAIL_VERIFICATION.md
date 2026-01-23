# Email Verification Implementation

## Overview
Email verification logic prevents fake signups ensuring only valid email owners can access the platform (except Google Login users who are auto-verified).
Feature implemented using tokens (SHA256 hashed) sent via Resend API.

## Environment Variables
Ensure these are set in `.env` (local) and Vercel Project Settings (Production).

```bash
# App URL (used for verification links)
NEXT_PUBLIC_APP_URL="https://www.neurokid.help" # or http://localhost:3000 locally

# Resend API Key
RESEND_API_KEY="re_..."

# Email Sender
EMAIL_FROM="onboarding@resend.dev" # or your verified domain
```

## Workflows

### Registration
1. User signs up via `/register`.
2. System creates `User` (unverified) and specific `EmailVerificationToken`.
3. Email sent with link to `/verify-email?token=...`.
4. User sees "Check your email" prompt.

### Verification
1. User clicks link.
2. `/verify-email` page makes API call to `/api/auth/verify-email`.
3. API validates token, activates user, deletes token.
4. User redirected to `/login` with success message.

### Login
- **Credentials**: Blocked if `emailVerified: false`. Detailed error shown with Resend button.
- **Google**: Allowed immediately. User marked verified upon creation.

## Testing

### Manual QA Checklist
- [ ] Sign up with new email -> receive email?
- [ ] Click link -> see success on frontend? -> redirect to login?
- [ ] Login immediately (before verify) -> blocked?
- [ ] Resend button -> receive new email? -> verifying behaves correctly?
- [ ] Google Login -> works immediately?
- [ ] Dark mode -> UI looks good?

### Running Tests
Unit and Integration tests are included.

```bash
# Run all tests
npm test

# Run verification tests only
npm test -- auth-verification

# Run unit tests
npm test -- unit
```

## Rate Limiting
- **Resend Verification**: 1 request per minute, 10 per day per email.

## Database Schema
A new model `EmailVerificationToken` handles the secure tokens (hashed).
`User` model uses standard `emailVerified` (boolean) and `emailVerifiedAt` (status).
