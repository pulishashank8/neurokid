-- CreateTable
CREATE TABLE "FeedPost" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "summary" TEXT NOT NULL,
    "imageUrl" VARCHAR(2048),
    "sourceUrl" VARCHAR(2048),
    "sourceName" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(20) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedPost_sourceUrl_key" ON "FeedPost"("sourceUrl");

-- CreateIndex
CREATE INDEX "FeedPost_publishedAt_idx" ON "FeedPost"("publishedAt");

-- CreateIndex
CREATE INDEX "FeedPost_contentType_idx" ON "FeedPost"("contentType");
