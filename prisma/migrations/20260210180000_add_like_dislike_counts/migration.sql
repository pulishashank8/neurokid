-- AlterTable: add likeCount and dislikeCount to Post
ALTER TABLE "Post" ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Post" ADD COLUMN "dislikeCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: add likeCount and dislikeCount to Comment
ALTER TABLE "Comment" ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Comment" ADD COLUMN "dislikeCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill Post: set likeCount and dislikeCount from Vote table
UPDATE "Post" p SET
  "likeCount" = COALESCE((SELECT COUNT(*)::int FROM "Vote" v WHERE v."targetType" = 'POST' AND v."targetId" = p.id AND v.value = 1), 0),
  "dislikeCount" = COALESCE((SELECT COUNT(*)::int FROM "Vote" v WHERE v."targetType" = 'POST' AND v."targetId" = p.id AND v.value = -1), 0);

-- Backfill Comment: set likeCount and dislikeCount from Vote table
UPDATE "Comment" c SET
  "likeCount" = COALESCE((SELECT COUNT(*)::int FROM "Vote" v WHERE v."targetType" = 'COMMENT' AND v."targetId" = c.id AND v.value = 1), 0),
  "dislikeCount" = COALESCE((SELECT COUNT(*)::int FROM "Vote" v WHERE v."targetType" = 'COMMENT' AND v."targetId" = c.id AND v.value = -1), 0);
