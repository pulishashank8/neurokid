-- ============================================================================
-- 1. CLEANUP & PREPARATION
-- ============================================================================
-- Drop existing tables/relations to recreate with the new UUID-based persistent structure
-- WARNING: This will delete existing message data.
DROP TABLE IF EXISTS "DirectMessage" CASCADE;
DROP TABLE IF EXISTS "Conversation" CASCADE;
DROP TABLE IF EXISTS "Conversations" CASCADE;
DROP TABLE IF EXISTS "ConversationParticipants" CASCADE;
DROP TABLE IF EXISTS "Messages" CASCADE;
DROP TABLE IF EXISTS "ConnectionRequest" CASCADE;
DROP TABLE IF EXISTS "ConnectionRequests" CASCADE;
DROP TABLE IF EXISTS "Connections" CASCADE;

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- CONVERSATIONS
CREATE TABLE "Conversations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- CONVERSATION PARTICIPANTS (Junction Table)
CREATE TABLE "ConversationParticipants" (
    "conversation_id" UUID REFERENCES "Conversations"("id") ON DELETE CASCADE,
    "user_id" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY ("conversation_id", "user_id")
);

-- MESSAGES
CREATE TABLE "Messages" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversation_id" UUID REFERENCES "Conversations"("id") ON DELETE CASCADE,
    "sender_id" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
    "content" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- CONNECTION REQUESTS
CREATE TABLE "ConnectionRequests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sender_id" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
    "receiver_id" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
    "message" TEXT,
    "status" TEXT CHECK ("status" IN ('PENDING', 'ACCEPTED', 'DECLINED')) DEFAULT 'PENDING',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE("sender_id", "receiver_id")
);

-- CONNECTIONS (Permanent records)
CREATE TABLE "Connections" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_a" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
    "user_b" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE("user_a", "user_b")
);

-- ============================================================================
-- 3. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "Messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_messages_sender_id" ON "Messages"("sender_id");
CREATE INDEX IF NOT EXISTS "idx_messages_created_at" ON "Messages"("created_at");
CREATE INDEX IF NOT EXISTS "idx_conversation_participants_user_id" ON "ConversationParticipants"("user_id");
CREATE INDEX IF NOT EXISTS "idx_connection_requests_receiver_id" ON "ConnectionRequests"("receiver_id");
CREATE INDEX IF NOT EXISTS "idx_connection_requests_status" ON "ConnectionRequests"("status");
CREATE INDEX IF NOT EXISTS "idx_connections_user_a" ON "Connections"("user_a");
CREATE INDEX IF NOT EXISTS "idx_connections_user_b" ON "Connections"("user_b");

-- Fix "Unindexed foreign keys" warnings
CREATE INDEX IF NOT EXISTS "idx_email_verification_user_id" ON "EmailVerification"("userId");
CREATE INDEX IF NOT EXISTS "idx_provider_claimed_by_user_id" ON "Provider"("claimedByUserId");

-- ============================================================================
-- 4. CONSTRAINTS & UNIQUENESS
-- ============================================================================
-- Ensure username is unique in the Profile table (if not already enforced)
DO $$
BEGIN
    -- Drop the old/duplicate constraint/index if it exists, so we consolidate on 'Profile_username_unique'
    -- (The warning indicated Profile_username_key was a duplicate)
    BEGIN
        ALTER TABLE "Profile" DROP CONSTRAINT "Profile_username_key";
    EXCEPTION WHEN OTHERS THEN
        -- If it doesn't exist as a constraint, try dropping as an index just in case
        NULL;
    END;
    
    -- Note: We can't easily drop an index inside a DO block if it enforces a constraint, 
    -- but the above DROP CONSTRAINT covers the usual Prisma case.
    -- If it's a pure index:
    -- DROP INDEX IF EXISTS "Profile_username_key"; -- context requires calling outside DO or carefully.
    -- Ideally, we just ensure one constraint exists.
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Profile_username_unique') THEN
        ALTER TABLE "Profile" ADD CONSTRAINT "Profile_username_unique" UNIQUE ("username");
    END IF;
END $$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE "Conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationParticipants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConnectionRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Connections" ENABLE ROW LEVEL SECURITY;

-- Conversations: Visible to participants
DROP POLICY IF EXISTS "conversations_select" ON "Conversations";
CREATE POLICY "conversations_select" ON "Conversations" FOR SELECT USING (
    EXISTS (SELECT 1 FROM "ConversationParticipants" WHERE conversation_id = "Conversations".id AND user_id = (select auth.uid()::text))
);

-- Participants: Visible to self and other participants of the same conversation
DROP POLICY IF EXISTS "participants_select" ON "ConversationParticipants";
CREATE POLICY "participants_select" ON "ConversationParticipants" FOR SELECT USING (
    user_id = (select auth.uid()::text) OR EXISTS (
        SELECT 1 FROM "ConversationParticipants" AS cp 
        WHERE cp.conversation_id = "ConversationParticipants".conversation_id 
        AND cp.user_id = (select auth.uid()::text)
    )
);

-- Messages: Participants can read and send
DROP POLICY IF EXISTS "messages_select" ON "Messages";
CREATE POLICY "messages_select" ON "Messages" FOR SELECT USING (
    EXISTS (SELECT 1 FROM "ConversationParticipants" WHERE conversation_id = "Messages".conversation_id AND user_id = (select auth.uid()::text))
);

DROP POLICY IF EXISTS "messages_insert" ON "Messages";
CREATE POLICY "messages_insert" ON "Messages" FOR INSERT WITH CHECK (
    sender_id = (select auth.uid()::text) AND EXISTS (
        SELECT 1 FROM "ConversationParticipants" 
        WHERE conversation_id = "Messages".conversation_id 
        AND user_id = (select auth.uid()::text)
    )
);

-- Connection Requests: Sender/Receiver only
DROP POLICY IF EXISTS "requests_policy" ON "ConnectionRequests";
CREATE POLICY "requests_policy" ON "ConnectionRequests" FOR ALL USING (
    sender_id = (select auth.uid()::text) OR receiver_id = (select auth.uid()::text)
);

-- Connections: Viewable by the two connected users
DROP POLICY IF EXISTS "connections_select" ON "Connections";
CREATE POLICY "connections_select" ON "Connections" FOR SELECT USING (
    user_a = (select auth.uid()::text) OR user_b = (select auth.uid()::text)
);
