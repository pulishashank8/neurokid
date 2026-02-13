-- AlterTable
ALTER TABLE "AIUsageLog" ADD COLUMN "aiJobId" TEXT;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "AIUsageLog_aiJobId_key" ON "AIUsageLog"("aiJobId");
