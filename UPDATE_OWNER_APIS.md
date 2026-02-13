# 🔄 Updating Owner API Routes to Use RBAC

## Overview

All owner API routes need to be updated from the old `isAdminAuthenticated()` system to the new RBAC-based `withOwnerAuth()` wrapper.

## Before & After

### ❌ OLD WAY (Insecure)
```typescript
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Your code here
  return NextResponse.json({ data });
}
```

### ✅ NEW WAY (Secure + Audited)
```typescript
import { withOwnerAuth } from '@/lib/owner/rbac-check';

export const GET = withOwnerAuth(
  async (request, { ownerId }) => {
    // Your code here - ownerId is the authenticated owner
    return NextResponse.json({ data });
  },
  'VIEW_DASHBOARD' // Audit action
);
```

## Step-by-Step Migration

### Step 1: Update Imports

**Remove:**
```typescript
import { isAdminAuthenticated } from '@/lib/admin-auth';
```

**Add:**
```typescript
import { withOwnerAuth } from '@/lib/owner/rbac-check';
```

### Step 2: Wrap Handler Function

**Old:**
```typescript
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // handler code...
}
```

**New:**
```typescript
export const GET = withOwnerAuth(
  async (request, { ownerId }) => {
    // handler code - auth check is automatic
  },
  'AUDIT_ACTION_NAME'
);
```

### Step 3: Choose the Right Audit Action

Pick from these audit actions based on what the endpoint does:

#### Authentication
- `OWNER_LOGIN`, `OWNER_LOGOUT`, `OWNER_LOGIN_FAILED`

#### User Management
- `VIEW_USER` - Viewing a single user's details
- `VIEW_USERS_LIST` - Viewing users list
- `BAN_USER` - Banning a user
- `UNBAN_USER` - Unbanning a user
- `WARN_USER` - Warning a user
- `DELETE_USER` - Deleting a user
- `EXPORT_USER_DATA` - Exporting user data (GDPR)
- `ADD_USER_NOTE` - Adding notes about a user

#### Content Moderation
- `MODERATE_POST` - Moderating a post
- `DELETE_POST` - Deleting a post
- `MODERATE_COMMENT` - Moderating a comment
- `DELETE_COMMENT` - Deleting a comment

#### Data Access
- `VIEW_PHI_DATA` - Viewing protected health information
- `EXPORT_PHI_DATA` - Exporting PHI data
- `VIEW_THERAPY_NOTES` - Viewing therapy notes
- `VIEW_EMERGENCY_CARDS` - Viewing emergency cards

#### System Operations
- `VIEW_DASHBOARD` - Viewing dashboard/stats
- `VIEW_ANALYTICS` - Viewing analytics
- `RUN_AI_AGENT` - Running AI agents
- `TRIGGER_BACKUP` - Triggering backups
- `MODIFY_SETTINGS` - Modifying settings
- `SEND_ANNOUNCEMENT` - Sending announcements

#### Data Governance
- `VIEW_AUDIT_LOGS` - Viewing audit logs
- `EXPORT_AUDIT_LOGS` - Exporting audit logs
- `VIEW_DATA_QUALITY` - Viewing data quality reports
- `VIEW_GOVERNANCE_REPORT` - Viewing governance reports

### Step 4: Add Resource Identifier (Optional but Recommended)

For actions on specific resources, add a resource identifier:

```typescript
export const GET = withOwnerAuth(
  async (request, { ownerId, params }) => {
    const userId = params?.id;
    // handler code...
  },
  'BAN_USER',
  {
    getResource: (request, params) => `user:${params?.id}`
  }
);
```

## Example Migrations

### Example 1: Simple Stats Endpoint

**Before:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const stats = await getStats();
  return NextResponse.json({ stats });
}
```

**After:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withOwnerAuth } from '@/lib/owner/rbac-check';

export const GET = withOwnerAuth(
  async (request, { ownerId }) => {
    const stats = await getStats();
    return NextResponse.json({ stats });
  },
  'VIEW_ANALYTICS'
);
```

### Example 2: User Ban Endpoint

**Before:**
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = params.id;
  await banUser(userId);
  return NextResponse.json({ success: true });
}
```

**After:**
```typescript
export const POST = withOwnerAuth(
  async (request, { ownerId, params }) => {
    const userId = params?.id;
    await banUser(userId);
    return NextResponse.json({ success: true });
  },
  'BAN_USER',
  {
    getResource: (request, params) => `user:${params?.id}`
  }
);
```

### Example 3: Data Export Endpoint

**Before:**
```typescript
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const data = await exportAllData();
  return NextResponse.json({ data });
}
```

**After:**
```typescript
export const GET = withOwnerAuth(
  async (request, { ownerId }) => {
    const data = await exportAllData();
    return NextResponse.json({ data });
  },
  'EXPORT_PHI_DATA' // Use appropriate audit action
);
```

## Bulk Update Script

For updating many files at once, use this Node.js script:

```javascript
// scripts/update-owner-routes.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('src/app/api/owner/**/route.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Skip if already updated
  if (content.includes('withOwnerAuth')) {
    console.log(`✅ Already updated: ${file}`);
    return;
  }
  
  // Replace import
  content = content.replace(
    /import { isAdminAuthenticated } from '@\/lib\/admin-auth';/g,
    "import { withOwnerAuth } from '@/lib/owner/rbac-check';"
  );
  
  // Note: Manual review needed for handler wrapping
  console.log(`⚠️  Needs manual review: ${file}`);
});
```

## Files to Update

Run this command to find all owner API routes:

```bash
find src/app/api/owner -name "route.ts" -type f
```

Or on Windows PowerShell:

```powershell
Get-ChildItem -Path "src\app\api\owner" -Filter "route.ts" -Recurse | Select-Object FullName
```

## Testing After Update

1. **Test authentication:**
   ```bash
   # Should return 401
   curl http://localhost:5000/api/owner/stats
   ```

2. **Test with valid owner:**
   - Login as owner at `/owner/login`
   - Navigate to dashboard
   - Check that all features work

3. **Check audit logs:**
   ```bash
   # View audit logs in Prisma Studio
   npx prisma studio
   # Navigate to OwnerAuditLog table
   ```

## Checklist

- [ ] Updated all imports from `admin-auth` to `rbac-check`
- [ ] Wrapped all handlers with `withOwnerAuth`
- [ ] Added appropriate audit actions
- [ ] Added resource identifiers where applicable
- [ ] Removed old authentication checks
- [ ] Tested all endpoints
- [ ] Verified audit logs are being created
- [ ] Updated any client-side code that calls these APIs

## Need Help?

Check these files for reference implementations:
- ✅ `/api/owner/stats/route.ts` - Already updated
- 📝 `src/lib/owner/rbac-check.ts` - Helper function
- 📝 `src/lib/owner/audit-logger.ts` - Audit actions list
