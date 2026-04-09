ALTER TABLE "direct_message_thread_participants"
ADD COLUMN IF NOT EXISTS "last_read_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE "community_members"
ADD COLUMN IF NOT EXISTS "last_read_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();
