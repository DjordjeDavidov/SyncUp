ALTER TABLE "direct_messages"
ADD COLUMN IF NOT EXISTS "reply_to_message_id" UUID,
ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

ALTER TABLE "community_chat_messages"
ADD COLUMN IF NOT EXISTS "reply_to_message_id" UUID,
ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "idx_direct_messages_reply_to_message_id"
ON "direct_messages" ("reply_to_message_id");

CREATE INDEX IF NOT EXISTS "idx_community_chat_messages_reply_to_message_id"
ON "community_chat_messages" ("reply_to_message_id");

CREATE TABLE IF NOT EXISTS "direct_message_likes" (
  "message_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "direct_message_likes_pkey" PRIMARY KEY ("message_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "idx_direct_message_likes_user_id"
ON "direct_message_likes" ("user_id");

CREATE TABLE IF NOT EXISTS "community_chat_message_likes" (
  "message_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "community_chat_message_likes_pkey" PRIMARY KEY ("message_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "idx_community_chat_message_likes_user_id"
ON "community_chat_message_likes" ("user_id");
