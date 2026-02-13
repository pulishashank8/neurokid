-- CreateTable
CREATE TABLE "CoFounderReport" (
    "id" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "reportData" JSONB NOT NULL,
    "attachmentUrls" TEXT[],
    "agentSessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoFounderReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoFounderReport_sentAt_idx" ON "CoFounderReport"("sentAt");

-- CreateIndex
CREATE INDEX "CoFounderReport_recipientEmail_idx" ON "CoFounderReport"("recipientEmail");
