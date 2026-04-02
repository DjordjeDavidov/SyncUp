import { Prisma } from "@/lib/prisma-generated";
import { activity_status, community_visibility, invite_visibility } from "@/lib/prisma-generated";
import { prisma } from "@/lib/prisma";

const feedPostInclude = {
  users: {
    include: {
      profiles: true,
    },
  },
  communities: true,
  activities: {
    include: {
      activity_participants: {
        select: {
          user_id: true,
        },
      },
      _count: {
        select: {
          activity_participants: true,
        },
      },
    },
  },
  post_likes: true,
  post_saves: true,
  post_comments: {
    include: {
      users: {
        include: {
          profiles: true,
        },
      },
    },
    orderBy: {
      created_at: "asc" as const,
    },
  },
  poll_options: {
    include: {
      poll_votes: true,
    },
    orderBy: {
      position: "asc" as const,
    },
  },
  poll_votes: true,
} satisfies Prisma.postsInclude;

async function getInviteEligibleAuthorIds(userId: string) {
  const relationships = await prisma.follows.findMany({
    where: {
      OR: [
        { follower_id: userId },
        { following_id: userId },
      ],
    },
    select: {
      follower_id: true,
      following_id: true,
    },
  });

  return Array.from(
    new Set(
      relationships.flatMap((relationship) => [
        relationship.follower_id,
        relationship.following_id,
      ]),
    ),
  );
}

function getVisiblePostsWhere(
  viewerId: string,
  inviteEligibleAuthorIds: string[],
  extraWhere: Prisma.postsWhereInput = {},
): Prisma.postsWhereInput {
  return {
    AND: [
      extraWhere,
      {
        OR: [
          { post_type: { not: "INVITE_POST" } },
          { invite_visibility: invite_visibility.PUBLIC },
          { author_id: viewerId },
          { author_id: { in: inviteEligibleAuthorIds } },
        ],
      },
    ],
  };
}

