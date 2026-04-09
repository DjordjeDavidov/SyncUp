import { prisma } from "@/lib/prisma";

let directThreadReadColumnCache: boolean | null = null;
let communityMemberReadColumnCache: boolean | null = null;
let directThreadHiddenColumnCache: boolean | null = null;
let directMessageImageUrlColumnCache: boolean | null = null;
let directMessageImagePathColumnCache: boolean | null = null;
let directThreadEnsurePromise: Promise<boolean> | null = null;
let communityMemberEnsurePromise: Promise<boolean> | null = null;
let directThreadHiddenEnsurePromise: Promise<boolean> | null = null;
let directMessageMediaEnsurePromise: Promise<boolean> | null = null;

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

export async function hasDirectThreadLastReadAtColumn() {
  if (directThreadReadColumnCache === null) {
    directThreadReadColumnCache = await hasColumn("direct_message_thread_participants", "last_read_at");
  }

  return directThreadReadColumnCache;
}

export async function hasCommunityMemberLastReadAtColumn() {
  if (communityMemberReadColumnCache === null) {
    communityMemberReadColumnCache = await hasColumn("community_members", "last_read_at");
  }

  return communityMemberReadColumnCache;
}

export async function hasDirectThreadHiddenAtColumn() {
  if (directThreadHiddenColumnCache === null) {
    directThreadHiddenColumnCache = await hasColumn("direct_message_thread_participants", "hidden_at");
  }

  return directThreadHiddenColumnCache;
}

export async function hasDirectMessageImageColumns() {
  if (directMessageImageUrlColumnCache === null) {
    directMessageImageUrlColumnCache = await hasColumn("direct_messages", "image_url");
  }

  if (directMessageImagePathColumnCache === null) {
    directMessageImagePathColumnCache = await hasColumn("direct_messages", "image_path");
  }

  return Boolean(directMessageImageUrlColumnCache && directMessageImagePathColumnCache);
}

async function ensureColumn(
  tableName: "direct_message_thread_participants" | "community_members",
  cacheKey: "direct" | "community",
) {
  const hasExistingColumn =
    cacheKey === "direct"
      ? await hasDirectThreadLastReadAtColumn()
      : await hasCommunityMemberLastReadAtColumn();

  if (hasExistingColumn) {
    return true;
  }

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "last_read_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  );

  if (cacheKey === "direct") {
    directThreadReadColumnCache = true;
  } else {
    communityMemberReadColumnCache = true;
  }

  return true;
}

export async function ensureDirectThreadLastReadAtColumn() {
  if (directThreadReadColumnCache) {
    return true;
  }

  if (!directThreadEnsurePromise) {
    directThreadEnsurePromise = ensureColumn("direct_message_thread_participants", "direct").finally(() => {
      directThreadEnsurePromise = null;
    });
  }

  return directThreadEnsurePromise;
}

export async function ensureCommunityMemberLastReadAtColumn() {
  if (communityMemberReadColumnCache) {
    return true;
  }

  if (!communityMemberEnsurePromise) {
    communityMemberEnsurePromise = ensureColumn("community_members", "community").finally(() => {
      communityMemberEnsurePromise = null;
    });
  }

  return communityMemberEnsurePromise;
}

export async function ensureDirectThreadHiddenAtColumn() {
  if (directThreadHiddenColumnCache) {
    return true;
  }

  if (!directThreadHiddenEnsurePromise) {
    directThreadHiddenEnsurePromise = prisma.$executeRawUnsafe(
      `ALTER TABLE "direct_message_thread_participants" ADD COLUMN IF NOT EXISTS "hidden_at" TIMESTAMPTZ`,
    )
      .then(async () => {
        directThreadHiddenColumnCache = await hasColumn("direct_message_thread_participants", "hidden_at");
        return Boolean(directThreadHiddenColumnCache);
      })
      .finally(() => {
        directThreadHiddenEnsurePromise = null;
      });
  }

  return directThreadHiddenEnsurePromise;
}

export async function ensureDirectMessageImageColumns() {
  if (await hasDirectMessageImageColumns()) {
    return true;
  }

  if (!directMessageMediaEnsurePromise) {
    directMessageMediaEnsurePromise = prisma.$executeRawUnsafe(
      `ALTER TABLE "direct_messages"
       ADD COLUMN IF NOT EXISTS "image_url" TEXT,
       ADD COLUMN IF NOT EXISTS "image_path" TEXT`,
    )
      .then(async () => {
        const hasColumns = await hasDirectMessageImageColumns();
        if (hasColumns) {
          directMessageImageUrlColumnCache = true;
          directMessageImagePathColumnCache = true;
        }

        return hasColumns;
      })
      .finally(() => {
        directMessageMediaEnsurePromise = null;
      });
  }

  return directMessageMediaEnsurePromise;
}
