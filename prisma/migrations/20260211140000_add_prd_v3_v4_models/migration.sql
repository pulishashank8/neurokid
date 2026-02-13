-- Add missing fields to User model
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannedUntil" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- CreateTable: AIAgentInsight (Pillar 8)
CREATE TABLE IF NOT EXISTS "AIAgentInsight" (
    "id" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT,
    "metrics" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAgentInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AutomationRule (Pillar 9)
CREATE TABLE IF NOT EXISTS "AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerEvent" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AutomationAction (Pillar 9)
CREATE TABLE IF NOT EXISTS "AutomationAction" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetPostId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ClientError (Pillar 10)
CREATE TABLE IF NOT EXISTS "ClientError" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "errorType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stackTrace" TEXT,
    "pagePath" TEXT NOT NULL,
    "pageTitle" TEXT,
    "elementId" TEXT,
    "deviceType" VARCHAR(30),
    "userAgent" TEXT,
    "metadata" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientError_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BusinessMetric (Pillar 11)
CREATE TABLE IF NOT EXISTS "BusinessMetric" (
    "id" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PlatformCost (Pillar 11)
CREATE TABLE IF NOT EXISTS "PlatformCost" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "month" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isAutoTracked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PageView (Pillar 13)
CREATE TABLE IF NOT EXISTS "PageView" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "pagePath" TEXT NOT NULL,
    "pageTitle" TEXT,
    "duration" INTEGER NOT NULL,
    "scrollDepth" INTEGER,
    "deviceType" VARCHAR(20),
    "enteredAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ClickEvent (Pillar 13)
CREATE TABLE IF NOT EXISTS "ClickEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "pagePath" TEXT NOT NULL,
    "elementId" TEXT,
    "elementType" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClickEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OwnerEmail (Pillar 6)
CREATE TABLE IF NOT EXISTS "OwnerEmail" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "templateId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OwnerEmailRecipient (Pillar 6)
CREATE TABLE IF NOT EXISTS "OwnerEmailRecipient" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "OwnerEmailRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OwnerAuditLog (Pillar 7)
CREATE TABLE IF NOT EXISTS "OwnerAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EmailTemplate (Pillar 6)
CREATE TABLE IF NOT EXISTS "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OwnerTodo (Pillar 1)
CREATE TABLE IF NOT EXISTS "OwnerTodo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerTodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DashboardLayout (Pillar 17)
CREATE TABLE IF NOT EXISTS "DashboardLayout" (
    "id" TEXT NOT NULL,
    "widgets" JSONB NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'dark',

    CONSTRAINT "DashboardLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ApiPerformanceLog (Pillar 19)
CREATE TABLE IF NOT EXISTS "ApiPerformanceLog" (
    "id" TEXT NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "routePath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiPerformanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ApiPerformanceMetric (Pillar 19)
CREATE TABLE IF NOT EXISTS "ApiPerformanceMetric" (
    "id" TEXT NOT NULL,
    "routePath" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "p50" DOUBLE PRECISION NOT NULL,
    "p95" DOUBLE PRECISION NOT NULL,
    "p99" DOUBLE PRECISION NOT NULL,
    "avgTime" DOUBLE PRECISION NOT NULL,
    "errorRate" DOUBLE PRECISION NOT NULL,
    "totalReqs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserFeedback (Pillar 20)
CREATE TABLE IF NOT EXISTS "UserFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rating" INTEGER,
    "text" TEXT,
    "category" TEXT,
    "pagePath" TEXT,
    "metadata" JSONB,
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BackupEvent (Pillar 21)
CREATE TABLE IF NOT EXISTS "BackupEvent" (
    "id" TEXT NOT NULL,
    "backupType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "provider" TEXT NOT NULL DEFAULT 'SUPABASE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RevenueEntry (Pillar 22)
CREATE TABLE IF NOT EXISTS "RevenueEntry" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "month" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "stripeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TrafficSource (Pillar 23)
CREATE TABLE IF NOT EXISTS "TrafficSource" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "referrer" TEXT,
    "channel" TEXT NOT NULL,
    "landingPage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FeatureFlag (Pillar 24)
CREATE TABLE IF NOT EXISTS "FeatureFlag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercent" INTEGER NOT NULL DEFAULT 100,
    "targetRoles" JSONB,
    "targetUserIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DeployEvent (Pillar 25)
CREATE TABLE IF NOT EXISTS "DeployEvent" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "gitCommit" TEXT,
    "changesSummary" TEXT,
    "status" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'PRODUCTION',
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "DeployEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DigestConfig (Pillar 18)
CREATE TABLE IF NOT EXISTS "DigestConfig" (
    "id" TEXT NOT NULL,
    "digestType" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sendTime" TEXT NOT NULL DEFAULT '08:00',
    "recipientEmail" TEXT NOT NULL,
    "lastSentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigestConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for AIAgentInsight
CREATE INDEX IF NOT EXISTS "AIAgentInsight_agentType_createdAt_idx" ON "AIAgentInsight"("agentType", "createdAt");
CREATE INDEX IF NOT EXISTS "AIAgentInsight_severity_idx" ON "AIAgentInsight"("severity");
CREATE INDEX IF NOT EXISTS "AIAgentInsight_isRead_idx" ON "AIAgentInsight"("isRead");

-- CreateIndexes for AutomationRule
CREATE INDEX IF NOT EXISTS "AutomationRule_triggerEvent_isActive_idx" ON "AutomationRule"("triggerEvent", "isActive");

-- CreateIndexes for AutomationAction
CREATE INDEX IF NOT EXISTS "AutomationAction_ruleId_createdAt_idx" ON "AutomationAction"("ruleId", "createdAt");
CREATE INDEX IF NOT EXISTS "AutomationAction_status_idx" ON "AutomationAction"("status");

-- CreateIndexes for ClientError
CREATE INDEX IF NOT EXISTS "ClientError_errorType_createdAt_idx" ON "ClientError"("errorType", "createdAt");
CREATE INDEX IF NOT EXISTS "ClientError_userId_idx" ON "ClientError"("userId");
CREATE INDEX IF NOT EXISTS "ClientError_pagePath_idx" ON "ClientError"("pagePath");
CREATE INDEX IF NOT EXISTS "ClientError_isResolved_idx" ON "ClientError"("isResolved");

-- CreateIndexes for BusinessMetric
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessMetric_metricName_period_periodDate_key" ON "BusinessMetric"("metricName", "period", "periodDate");
CREATE INDEX IF NOT EXISTS "BusinessMetric_metricName_periodDate_idx" ON "BusinessMetric"("metricName", "periodDate");

-- CreateIndexes for PlatformCost
CREATE UNIQUE INDEX IF NOT EXISTS "PlatformCost_category_month_key" ON "PlatformCost"("category", "month");
CREATE INDEX IF NOT EXISTS "PlatformCost_month_idx" ON "PlatformCost"("month");

-- CreateIndexes for PageView
CREATE INDEX IF NOT EXISTS "PageView_userId_createdAt_idx" ON "PageView"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PageView_pagePath_idx" ON "PageView"("pagePath");

-- CreateIndexes for ClickEvent
CREATE INDEX IF NOT EXISTS "ClickEvent_userId_createdAt_idx" ON "ClickEvent"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ClickEvent_pagePath_idx" ON "ClickEvent"("pagePath");

-- CreateIndexes for OwnerEmail
CREATE INDEX IF NOT EXISTS "OwnerEmail_status_createdAt_idx" ON "OwnerEmail"("status", "createdAt");

-- CreateIndexes for OwnerEmailRecipient
CREATE INDEX IF NOT EXISTS "OwnerEmailRecipient_emailId_idx" ON "OwnerEmailRecipient"("emailId");

-- CreateIndexes for OwnerAuditLog
CREATE INDEX IF NOT EXISTS "OwnerAuditLog_action_createdAt_idx" ON "OwnerAuditLog"("action", "createdAt");

-- CreateUnique for EmailTemplate
CREATE UNIQUE INDEX IF NOT EXISTS "EmailTemplate_name_key" ON "EmailTemplate"("name");

-- CreateIndexes for ApiPerformanceLog
CREATE INDEX IF NOT EXISTS "ApiPerformanceLog_routePath_createdAt_idx" ON "ApiPerformanceLog"("routePath", "createdAt");
CREATE INDEX IF NOT EXISTS "ApiPerformanceLog_statusCode_idx" ON "ApiPerformanceLog"("statusCode");

-- CreateIndexes for ApiPerformanceMetric
CREATE UNIQUE INDEX IF NOT EXISTS "ApiPerformanceMetric_routePath_period_periodDate_key" ON "ApiPerformanceMetric"("routePath", "period", "periodDate");
CREATE INDEX IF NOT EXISTS "ApiPerformanceMetric_routePath_periodDate_idx" ON "ApiPerformanceMetric"("routePath", "periodDate");

-- CreateIndexes for UserFeedback
CREATE INDEX IF NOT EXISTS "UserFeedback_type_createdAt_idx" ON "UserFeedback"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "UserFeedback_userId_idx" ON "UserFeedback"("userId");
CREATE INDEX IF NOT EXISTS "UserFeedback_isReviewed_idx" ON "UserFeedback"("isReviewed");

-- CreateIndexes for BackupEvent
CREATE INDEX IF NOT EXISTS "BackupEvent_status_createdAt_idx" ON "BackupEvent"("status", "createdAt");

-- CreateIndexes for RevenueEntry
CREATE INDEX IF NOT EXISTS "RevenueEntry_source_month_idx" ON "RevenueEntry"("source", "month");
CREATE INDEX IF NOT EXISTS "RevenueEntry_month_idx" ON "RevenueEntry"("month");

-- CreateIndexes for TrafficSource
CREATE INDEX IF NOT EXISTS "TrafficSource_channel_createdAt_idx" ON "TrafficSource"("channel", "createdAt");
CREATE INDEX IF NOT EXISTS "TrafficSource_utmCampaign_idx" ON "TrafficSource"("utmCampaign");
CREATE INDEX IF NOT EXISTS "TrafficSource_userId_idx" ON "TrafficSource"("userId");

-- CreateUnique for FeatureFlag
CREATE UNIQUE INDEX IF NOT EXISTS "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndexes for DeployEvent
CREATE INDEX IF NOT EXISTS "DeployEvent_deployedAt_idx" ON "DeployEvent"("deployedAt");
CREATE INDEX IF NOT EXISTS "DeployEvent_version_idx" ON "DeployEvent"("version");

-- CreateUnique for DigestConfig
CREATE UNIQUE INDEX IF NOT EXISTS "DigestConfig_digestType_key" ON "DigestConfig"("digestType");

-- AddForeignKey for OwnerEmailRecipient
ALTER TABLE "OwnerEmailRecipient" ADD CONSTRAINT "OwnerEmailRecipient_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "OwnerEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