export async function getOnboardingData() {
  const [languages, interests, vibeTags, activityCategories] = await Promise.all([
    prisma.languages.findMany({ orderBy: { name: "asc" } }),
    prisma.interests.findMany({ orderBy: { name: "asc" } }),
    prisma.vibe_tags.findMany({ orderBy: { name: "asc" } }),
    prisma.activity_categories.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    languages,
    interests,
    vibeTags,
    activityCategories,
  };
}

export async function getHomeFeedData(userId: string) {
  const inviteEligibleAuthorIds = await getInviteEligibleAuthorIds(userId);
  const [posts, people, communities, activities] = await Promise.all([
    prisma.posts.findMany({
      where: getVisiblePostsWhere(userId, inviteEligibleAuthorIds),
      orderBy: { created_at: "desc" },
      take: 20,
      include: feedPostInclude,
    }),
    prisma.users.findMany({
      where: {
        id: { not: userId },
        profiles: {
          isNot: null,
        },
      },
      include: {
        profiles: true,
      },
      orderBy: { created_at: "desc" },
      take: 4,
    }),
    prisma.communities.findMany({
      where: {
        visibility: community_visibility.PUBLIC,
      },
      orderBy: { created_at: "desc" },
      take: 4,
      include: {
        _count: {
          select: {
            community_members: true,
          },
        },
      },
    }),
    prisma.activities.findMany({
      where: {
        status: activity_status.OPEN,
        start_time: {
          gte: new Date(),
        },
        activity_participants: {
          some: {
            user_id: userId,
          },
        },
      },
      orderBy: { start_time: "asc" },
      take: 4,
      include: {
        _count: {
          select: {
            activity_participants: true,
          },
        },
      },
    }),
  ]);

  return {
    posts,
    people,
    communities,
    activities,
  };
}

async function getProfilePageDataForTarget(viewerId: string, targetUserId: string) {
  const inviteEligibleAuthorIds = await getInviteEligibleAuthorIds(viewerId);
  const [user, posts, likedPostRows, savedPostRows, followerRows, followingRows, viewerFollow] = await Promise.all([
    prisma.users.findUnique({
      where: { id: targetUserId },
      include: {
        profiles: true,
        user_interests: {
          include: {
            interests: true,
          },
        },
        user_vibe_tags: {
          include: {
            vibe_tags: true,
          },
        },
        communities: {
          include: {
            _count: {
              select: {
                community_members: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
        community_members: {
          include: {
            communities: {
              include: {
                _count: {
                  select: {
                    community_members: true,
                  },
                },
              },
            },
          },
          orderBy: { joined_at: "desc" },
        },
        activities: {
          include: {
            communities: true,
            _count: {
              select: {
                activity_participants: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
        activity_participants: {
          include: {
            activities: {
              include: {
                communities: true,
                _count: {
                  select: {
                    activity_participants: true,
                  },
                },
              },
            },
          },
          orderBy: { joined_at: "desc" },
        },
      },
    }),
    prisma.posts.findMany({
      where: getVisiblePostsWhere(viewerId, inviteEligibleAuthorIds, {
        author_id: targetUserId,
      }),
      include: feedPostInclude,
      orderBy: { created_at: "desc" },
      take: 40,
    }),
    prisma.post_likes.findMany({
      where: {
        user_id: targetUserId,
        posts: getVisiblePostsWhere(viewerId, inviteEligibleAuthorIds),
      },
      include: {
        posts: {
          include: feedPostInclude,
        },
      },
      orderBy: { created_at: "desc" },
      take: 20,
    }),
    prisma.post_saves.findMany({
      where: {
        user_id: targetUserId,
        posts: getVisiblePostsWhere(viewerId, inviteEligibleAuthorIds),
      },
      include: {
        posts: {
          include: feedPostInclude,
        },
      },
      orderBy: { created_at: "desc" },
      take: 20,
    }),
    prisma.post_likes.findMany({
      where: {
        user_id: { not: targetUserId },
        posts: {
          author_id: targetUserId,
        },
      },
      distinct: ["user_id"],
      select: {
        user_id: true,
      },
    }),
    prisma.follows.findMany({
      where: {
        following_id: targetUserId,
      },
      select: {
        follower_id: true,
      },
    }),
    prisma.follows.findMany({
      where: {
        follower_id: targetUserId,
      },
      select: {
        following_id: true,
      },
    }),
    viewerId === targetUserId
      ? Promise.resolve(null)
      : prisma.follows.findUnique({
          where: {
            follower_id_following_id: {
              follower_id: viewerId,
              following_id: targetUserId,
            },
          },
        }),
  ]);

  if (!user) {
    return null;
  }

  const joinedCommunities = user.community_members.map((membership) => membership.communities);
  const joinedActivities = user.activity_participants.map((participant) => participant.activities);

  const communities = [
    ...user.communities,
    ...joinedCommunities.filter(
      (community) => !user.communities.some((ownedCommunity) => ownedCommunity.id === community.id),
    ),
  ];

  const activities = [
    ...user.activities,
    ...joinedActivities.filter(
      (activity) => !user.activities.some((createdActivity) => createdActivity.id === activity.id),
    ),
  ];

  return {
    user: {
      ...user,
      profile: user.profiles,
      isFollowedByViewer: Boolean(viewerFollow),
    },
    posts,
    likedPosts: likedPostRows.map((row) => row.posts),
    savedPosts: savedPostRows.map((row) => row.posts),
    communities,
    activities,
    stats: {
      posts: posts.length,
      followers: followerRows.length,
      following: followingRows.length,
      communities: communities.length,
      activities: activities.length,
    },
  };
}

export async function getProfilePageData(userId: string) {
  return getProfilePageDataForTarget(userId, userId);
}

export async function getProfilePageDataByUsername(viewerId: string, username: string) {
  const target = await prisma.users.findUnique({
    where: {
      username: username.toLowerCase(),
    },
    select: {
      id: true,
    },
  });

  if (!target) {
    return null;
  }

  return getProfilePageDataForTarget(viewerId, target.id);
}

export async function getMessagesPageData(userId: string) {
  const contacts = await prisma.users.findMany({
    where: {
      id: { not: userId },
      profiles: {
        isNot: null,
      },
    },
    include: {
      profiles: true,
    },
    orderBy: { created_at: "desc" },
    take: 8,
  });

  return {
    contacts: contacts.map((contact) => ({
      id: contact.id,
      username: contact.username,
      profile: contact.profiles,
    })),
  };
}

export async function getActivityPageData(userId: string) {
  const [notifications, people, communities, activities] = await Promise.all([
    prisma.notifications.findMany({
      where: {
        user_id: userId,
      },
      include: {
        users_notifications_actor_idTousers: {
          include: {
            profiles: true,
          },
        },
        posts: true,
        communities: true,
        activities: true,
      },
      orderBy: { created_at: "desc" },
      take: 20,
    }),
    prisma.users.findMany({
      where: {
        id: { not: userId },
        profiles: {
          isNot: null,
        },
      },
      include: {
        profiles: true,
      },
      orderBy: { created_at: "desc" },
      take: 6,
    }),
    prisma.communities.findMany({
      orderBy: { created_at: "desc" },
      take: 4,
    }),
    prisma.activities.findMany({
      orderBy: { created_at: "desc" },
      take: 4,
    }),
  ]);

  return {
    notifications,
    people: people.map((person) => ({
      id: person.id,
      username: person.username,
      profile: person.profiles,
    })),
    communities,
    activities,
  };
}

export async function getCommunitiesPageData(userId: string) {
  const [ownedCommunities, joinedMemberships, discoverCommunities] = await Promise.all([
    prisma.communities.findMany({
      where: {
        owner_id: userId,
      },
      orderBy: { created_at: "desc" },
      include: {
        _count: {
          select: {
            community_members: true,
          },
        },
      },
    }),
    prisma.community_members.findMany({
      where: {
        user_id: userId,
      },
      include: {
        communities: {
          include: {
            _count: {
              select: {
                community_members: true,
              },
            },
          },
        },
      },
      orderBy: { joined_at: "desc" },
    }),
    prisma.communities.findMany({
      where: {
        visibility: community_visibility.PUBLIC,
      },
      orderBy: { created_at: "desc" },
      take: 8,
      include: {
        _count: {
          select: {
            community_members: true,
          },
        },
      },
    }),
  ]);

  const joinedCommunities = joinedMemberships
    .map((membership) => membership.communities)
    .filter((community) => community.owner_id !== userId);

  return {
    ownedCommunities,
    joinedCommunities,
    discoverCommunities,
  };
}
