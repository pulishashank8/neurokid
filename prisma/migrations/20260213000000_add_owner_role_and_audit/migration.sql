-- Add OWNER role to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OWNER';

-- Update OwnerAuditLog table with enhanced security fields
ALTER TABLE "OwnerAuditLog" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "OwnerAuditLog" ADD COLUMN IF NOT EXISTS "resource" TEXT;
ALTER TABLE "OwnerAuditLog" ADD COLUMN IF NOT EXISTS "success" BOOLEAN NOT NULL DEFAULT true;

-- Update action column comment for clarity
COMMENT ON COLUMN "OwnerAuditLog"."action" IS 'Action type, e.g., LOGIN, EXPORT_DATA, BAN_USER, VIEW_PHI';
COMMENT ON COLUMN "OwnerAuditLog"."resource" IS 'Resource identifier, e.g., user:123, report:export';
COMMENT ON COLUMN "OwnerAuditLog"."userId" IS 'Owner user ID who performed the action';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "OwnerAuditLog_userId_createdAt_idx" ON "OwnerAuditLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "OwnerAuditLog_resource_idx" ON "OwnerAuditLog"("resource");

-- Drop old index if it exists (will be recreated with new schema)
DROP INDEX IF EXISTS "OwnerAuditLog_action_createdAt_idx";

-- Recreate action index
CREATE INDEX IF NOT EXISTS "OwnerAuditLog_action_createdAt_idx" ON "OwnerAuditLog"("action", "createdAt");

-- Add MFA fields to User table for Two-Factor Authentication
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mfaSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mfaBackupCodes" TEXT[];

-- Update comments for MFA columns
COMMENT ON COLUMN "User"."mfaEnabled" IS 'Whether two-factor authentication is enabled';
COMMENT ON COLUMN "User"."mfaSecret" IS 'Encrypted TOTP secret for MFA';
COMMENT ON COLUMN "User"."mfaBackupCodes" IS 'Hashed backup codes for MFA recovery';
