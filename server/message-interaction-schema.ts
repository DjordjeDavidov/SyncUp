import { prisma } from "@/lib/prisma";

let ensureDirectInteractionPromise: Promise<boolean> | null = null;
let ensureCommunityInteractionPromise: Promise<boolean> | null = null;

async function hasColumn(tableName: string, columnName: string) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
    ) AS "exists"
  `;

  return Boolean(rows[0]?.exists);
}

async function hasTable(tableName: string) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
    ) AS "exists"
  `;

  return Boolean(rows[0]?.exists);
}

export async function ensureDirectMessageInteractionSchema() {
  const hasReplyColumn = await hasColumn("direct_messages", "reply_to_message_id");
  const hasDeletedColumn = await hasColumn("direct_messages", "is_deleted");
  const hasLikesTable = await hasTable("direct_message_likes");

  if (hasReplyColumn && hasDeletedColumn && hasLikesTable) {
    return true;
  }

  if (!ensureDirectInteractionPromise) {
    ensureDirectInteractionPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "direct_messages"
        ADD COLUMN IF NOT EXISTS "reply_to_message_id" UUID,
        ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_direct_messages_reply_to_message_id"
        ON "direct_messages" ("reply_to_message_id")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "direct_message_likes" (
          "message_id" UUID NOT NULL,
          "user_id" UUID NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT "direct_message_likes_pkey" PRIMARY KEY ("message_id", "user_id")
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_direct_message_likes_user_id"
        ON "direct_message_likes" ("user_id")
      `);

      return true;
    })()
      .then(() => true)
      .finally(() => {
        ensureDirectInteractionPromise = null;
      });
  }

  return ensureDirectInteractionPromise;
}

export async function ensureCommunityMessageInteractionSchema() {
  const hasReplyColumn = await hasColumn("community_chat_messages", "reply_to_message_id");
  const hasDeletedColumn = await hasColumn("community_chat_messages", "is_deleted");
  const hasLikesTable = await hasTable("community_chat_message_likes");

  if (hasReplyColumn && hasDeletedColumn && hasLikesTable) {
    return true;
  }

  if (!ensureCommunityInteractionPromise) {
    ensureCommunityInteractionPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "community_chat_messages"
        ADD COLUMN IF NOT EXISTS "reply_to_message_id" UUID,
        ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_community_chat_messages_reply_to_message_id"
        ON "community_chat_messages" ("reply_to_message_id")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "community_chat_message_likes" (
          "message_id" UUID NOT NULL,
          "user_id" UUID NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT "community_chat_message_likes_pkey" PRIMARY KEY ("message_id", "user_id")
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_community_chat_message_likes_user_id"
        ON "community_chat_message_likes" ("user_id")
      `);

      return true;
    })()
      .then(() => true)
      .finally(() => {
        ensureCommunityInteractionPromise = null;
      });
  }

  return ensureCommunityInteractionPromise;
}
