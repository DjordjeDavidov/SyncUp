ALTER TABLE "direct_messages"
ADD COLUMN IF NOT EXISTS "image_url" TEXT,
ADD COLUMN IF NOT EXISTS "image_path" TEXT;

ALTER TABLE "direct_message_thread_participants"
ADD COLUMN IF NOT EXISTS "hidden_at" TIMESTAMPTZ;
