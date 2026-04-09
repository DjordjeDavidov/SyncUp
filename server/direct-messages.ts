import { Prisma } from "@/lib/prisma-generated";
import { prisma } from "@/lib/prisma";
import {
  ensureCommunityMemberLastReadAtColumn,
  ensureDirectMessageImageColumns,
  ensureDirectThreadHiddenAtColumn,
  ensureDirectThreadLastReadAtColumn,
  hasDirectThreadHiddenAtColumn,
} from "@/server/chat-read-state";

const DIRECT_SEARCH_LIMIT = 12;

type SearchCandidate = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  followsYou: boolean;
  youFollow: boolean;
  score: number;
};

async function getBlockedUserIds(userId: string, tx: typeof prisma | Prisma.TransactionClient = prisma) {
  const rows = await tx.blocks.findMany({
    where: {
      OR: [{ blocker_id: userId }, { blocked_id: userId }],
    },
    select: {
      blocker_id: true,
      blocked_id: true,
    },
  });

  return new Set(
    rows.flatMap((row) => [row.blocker_id, row.blocked_id]).filter((id) => id !== userId),
  );
}

async function findExistingDirectConversation(
  tx: typeof prisma | Prisma.TransactionClient,
  currentUserId: string,
  targetUserId: string,
) {
  const threads = await tx.direct_message_threads.findMany({
    where: {
      participants: {
        some: { user_id: currentUserId },
        every: {
          user_id: {
            in: [currentUserId, targetUserId],
          },
        },
      },
    },
    include: {
      participants: {
        select: {
          user_id: true,
        },
      },
    },
    orderBy: {
      updated_at: "desc",
    },
  });

  return (
    threads.find((thread) => {
      const participantIds = thread.participants.map((participant) => participant.user_id);

      return (
        participantIds.length === 2 &&
        participantIds.includes(currentUserId) &&
        participantIds.includes(targetUserId)
      );
    }) ?? null
  );
}

export async function isUserBlocked(currentUserId: string, targetUserId: string, tx: typeof prisma | Prisma.TransactionClient = prisma) {
  const row = await tx.blocks.findFirst({
    where: {
      OR: [
        { blocker_id: currentUserId, blocked_id: targetUserId },
        { blocker_id: targetUserId, blocked_id: currentUserId },
      ],
    },
    select: {
      blocker_id: true,
    },
  });

  return row?.blocker_id ?? null;
}

async function assertDirectConversationTarget(
  currentUserId: string,
  targetUserId: string,
  tx: typeof prisma | Prisma.TransactionClient = prisma,
) {
  if (currentUserId === targetUserId) {
    throw new Error("You cannot start a direct chat with yourself.");
  }

  const blockedIds = await getBlockedUserIds(currentUserId, tx);

  if (blockedIds.has(targetUserId)) {
    throw new Error("This user is unavailable for direct messages.");
  }

  const target = await tx.users.findUnique({
    where: {
      id: targetUserId,
      status: "ACTIVE",
    },
    include: {
      profiles: true,
    },
  });

  if (!target) {
    throw new Error("User not found.");
  }

  return target;
}

