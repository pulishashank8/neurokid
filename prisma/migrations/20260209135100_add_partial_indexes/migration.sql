-- Partial Indexes for Active Records (Phase 7.1.3)
-- These indexes are smaller and faster since they only index active records

-- Post: Index only ACTIVE posts (90% of queries filter by status = 'ACTIVE')
CREATE INDEX IF NOT EXISTS idx_post_active_created
ON "Post"("createdAt" DESC)
WHERE status = 'ACTIVE';

-- Comment: Index only ACTIVE comments
CREATE INDEX IF NOT EXISTS idx_comment_active_created
ON "Comment"("createdAt" ASC)
WHERE status = 'ACTIVE';

-- User: Index only non-banned users
CREATE INDEX IF NOT EXISTS idx_user_active
ON "User"("createdAt" DESC)
WHERE "isBanned" = false;

-- AIJob: Index only pending/processing jobs
CREATE INDEX IF NOT EXISTS idx_aijob_pending
ON "AIJob"("createdAt" ASC)
WHERE status IN ('pending', 'processing');

-- Notification: Index only unread notifications
CREATE INDEX IF NOT EXISTS idx_notification_unread
ON "Notification"("createdAt" DESC)
WHERE "readAt" IS NULL;

-- Benefits:
-- - Smaller index size (only indexes relevant rows)
-- - Faster queries for common filters
-- - Reduced index maintenance overhead
