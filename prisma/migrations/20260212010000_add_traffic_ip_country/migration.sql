-- AlterTable
ALTER TABLE "TrafficSource" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "TrafficSource" ADD COLUMN IF NOT EXISTS "country" TEXT;
