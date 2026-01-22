# Test Fix Progress - January 21, 2026

## Issue: Duplicate Key Violations

**Problem:** Tests creating categories/tags with same names as seeded data  
**Solution:** Use `getSeededCategory()` and `getSeededTag()` helper functions

## Files Fixed:

### ✅ COMPLETE
1. **auth.test.ts** - 7/7 tests passing
   - Added confirmPassword field
   - Fixed status codes (409 for conflicts)

2. **posts.test.ts** - 13/19 tests passing
   - Using getSeededCategory()
   - Some tests still need fixes

### ⏳ IN PROGRESS

Need to update these files to use getSeeded helpers:

3. **comments.test.ts**
4. **votes.test.ts**
5. **bookmarks.test.ts**  
6. **categories.test.ts**
7. **tags.test.ts**
8. **reports.test.ts**
9. **moderation.test.ts**
10. **providers.test.ts**
11. **resources.test.ts**
12. **user.test.ts**
13. **ai-chat.test.ts**
14. **health.test.ts**
15. **e2e-full-project.test.ts**
16. **database-connection.test.ts**

## Fix Pattern:

### Before:
```typescript
testCategory = await createTestCategory('General Discussion', 'general-discussion');
```

### After:
```typescript
testCategory = await getSeededCategory('general-discussion');
```

## Time Estimate:
- 15 files × 2-5 minutes each = 30-75 minutes to fix all manually
- OR: Create automated fix script = 10-15 minutes

## Recommendation:
Let me create a bulk-fix script to update all files at once.
