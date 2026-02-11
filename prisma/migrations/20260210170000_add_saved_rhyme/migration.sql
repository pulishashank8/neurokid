-- CreateTable
CREATE TABLE "SavedRhyme" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rhymeId" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedRhyme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedRhyme_userId_rhymeId_key" ON "SavedRhyme"("userId", "rhymeId");

-- CreateIndex
CREATE INDEX "SavedRhyme_userId_idx" ON "SavedRhyme"("userId");

-- CreateIndex
CREATE INDEX "SavedRhyme_rhymeId_idx" ON "SavedRhyme"("rhymeId");

-- AddForeignKey
ALTER TABLE "SavedRhyme" ADD CONSTRAINT "SavedRhyme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
