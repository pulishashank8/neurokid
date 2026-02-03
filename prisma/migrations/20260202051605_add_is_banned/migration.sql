-- CreateEnum
CREATE TYPE "ConnectionRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "TherapyType" AS ENUM ('ABA', 'OCCUPATIONAL', 'SPEECH', 'BEHAVIORAL', 'PLAY', 'SOCIAL_SKILLS', 'PHYSICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LineageNodeType" AS ENUM ('SOURCE', 'PROCESS', 'STORE', 'REPORT');

-- CreateEnum
CREATE TYPE "DataQualityRuleType" AS ENUM ('NULL_CHECK', 'REGEX_MATCH', 'RANGE_CHECK', 'FOREIGN_KEY', 'ANOMALY_DETECTION', 'CUSTOM_SQL');

-- CreateEnum
CREATE TYPE "AACCategory" AS ENUM ('CORE', 'FOOD', 'SENSORY', 'EMERGENCY', 'SOCIAL', 'ACTIONS', 'CUSTOM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CONNECTION_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'CONNECTION_ACCEPTED';

-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "retentionPolicy" VARCHAR(100),
ADD COLUMN     "updateFrequency" VARCHAR(100);

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "images" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedReason" TEXT,
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserFinder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFinder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TherapySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childName" VARCHAR(100) NOT NULL,
    "therapistName" VARCHAR(100) NOT NULL,
    "therapyType" "TherapyType" NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,
    "wentWell" TEXT,
    "toWorkOn" TEXT,
    "mood" SMALLINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TherapySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childName" VARCHAR(100) NOT NULL,
    "childAge" INTEGER,
    "diagnosis" VARCHAR(255),
    "triggers" TEXT,
    "calmingStrategies" TEXT,
    "communication" TEXT,
    "medications" TEXT,
    "allergies" TEXT,
    "emergencyContact1Name" VARCHAR(100),
    "emergencyContact1Phone" VARCHAR(20),
    "emergencyContact2Name" VARCHAR(100),
    "emergencyContact2Phone" VARCHAR(20),
    "doctorName" VARCHAR(100),
    "doctorPhone" VARCHAR(20),
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipants" (
    "conversation_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipants_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateTable
CREATE TABLE "Messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID,
    "sender_id" TEXT,
    "content" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedUser" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "conversationId" TEXT,
    "reason" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageRateLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionRequests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sender_id" TEXT,
    "receiver_id" TEXT,
    "message" TEXT,
    "status" TEXT DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectionRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_a" TEXT,
    "user_b" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyWin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "content" TEXT NOT NULL,
    "mood" SMALLINT,
    "category" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyWin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreeningResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "screeningType" VARCHAR(50) NOT NULL,
    "score" INTEGER,
    "riskLevel" VARCHAR(20),
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScreeningResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" VARCHAR(500) NOT NULL,
    "searchType" VARCHAR(50) NOT NULL,
    "resultsCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataLineageNode" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "type" "LineageNodeType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataLineageNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataLineageEdge" (
    "id" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "transformationLogic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataLineageEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityRule" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "fieldName" VARCHAR(255),
    "ruleType" "DataQualityRuleType" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataQualityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityResult" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsChecked" INTEGER NOT NULL DEFAULT 0,
    "failuresFound" INTEGER NOT NULL DEFAULT 0,
    "anomalyScore" DOUBLE PRECISION,
    "failureSample" JSONB,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionDurationMs" INTEGER,

    CONSTRAINT "DataQualityResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobExecution" (
    "id" TEXT NOT NULL,
    "jobName" VARCHAR(255) NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorLog" TEXT,
    "metadata" JSONB,

    CONSTRAINT "JobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" VARCHAR(100) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "hasGranted" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensitiveAccessLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "datasetName" VARCHAR(255) NOT NULL,
    "actionType" TEXT NOT NULL,
    "recordCount" INTEGER,
    "filterCriteria" JSONB,
    "reason" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensitiveAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AACVocabulary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(255) NOT NULL,
    "category" "AACCategory" NOT NULL DEFAULT 'CUSTOM',
    "audioText" VARCHAR(255),
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AACVocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFinder_userId_key" ON "UserFinder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFinder_username_key" ON "UserFinder"("username");

-- CreateIndex
CREATE INDEX "UserFinder_keywords_idx" ON "UserFinder"("keywords");

-- CreateIndex
CREATE INDEX "TherapySession_userId_idx" ON "TherapySession"("userId");

-- CreateIndex
CREATE INDEX "TherapySession_sessionDate_idx" ON "TherapySession"("sessionDate");

-- CreateIndex
CREATE INDEX "TherapySession_therapyType_idx" ON "TherapySession"("therapyType");

-- CreateIndex
CREATE INDEX "TherapySession_createdAt_idx" ON "TherapySession"("createdAt");

-- CreateIndex
CREATE INDEX "EmergencyCard_userId_idx" ON "EmergencyCard"("userId");

-- CreateIndex
CREATE INDEX "EmergencyCard_createdAt_idx" ON "EmergencyCard"("createdAt");

-- CreateIndex
CREATE INDEX "idx_conversation_participants_user_id" ON "ConversationParticipants"("user_id");

-- CreateIndex
CREATE INDEX "idx_messages_conversation_id" ON "Messages"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_messages_created_at" ON "Messages"("created_at");

-- CreateIndex
CREATE INDEX "idx_messages_sender_id" ON "Messages"("sender_id");

-- CreateIndex
CREATE INDEX "BlockedUser_blockerId_idx" ON "BlockedUser"("blockerId");

-- CreateIndex
CREATE INDEX "BlockedUser_blockedId_idx" ON "BlockedUser"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedUser_blockerId_blockedId_key" ON "BlockedUser"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "MessageReport_reporterId_idx" ON "MessageReport"("reporterId");

-- CreateIndex
CREATE INDEX "MessageReport_reportedUserId_idx" ON "MessageReport"("reportedUserId");

-- CreateIndex
CREATE INDEX "MessageReport_status_idx" ON "MessageReport"("status");

-- CreateIndex
CREATE INDEX "MessageReport_createdAt_idx" ON "MessageReport"("createdAt");

-- CreateIndex
CREATE INDEX "MessageRateLimit_userId_idx" ON "MessageRateLimit"("userId");

-- CreateIndex
CREATE INDEX "MessageRateLimit_actionType_idx" ON "MessageRateLimit"("actionType");

-- CreateIndex
CREATE INDEX "MessageRateLimit_createdAt_idx" ON "MessageRateLimit"("createdAt");

-- CreateIndex
CREATE INDEX "idx_connection_requests_receiver_id" ON "ConnectionRequests"("receiver_id");

-- CreateIndex
CREATE INDEX "idx_connection_requests_status" ON "ConnectionRequests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionRequests_sender_id_receiver_id_key" ON "ConnectionRequests"("sender_id", "receiver_id");

-- CreateIndex
CREATE INDEX "idx_connections_user_a" ON "Connections"("user_a");

-- CreateIndex
CREATE INDEX "idx_connections_user_b" ON "Connections"("user_b");

-- CreateIndex
CREATE UNIQUE INDEX "Connections_user_a_user_b_key" ON "Connections"("user_a", "user_b");

-- CreateIndex
CREATE INDEX "DailyWin_userId_idx" ON "DailyWin"("userId");

-- CreateIndex
CREATE INDEX "DailyWin_date_idx" ON "DailyWin"("date");

-- CreateIndex
CREATE INDEX "DailyWin_createdAt_idx" ON "DailyWin"("createdAt");

-- CreateIndex
CREATE INDEX "OwnerNote_userId_idx" ON "OwnerNote"("userId");

-- CreateIndex
CREATE INDEX "OwnerNote_createdAt_idx" ON "OwnerNote"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON "UserSession"("sessionToken");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_lastActiveAt_idx" ON "UserSession"("lastActiveAt");

-- CreateIndex
CREATE INDEX "UserSession_createdAt_idx" ON "UserSession"("createdAt");

-- CreateIndex
CREATE INDEX "ScreeningResult_userId_idx" ON "ScreeningResult"("userId");

-- CreateIndex
CREATE INDEX "ScreeningResult_screeningType_idx" ON "ScreeningResult"("screeningType");

-- CreateIndex
CREATE INDEX "ScreeningResult_riskLevel_idx" ON "ScreeningResult"("riskLevel");

-- CreateIndex
CREATE INDEX "ScreeningResult_completedAt_idx" ON "ScreeningResult"("completedAt");

-- CreateIndex
CREATE INDEX "SearchQuery_userId_idx" ON "SearchQuery"("userId");

-- CreateIndex
CREATE INDEX "SearchQuery_searchType_idx" ON "SearchQuery"("searchType");

-- CreateIndex
CREATE INDEX "SearchQuery_query_idx" ON "SearchQuery"("query");

-- CreateIndex
CREATE INDEX "SearchQuery_createdAt_idx" ON "SearchQuery"("createdAt");

-- CreateIndex
CREATE INDEX "DataLineageNode_datasetId_idx" ON "DataLineageNode"("datasetId");

-- CreateIndex
CREATE INDEX "DataLineageNode_type_idx" ON "DataLineageNode"("type");

-- CreateIndex
CREATE INDEX "DataLineageEdge_sourceNodeId_idx" ON "DataLineageEdge"("sourceNodeId");

-- CreateIndex
CREATE INDEX "DataLineageEdge_targetNodeId_idx" ON "DataLineageEdge"("targetNodeId");

-- CreateIndex
CREATE INDEX "DataQualityRule_datasetId_idx" ON "DataQualityRule"("datasetId");

-- CreateIndex
CREATE INDEX "DataQualityRule_ruleType_idx" ON "DataQualityRule"("ruleType");

-- CreateIndex
CREATE INDEX "DataQualityResult_ruleId_idx" ON "DataQualityResult"("ruleId");

-- CreateIndex
CREATE INDEX "DataQualityResult_status_idx" ON "DataQualityResult"("status");

-- CreateIndex
CREATE INDEX "DataQualityResult_runDate_idx" ON "DataQualityResult"("runDate");

-- CreateIndex
CREATE INDEX "JobExecution_jobName_idx" ON "JobExecution"("jobName");

-- CreateIndex
CREATE INDEX "JobExecution_status_idx" ON "JobExecution"("status");

-- CreateIndex
CREATE INDEX "JobExecution_startedAt_idx" ON "JobExecution"("startedAt");

-- CreateIndex
CREATE INDEX "UserConsent_userId_idx" ON "UserConsent"("userId");

-- CreateIndex
CREATE INDEX "UserConsent_consentType_idx" ON "UserConsent"("consentType");

-- CreateIndex
CREATE INDEX "UserConsent_hasGranted_idx" ON "UserConsent"("hasGranted");

-- CreateIndex
CREATE INDEX "SensitiveAccessLog_adminUserId_idx" ON "SensitiveAccessLog"("adminUserId");

-- CreateIndex
CREATE INDEX "SensitiveAccessLog_datasetName_idx" ON "SensitiveAccessLog"("datasetName");

-- CreateIndex
CREATE INDEX "SensitiveAccessLog_accessedAt_idx" ON "SensitiveAccessLog"("accessedAt");

-- CreateIndex
CREATE INDEX "AACVocabulary_userId_idx" ON "AACVocabulary"("userId");

-- CreateIndex
CREATE INDEX "AACVocabulary_category_idx" ON "AACVocabulary"("category");

-- CreateIndex
CREATE INDEX "AACVocabulary_order_idx" ON "AACVocabulary"("order");

-- CreateIndex
CREATE INDEX "AACVocabulary_isActive_idx" ON "AACVocabulary"("isActive");

-- CreateIndex
CREATE INDEX "idx_email_verification_user_id" ON "EmailVerification"("userId");

-- CreateIndex
CREATE INDEX "idx_provider_claimed_by_user_id" ON "Provider"("claimedByUserId");

-- AddForeignKey
ALTER TABLE "UserFinder" ADD CONSTRAINT "UserFinder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipants" ADD CONSTRAINT "ConversationParticipants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConversationParticipants" ADD CONSTRAINT "ConversationParticipants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRateLimit" ADD CONSTRAINT "MessageRateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionRequests" ADD CONSTRAINT "ConnectionRequests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConnectionRequests" ADD CONSTRAINT "ConnectionRequests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Connections" ADD CONSTRAINT "Connections_user_a_fkey" FOREIGN KEY ("user_a") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Connections" ADD CONSTRAINT "Connections_user_b_fkey" FOREIGN KEY ("user_b") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DailyWin" ADD CONSTRAINT "DailyWin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerNote" ADD CONSTRAINT "OwnerNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResult" ADD CONSTRAINT "ScreeningResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchQuery" ADD CONSTRAINT "SearchQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataLineageNode" ADD CONSTRAINT "DataLineageNode_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataLineageEdge" ADD CONSTRAINT "DataLineageEdge_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "DataLineageNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataLineageEdge" ADD CONSTRAINT "DataLineageEdge_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "DataLineageNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityRule" ADD CONSTRAINT "DataQualityRule_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityResult" ADD CONSTRAINT "DataQualityResult_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "DataQualityRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensitiveAccessLog" ADD CONSTRAINT "SensitiveAccessLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AACVocabulary" ADD CONSTRAINT "AACVocabulary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
