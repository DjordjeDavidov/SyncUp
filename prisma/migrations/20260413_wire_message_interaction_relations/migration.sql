DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'direct_messages_reply_to_message_id_fkey'
  ) THEN
    ALTER TABLE "direct_messages"
    ADD CONSTRAINT "direct_messages_reply_to_message_id_fkey"
    FOREIGN KEY ("reply_to_message_id") REFERENCES "direct_messages"("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'direct_message_likes_message_id_fkey'
  ) THEN
    ALTER TABLE "direct_message_likes"
    ADD CONSTRAINT "direct_message_likes_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "direct_messages"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'direct_message_likes_user_id_fkey'
  ) THEN
    ALTER TABLE "direct_message_likes"
    ADD CONSTRAINT "direct_message_likes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'community_chat_messages_reply_to_message_id_fkey'
  ) THEN
    ALTER TABLE "community_chat_messages"
    ADD CONSTRAINT "community_chat_messages_reply_to_message_id_fkey"
    FOREIGN KEY ("reply_to_message_id") REFERENCES "community_chat_messages"("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'community_chat_message_likes_message_id_fkey'
  ) THEN
    ALTER TABLE "community_chat_message_likes"
    ADD CONSTRAINT "community_chat_message_likes_message_id_fkey"
    FOREIGN KEY ("message_id") REFERENCES "community_chat_messages"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'community_chat_message_likes_user_id_fkey'
  ) THEN
    ALTER TABLE "community_chat_message_likes"
    ADD CONSTRAINT "community_chat_message_likes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION;
  END IF;
END $$;
