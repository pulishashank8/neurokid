-- Drop Autism News Feed feature: remove FeedPost table and indexes
DROP INDEX IF EXISTS "FeedPost_contentType_idx";
DROP INDEX IF EXISTS "FeedPost_publishedAt_idx";
DROP INDEX IF EXISTS "FeedPost_sourceUrl_key";
DROP TABLE IF EXISTS "FeedPost";
