# Data Governance & Security Documentation

## Data Classification

### Public Data
- Forum posts (public visibility)
- User profiles (username, displayName, bio)
- Provider directory listings
- Resource library content

### Account Data
- Email addresses
- Authentication credentials (hashed)
- Role assignments
- Account settings

### Sensitive User-Generated Content
- Private messages (end-to-end user communication)
- Screening results (health-adjacent data)
- Reports and moderation flags
- Audit logs

## Access Control Matrix

| Data Type | User | Moderator | Admin | Owner |
|-----------|------|-----------|-------|-------|
| Own Profile | RW | RW | RW | RW |
| Other Profiles (public) | R | R | R | R |
| Own Posts | RWD | RWD | RWD | R |
| All Posts | R | RW (moderate) | RWD | R |
| Own Messages | RW | R (reported only) | R | R |
| Other Messages | - | R (reported) | R | R |
| Own Screening | RW | - | R | R |
| All Screening | - | - | R | R |
| Audit Logs | - | - | R | RW |
| User Management | - | - | RW | RW |

Legend: R=Read, W=Write, D=Delete, -=No Access

## Security Measures

### Authentication
- Password hashing with bcrypt (cost factor 10)
- JWT-based session tokens (30-day expiry)
- Rate limiting on login attempts (10/min per email)
- Email verification required in production

### Authorization
- Role-based access control (PARENT, THERAPIST, MODERATOR, ADMIN)
- Resource ownership verification for all mutations
- IDOR protection on all API endpoints

### Input Validation
- Zod schema validation on all API inputs
- XSS sanitization for user-generated content
- SQL injection prevention via Prisma ORM

### Security Headers
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Referrer-Policy

## Data Retention Policy

### Active Data
- User accounts: Retained until deletion request
- Posts/Comments: Retained until deleted by user or moderated
- Messages: Retained until conversation deleted

### Archived Data
- Deleted posts: Anonymized after 30 days
- Audit logs: Retained for 1 year, then purged
- Rate limit data: Automatically expires

### Backup & Recovery
- Daily database backups via Supabase
- Point-in-time recovery available
- Rollback capability via Replit checkpoints

## User Rights (GDPR/CCPA Compliance)

### Data Export
Users can request a complete export of their data including:
- Account information
- Posts and comments
- Messages
- Votes and bookmarks

### Data Deletion
Users can request:
- Anonymization: Content replaced with "[removed]", account retained
- Complete deletion: All data permanently removed

### Data Portability
Export format: JSON
Delivery: Direct download or email

## Audit Logging

### Logged Events
- Authentication (success/failure)
- Password changes
- Role modifications
- Moderation actions
- Data exports/deletions
- Admin actions

### Log Retention
- Security events: 1 year
- General audit logs: 90 days
- Error logs: 30 days

## Incident Response

### Security Incident Procedure
1. Detect via monitoring/alerts
2. Contain: Disable affected accounts/features
3. Investigate: Review audit logs
4. Remediate: Apply fixes
5. Notify: Inform affected users if required
6. Document: Post-incident report

### Contact
Security issues: security@neurokid.help (to be configured)
