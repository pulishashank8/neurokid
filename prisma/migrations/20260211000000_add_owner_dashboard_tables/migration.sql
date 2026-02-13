-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "featureName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMetric" (
    "id" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "responseTimeMs" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationActionLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntity" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DataRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "SystemMetric_metricName_idx" ON "SystemMetric"("metricName");

-- CreateIndex
CREATE INDEX "SystemMetric_recordedAt_idx" ON "SystemMetric"("recordedAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");

-- CreateIndex
CREATE INDEX "AIUsageLog_feature_idx" ON "AIUsageLog"("feature");

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "ModerationActionLog_adminId_idx" ON "ModerationActionLog"("adminId");

-- CreateIndex
CREATE INDEX "ModerationActionLog_targetType_idx" ON "ModerationActionLog"("targetType");

-- CreateIndex
CREATE INDEX "ModerationActionLog_createdAt_idx" ON "ModerationActionLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminNotification_isRead_idx" ON "AdminNotification"("isRead");

-- CreateIndex
CREATE INDEX "AdminNotification_severity_idx" ON "AdminNotification"("severity");

-- CreateIndex
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");

-- CreateIndex
CREATE INDEX "DataRequest_requestType_idx" ON "DataRequest"("requestType");

-- CreateIndex
CREATE INDEX "DataRequest_status_idx" ON "DataRequest"("status");

-- CreateIndex
CREATE INDEX "DataRequest_createdAt_idx" ON "DataRequest"("createdAt");
