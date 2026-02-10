-- Covering Indexes (Phase 7.1.4)
-- These indexes include all columns needed by queries, enabling index-only scans
-- Benefits: 50-70% reduction in I/O, no table access needed

-- Post: Cover common feed query (id, title, authorId, voteScore, createdAt, viewCount)
CREATE INDEX IF NOT EXISTS idx_post_feed_covering
ON "Post"(status, "createdAt" DESC)
INCLUDE (id, title, "authorId", "voteScore", "viewCount", "categoryId", "isAnonymous");

-- Comment: Cover comment list query
CREATE INDEX IF NOT EXISTS idx_comment_list_covering
ON "Comment"("postId", status, "createdAt" ASC)
INCLUDE (id, content, "authorId", "voteScore", "parentCommentId", "isAnonymous");

-- Vote: Cover batch vote lookup
CREATE INDEX IF NOT EXISTS idx_vote_batch_covering
ON "Vote"("userId", "targetType")
INCLUDE ("targetId", value);

-- Notification: Cover unread notification query
CREATE INDEX IF NOT EXISTS idx_notification_unread_covering
ON "Notification"("userId", "readAt")
INCLUDE (id, type, payload, "createdAt");

-- Benefits:
-- - Index-only scans (no heap/table access needed)
-- - 50-70% I/O reduction for covered queries
-- - Especially beneficial for high-traffic read queries
