-- AlterTable
ALTER TABLE "AIConversation" ADD COLUMN IF NOT EXISTS "type" VARCHAR(20) NOT NULL DEFAULT 'support';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AIConversation_userId_type_idx" ON "AIConversation"("userId", "type");
