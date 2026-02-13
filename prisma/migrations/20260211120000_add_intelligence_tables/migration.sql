-- CreateTable
CREATE TABLE "SystemAnomaly" (
    "id" TEXT NOT NULL,
    "anomalyType" TEXT NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "SystemAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRiskScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "riskLevel" VARCHAR(20) NOT NULL,
    "lastEvaluatedAt" TIMESTAMP(3) NOT NULL,
    "factors" JSONB NOT NULL,

    CONSTRAINT "UserRiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurnPrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "churnProbability" DOUBLE PRECISION NOT NULL,
    "riskLevel" VARCHAR(20) NOT NULL,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChurnPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityMetric" (
    "id" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataQualityMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealtimeEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealtimeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRetentionSnapshot" (
    "id" TEXT NOT NULL,
    "cohortDate" TIMESTAMP(3) NOT NULL,
    "day1Retention" DOUBLE PRECISION NOT NULL,
    "day7Retention" DOUBLE PRECISION NOT NULL,
    "day30Retention" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRetentionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLifecycleStage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stage" VARCHAR(50) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLifecycleStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFunnelMetric" (
    "id" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "usersEntered" INTEGER NOT NULL,
    "usersCompleted" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFunnelMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSegment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "segment" VARCHAR(50) NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngagementSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalType" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchInsight" (
    "id" TEXT NOT NULL,
    "term" VARCHAR(500) NOT NULL,
    "searchCount" INTEGER NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "lastSearchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "featureFlag" VARCHAR(100) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentResult" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "variantAValue" DOUBLE PRECISION NOT NULL,
    "variantBValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ExperimentResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemAnomaly_anomalyType_idx" ON "SystemAnomaly"("anomalyType");

-- CreateIndex
CREATE INDEX "SystemAnomaly_detectedAt_idx" ON "SystemAnomaly"("detectedAt");

-- CreateIndex
CREATE INDEX "SystemAnomaly_resolvedAt_idx" ON "SystemAnomaly"("resolvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRiskScore_userId_key" ON "UserRiskScore"("userId");

-- CreateIndex
CREATE INDEX "UserRiskScore_riskLevel_idx" ON "UserRiskScore"("riskLevel");

-- CreateIndex
CREATE INDEX "UserRiskScore_lastEvaluatedAt_idx" ON "UserRiskScore"("lastEvaluatedAt");

-- CreateIndex
CREATE INDEX "ChurnPrediction_userId_idx" ON "ChurnPrediction"("userId");

-- CreateIndex
CREATE INDEX "ChurnPrediction_riskLevel_idx" ON "ChurnPrediction"("riskLevel");

-- CreateIndex
CREATE INDEX "ChurnPrediction_predictedAt_idx" ON "ChurnPrediction"("predictedAt");

-- CreateIndex
CREATE INDEX "DataQualityMetric_metricName_idx" ON "DataQualityMetric"("metricName");

-- CreateIndex
CREATE INDEX "DataQualityMetric_recordedAt_idx" ON "DataQualityMetric"("recordedAt");

-- CreateIndex
CREATE INDEX "RealtimeEvent_eventType_idx" ON "RealtimeEvent"("eventType");

-- CreateIndex
CREATE INDEX "RealtimeEvent_createdAt_idx" ON "RealtimeEvent"("createdAt");

-- CreateIndex
CREATE INDEX "UserRetentionSnapshot_cohortDate_idx" ON "UserRetentionSnapshot"("cohortDate");

-- CreateIndex
CREATE UNIQUE INDEX "UserLifecycleStage_userId_key" ON "UserLifecycleStage"("userId");

-- CreateIndex
CREATE INDEX "UserLifecycleStage_stage_idx" ON "UserLifecycleStage"("stage");

-- CreateIndex
CREATE INDEX "UserFunnelMetric_stepName_idx" ON "UserFunnelMetric"("stepName");

-- CreateIndex
CREATE INDEX "UserFunnelMetric_recordedAt_idx" ON "UserFunnelMetric"("recordedAt");

-- CreateIndex
CREATE INDEX "UserSegment_userId_idx" ON "UserSegment"("userId");

-- CreateIndex
CREATE INDEX "UserSegment_segment_idx" ON "UserSegment"("segment");

-- CreateIndex
CREATE INDEX "EngagementSignal_userId_idx" ON "EngagementSignal"("userId");

-- CreateIndex
CREATE INDEX "EngagementSignal_signalType_idx" ON "EngagementSignal"("signalType");

-- CreateIndex
CREATE INDEX "SearchInsight_term_idx" ON "SearchInsight"("term");

-- CreateIndex
CREATE INDEX "Experiment_featureFlag_idx" ON "Experiment"("featureFlag");

-- CreateIndex
CREATE INDEX "ExperimentResult_experimentId_idx" ON "ExperimentResult"("experimentId");
