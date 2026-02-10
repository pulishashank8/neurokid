-- Migration: Add Full-Text Search Support
-- This migration adds tsvector columns and GIN indexes for efficient full-text search

-- ===========================================
-- Posts Full-Text Search
-- ===========================================

-- Add tsvector column for posts
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Create function to automatically update search vector
CREATE OR REPLACE FUNCTION posts_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW."searchVector" := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain search vector
DROP TRIGGER IF EXISTS posts_search_vector_trigger ON "Post";
CREATE TRIGGER posts_search_vector_trigger
    BEFORE INSERT OR UPDATE ON "Post"
    FOR EACH ROW
    EXECUTE FUNCTION posts_search_vector_update();

-- Update existing posts
UPDATE "Post" SET "searchVector" = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(content, '')), 'B');

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "idx_post_search_vector" ON "Post" USING GIN("searchVector");

-- Create index for common post queries
CREATE INDEX IF NOT EXISTS "idx_post_status_created" ON "Post"(status, "createdAt" DESC);

-- ===========================================
-- Resources Full-Text Search
-- ===========================================

-- Add tsvector column for resources
ALTER TABLE "Resource" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Create function to automatically update search vector
CREATE OR REPLACE FUNCTION resources_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW."searchVector" := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain search vector
DROP TRIGGER IF EXISTS resources_search_vector_trigger ON "Resource";
CREATE TRIGGER resources_search_vector_trigger
    BEFORE INSERT OR UPDATE ON "Resource"
    FOR EACH ROW
    EXECUTE FUNCTION resources_search_vector_update();

-- Update existing resources
UPDATE "Resource" SET "searchVector" = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(content, '')), 'B');

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "idx_resource_search_vector" ON "Resource" USING GIN("searchVector");

-- ===========================================
-- Providers Full-Text Search
-- ===========================================

-- Add tsvector column for providers
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Create function to automatically update search vector
CREATE OR REPLACE FUNCTION providers_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW."searchVector" := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain search vector
DROP TRIGGER IF EXISTS providers_search_vector_trigger ON "Provider";
CREATE TRIGGER providers_search_vector_trigger
    BEFORE INSERT OR UPDATE ON "Provider"
    FOR EACH ROW
    EXECUTE FUNCTION providers_search_vector_update();

-- Update existing providers
UPDATE "Provider" SET "searchVector" = 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(city, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(state, '')), 'C');

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "idx_provider_search_vector" ON "Provider" USING GIN("searchVector");

-- ===========================================
-- Search Helper Functions
-- ===========================================

-- Function to search posts with ranking
CREATE OR REPLACE FUNCTION search_posts(
    search_query text,
    result_limit integer DEFAULT 20,
    result_offset integer DEFAULT 0
)
RETURNS TABLE (
    id text,
    title text,
    content text,
    "createdAt" timestamp,
    rank real,
    headline text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id::text,
        p.title::text,
        p.content::text,
        p."createdAt",
        ts_rank(p."searchVector", plainto_tsquery('english', search_query))::real as rank,
        ts_headline('english', p.content, plainto_tsquery('english', search_query), 
            'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10'
        )::text as headline
    FROM "Post" p
    WHERE p."searchVector" @@ plainto_tsquery('english', search_query)
        AND p.status = 'ACTIVE'
    ORDER BY rank DESC, p."createdAt" DESC
    LIMIT result_limit
    OFFSET result_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to count search results
CREATE OR REPLACE FUNCTION count_search_posts(search_query text)
RETURNS bigint AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM "Post"
        WHERE "searchVector" @@ plainto_tsquery('english', search_query)
            AND status = 'ACTIVE'
    );
END;
$$ LANGUAGE plpgsql STABLE;
