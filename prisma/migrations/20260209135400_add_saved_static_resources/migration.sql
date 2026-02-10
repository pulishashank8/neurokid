-- CreateTable
CREATE TABLE "SavedStaticResource" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedStaticResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedStaticResource_userId_resourceKey_key" ON "SavedStaticResource"("userId", "resourceKey");

-- CreateIndex
CREATE INDEX "SavedStaticResource_userId_idx" ON "SavedStaticResource"("userId");

-- AddForeignKey
ALTER TABLE "SavedStaticResource" ADD CONSTRAINT "SavedStaticResource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