export async function getOrCreateDirectConversation(currentUserId: string, targetUserId: string) {
  return prisma.$transaction(async (tx) => {
    await assertDirectConversationTarget(currentUserId, targetUserId, tx);
    await ensureDirectThreadHiddenAtColumn();

    const conversationKey = [currentUserId, targetUserId].sort().join(":");
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${conversationKey}))`;

    const existingThread = await findExistingDirectConversation(tx, currentUserId, targetUserId);

    if (existingThread) {
      await tx.direct_message_thread_participants.updateMany({
        where: {
          thread_id: existingThread.id,
          user_id: currentUserId,
        },
        data: {
          hidden_at: null,
        },
      });

      return existingThread;
    }

    return tx.direct_message_threads.create({
      data: {
        participants: {
          createMany: {
            data: [{ user_id: currentUserId }, { user_id: targetUserId }],
          },
        },
      },
      include: {
        participants: {
          select: {
            user_id: true,
          },
        },
      },
    });
  });
}

export async function searchDirectMessageUsers(currentUserId: string, rawQuery: string) {
  const query = rawQuery.trim();
  const blockedIds = await getBlockedUserIds(currentUserId);

  const followRows = await prisma.follows.findMany({
    where: {
      OR: [{ follower_id: currentUserId }, { following_id: currentUserId }],
    },
    select: {
      follower_id: true,
      following_id: true,
    },
  });

  const relationshipMap = new Map<string, { followsYou: boolean; youFollow: boolean }>();

  for (const row of followRows) {
    if (row.follower_id === currentUserId) {
      const relation = relationshipMap.get(row.following_id) ?? { followsYou: false, youFollow: false };
      relation.youFollow = true;
      relationshipMap.set(row.following_id, relation);
    }

    if (row.following_id === currentUserId) {
      const relation = relationshipMap.get(row.follower_id) ?? { followsYou: false, youFollow: false };
      relation.followsYou = true;
      relationshipMap.set(row.follower_id, relation);
    }
  }

  const networkUserIds = Array.from(relationshipMap.keys()).filter((id) => !blockedIds.has(id));

  const where: Prisma.usersWhereInput = {
    AND: [
      {
        id: {
          not: currentUserId,
          notIn: Array.from(blockedIds),
        },
        status: "ACTIVE",
        profiles: {
          isNot: null,
        },
      },
      query
        ? {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { profiles: { is: { full_name: { contains: query, mode: "insensitive" } } } },
            ],
          }
        : {
            id: {
              in: networkUserIds.length > 0 ? networkUserIds : ["00000000-0000-0000-0000-000000000000"],
            },
          },
    ],
  };

  const users = await prisma.users.findMany({
    where,
    include: {
      profiles: true,
    },
    take: query ? DIRECT_SEARCH_LIMIT * 2 : DIRECT_SEARCH_LIMIT,
  });

  const ranked = users
    .map<SearchCandidate>((user) => {
      const relation = relationshipMap.get(user.id) ?? { followsYou: false, youFollow: false };
      const name = user.profiles?.full_name ?? user.username;
      const text = `${user.username} ${name}`.toLowerCase();
      const normalizedQuery = query.toLowerCase();
      const startsWithUsername = normalizedQuery ? user.username.toLowerCase().startsWith(normalizedQuery) : false;
      const startsWithName = normalizedQuery ? name.toLowerCase().startsWith(normalizedQuery) : false;

      return {
        id: user.id,
        username: user.username,
        name,
        avatarUrl: user.profiles?.avatar_url ?? null,
        bio: user.profiles?.bio ?? null,
        city: user.profiles?.city ?? null,
        country: user.profiles?.country ?? null,
        followsYou: relation.followsYou,
        youFollow: relation.youFollow,
        score:
          (relation.youFollow ? 50 : 0) +
          (relation.followsYou ? 45 : 0) +
          (startsWithUsername ? 25 : 0) +
          (startsWithName ? 18 : 0) +
          (text.includes(normalizedQuery) ? 8 : 0),
      };
    })
    .sort((left, right) => right.score - left.score || left.username.localeCompare(right.username))
    .slice(0, DIRECT_SEARCH_LIMIT);

  return ranked.map(({ score: _score, ...candidate }) => candidate);
}

export async function assertDirectMessageThreadAccess(currentUserId: string, threadId: string) {
  const hasHiddenAt = await hasDirectThreadHiddenAtColumn();
  const thread = await prisma.direct_message_threads.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      participants: {
        select: hasHiddenAt
          ? {
              user_id: true,
              hidden_at: true,
            }
          : {
              user_id: true,
            },
      },
    },
  });

  const currentParticipant = thread?.participants.find((participant) => participant.user_id === currentUserId);
  const isHidden = hasHiddenAt && currentParticipant && "hidden_at" in currentParticipant ? Boolean(currentParticipant.hidden_at) : false;

  if (!thread || !currentParticipant || isHidden) {
    throw new Error("You do not have access to this conversation.");
  }

  return thread;
}

export async function assertDirectMessageThreadCanSend(currentUserId: string, threadId: string) {
  const thread = await prisma.direct_message_threads.findUnique({
    where: { id: threadId },
    select: {
      participants: {
        select: {
          user_id: true,
        },
      },
    },
  });

  if (!thread || !thread.participants.some((participant) => participant.user_id === currentUserId)) {
    throw new Error("You do not have access to this conversation.");
  }

  const otherParticipantId = thread.participants.find((participant) => participant.user_id !== currentUserId)?.user_id;

  if (!otherParticipantId) {
    throw new Error("Direct message recipient not found.");
  }

  if (await isUserBlocked(currentUserId, otherParticipantId)) {
    throw new Error("You cannot message this person right now.");
  }

  return {
    thread,
    otherParticipantId,
  };
}

export async function markDirectThreadAsRead(currentUserId: string, threadId: string) {
  await ensureDirectThreadLastReadAtColumn();
  await ensureDirectThreadHiddenAtColumn();

  await prisma.direct_message_thread_participants.updateMany({
    where: {
      thread_id: threadId,
      user_id: currentUserId,
    },
    data: {
      last_read_at: new Date(),
      hidden_at: null,
    },
  });
}

export async function markCommunityChatAsRead(currentUserId: string, communityId: string) {
  await ensureCommunityMemberLastReadAtColumn();

  await prisma.community_members.updateMany({
    where: {
      community_id: communityId,
      user_id: currentUserId,
    },
    data: {
      last_read_at: new Date(),
    },
  });
}

export async function ensureDirectMessageMediaSupport() {
  await ensureDirectMessageImageColumns();
}

export async function blockDirectMessageUser(currentUserId: string, threadId: string) {
  const access = await assertDirectMessageThreadCanSend(currentUserId, threadId);

  await prisma.blocks.upsert({
    where: {
      blocker_id_blocked_id: {
        blocker_id: currentUserId,
        blocked_id: access.otherParticipantId,
      },
    },
    update: {},
    create: {
      blocker_id: currentUserId,
      blocked_id: access.otherParticipantId,
    },
  });
}

export async function hideDirectMessageThread(currentUserId: string, threadId: string) {
  await assertDirectMessageThreadAccess(currentUserId, threadId);
  await ensureDirectThreadHiddenAtColumn();

  await prisma.direct_message_thread_participants.updateMany({
    where: {
      thread_id: threadId,
      user_id: currentUserId,
    },
    data: {
      hidden_at: new Date(),
    },
  });
}
