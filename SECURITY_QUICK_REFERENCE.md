# 🛡️ Security Quick Reference

## Rate Limits by Endpoint

### Authentication
| Endpoint | Method | Limit | Identifier |
|----------|--------|-------|------------|
| `/api/auth/register` | POST | 5/hour | IP |
| `/api/auth/[...nextauth]` | POST | 10/min | IP |

### Posts
| Endpoint | Method | Limit | Identifier |
|----------|--------|-------|------------|
| `/api/posts` | GET | 100/min | IP |
| `/api/posts` | POST | 5/min | User ID |
| `/api/posts/[id]` | GET | 200/min | IP |
| `/api/posts/[id]` | PATCH | 10/min | User ID |
| `/api/posts/[id]` | DELETE | 10/min | User ID |
| `/api/posts/[id]/comments` | GET | 100/min | IP |
| `/api/posts/[id]/comments` | POST | 10/min | User ID |

### Comments
| Endpoint | Method | Limit | Identifier |
|----------|--------|-------|------------|
| `/api/comments/[id]` | PATCH | 10/min | User ID |
| `/api/comments/[id]` | DELETE | 10/min | User ID |

### Engagement
| Endpoint | Method | Limit | Identifier |
|----------|--------|-------|------------|
| `/api/votes` | POST | 60/min | User ID |
| `/api/reports` | POST | 5/min | User ID |
| `/api/bookmarks` | POST | 30/min | User ID |

### User Management
| Endpoint | Method | Limit | Identifier |
|----------|--------|-------|------------|
| `/api/user/profile` | PUT | 10/min | User ID |
| `/api/user/change-password` | POST | 3/hour | User ID |
| `/api/user/delete-account` | DELETE | 1/hour | User ID |

### AI
| Endpoint | Method | Limit | Identifier |
|----------|--------|-------|------------|
| `/api/ai/chat` | POST | 5/min | User ID |

---

## Input Validation Rules

### UUIDs
```typescript
// All IDs must match this pattern:
/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
```

### Strings
- Always trimmed (`.trim()`)
- Length limits enforced
- Username: `/^[a-zA-Z0-9_-]+$/`

### Schemas
- All use `.strict()` - **rejects unexpected fields**
- Type checking with Zod
- Required fields enforced

---

## Environment Variables

### Required (Server-Only)
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="min-32-chars"  # openssl rand -base64 32
NEXTAUTH_URL="https://yourdomain.com"
```

### Optional (Server-Only)
```bash
REDIS_URL="redis://..."              # Rate limiting persistence
GROQ_API_KEY="gsk_..."              # AI chat (FREE tier)
GOOGLE_PLACES_API_KEY="AIza..."     # Provider search
GOOGLE_CLIENT_ID="..."               # OAuth
GOOGLE_CLIENT_SECRET="..."           # OAuth
```

### Public (Client-Safe)
```bash
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_FORMSPREE_ENDPOINT="https://formspree.io/f/..."
```

---

## Common HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (username, etc.) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |
| 503 | Service Unavailable | Service temporarily down |

---

## Testing Commands

### Rate Limiting
```bash
# Test rate limit on registration
for i in {1..10}; do curl -X POST http://localhost:3000/api/auth/register; done

# Should return 429 after 5 requests
```

### Input Validation
```bash
# Test UUID validation
curl http://localhost:3000/api/posts/invalid-uuid
# Returns: 400 "Invalid ID format"

# Test strict schema
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","malicious":"field"}'
# Returns: 400 "Unexpected field"
```

### Security
```bash
# Verify no API keys in client bundle
grep -r "GROQ_API_KEY" .next/static/
# Should return nothing

# Test SQL injection protection
curl "http://localhost:3000/api/posts/'; DROP TABLE posts;--"
# Returns: 400 "Invalid ID format"
```

---

## Validation Schema Examples

### Create Post
```typescript
{
  title: string (5-200 chars, trimmed),
  content: string (10-50000 chars),
  categoryId: UUID,
  tagIds: UUID[] (max 5),
  isAnonymous: boolean (optional)
}
// No other fields allowed!
```

### Update Profile
```typescript
{
  username: string (3-30 chars, alphanumeric + _-),
  displayName: string (1-50 chars),
  bio: string (max 500 chars),
  avatarUrl: URL (max 500 chars)
}
// All fields optional, no other fields allowed!
```

### Create Comment
```typescript
{
  content: string (1-10000 chars, trimmed),
  postId: UUID,
  parentCommentId: UUID (optional),
  isAnonymous: boolean (optional)
}
// No other fields allowed!
```

---

## Security Features at a Glance

### ✅ Rate Limiting
- 17 different rate limiters
- IP-based for public endpoints
- User-based for authenticated actions
- Graceful 429 responses with Retry-After

### ✅ Input Validation
- Strict schemas (`.strict()`)
- UUID format validation
- String trimming
- Length limits
- Type checking

### ✅ API Key Security
- Environment variables only
- No hardcoded secrets
- Client exposure prevention
- Startup validation
- Graceful degradation

### ✅ Authentication & Authorization
- Session-based auth (NextAuth)
- RBAC for moderation
- Ownership validation
- Anonymous posting support

### ✅ Content Security
- XSS prevention (safe links)
- SQL injection prevention (Prisma ORM)
- CSRF protection (NextAuth)
- Content sanitization

### ✅ Monitoring & Logging
- Request IDs
- Structured logging
- Performance metrics
- Audit trail

---

## Emergency Contacts

### If Rate Limit Too Strict
1. Check logs for legitimate user patterns
2. Adjust limit in `src/lib/rateLimit.ts`
3. Deploy changes
4. Monitor for abuse

### If API Keys Compromised
1. Rotate keys immediately in environment
2. Restart application
3. Check logs for unauthorized access
4. Update documentation

### If Security Issue Found
1. Document the issue
2. Check `SECURITY_HARDENING.md` for guidance
3. Implement fix
4. Test thoroughly
5. Deploy urgently if critical

---

## Quick Checks

### Before Deployment
- [ ] All env vars set in production
- [ ] No secrets in client bundle (`grep -r "API_KEY" .next/static/`)
- [ ] Rate limits tested
- [ ] Build successful (`npm run build`)
- [ ] Tests passing

### After Deployment
- [ ] Monitor rate limit hits
- [ ] Check error logs
- [ ] Verify API keys working
- [ ] Test authentication flow
- [ ] Check performance metrics

---

## Support

- **Full Documentation**: `SECURITY_HARDENING.md`
- **Implementation Checklist**: `SECURITY_CHECKLIST.md`
- **Summary**: `SECURITY_SUMMARY.md`
- **This Quick Reference**: `SECURITY_QUICK_REFERENCE.md`

---

**Last Updated**: 2026-01-21
**Version**: 1.0.0
