-- Archive Tables for Data Lifecycle Management (Phase 7.4.1)
-- These tables store old/deleted data separately from active tables

-- Archived Posts (deleted or very old)
CREATE TABLE IF NOT EXISTS "PostArchive" (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  category_id TEXT NOT NULL,
  status TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  vote_score INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_reason TEXT -- 'OLD', 'DELETED', 'MODERATION'
);

CREATE INDEX IF NOT EXISTS idx_post_archive_created ON "PostArchive"("created_at");
CREATE INDEX IF NOT EXISTS idx_post_archive_archived ON "PostArchive"("archived_at");
CREATE INDEX IF NOT EXISTS idx_post_archive_author ON "PostArchive"("author_id");

-- Archived Comments
CREATE TABLE IF NOT EXISTS "CommentArchive" (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  parent_comment_id TEXT,
  status TEXT NOT NULL,
  vote_score INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_comment_archive_created ON "CommentArchive"("created_at");
CREATE INDEX IF NOT EXISTS idx_comment_archive_archived ON "CommentArchive"("archived_at");

-- Archived Messages
CREATE TABLE IF NOT EXISTS "MessageArchive" (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  sender_id TEXT,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_archive_created ON "MessageArchive"("created_at");
CREATE INDEX IF NOT EXISTS idx_message_archive_archived ON "MessageArchive"("archived_at");

-- Archived Notifications (older than 90 days)
CREATE TABLE IF NOT EXISTS "NotificationArchive" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_archive_user ON "NotificationArchive"("user_id");
CREATE INDEX IF NOT EXISTS idx_notification_archive_created ON "NotificationArchive"("created_at");
