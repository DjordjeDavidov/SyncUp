"use server";

import { Prisma } from "@/lib/prisma-generated";
import { activity_status, community_visibility, invite_visibility } from "@/lib/prisma-generated";
import { getCommunityCategoryLabel } from "@/lib/community-categories";
import { prisma } from "@/lib/prisma";
import {
  ensureCommunityMemberLastReadAtColumn,
  ensureDirectMessageImageColumns,
  ensureDirectThreadHiddenAtColumn,
  ensureDirectThreadLastReadAtColumn,
} from "@/server/chat-read-state";
import { isUserBlocked } from "@/server/direct-messages";
import { ensureCommunityMessageInteractionSchema, ensureDirectMessageInteractionSchema } from "@/server/message-interaction-schema";
import { formatDistanceToNow } from "@/lib/utils";

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

  const [posts, currentUser] = await Promise.all([
    prisma.posts.findMany({
      where: getVisiblePostsWhere(userId, inviteEligibleAuthorIds),
      orderBy: { created_at: "desc" },
      take: 20,
      include: feedPostInclude,
    }),
    prisma.users.findUnique({
      where: { id: userId },
      include: {
        profiles: true,
        user_interests: { select: { interest_id: true } },
        user_vibe_tags: { select: { vibe_tag_id: true } },
        user_activity_preferences: { select: { category_id: true } },
        community_members: { select: { community_id: true } },
      },
    }),
  ]);

  if (!currentUser) {
    throw new Error("Current user not found.");
  }

  const userCity = currentUser.profiles?.city || null;
  const userCountry = currentUser.profiles?.country || null;
  const userInterestIds = currentUser.user_interests.map((interest) => interest.interest_id);
  const userVibeTagIds = currentUser.user_vibe_tags.map((tag) => tag.vibe_tag_id);
  const userActivityCategoryIds = currentUser.user_activity_preferences.map((pref) => pref.category_id);
  const joinedCommunityIds = currentUser.community_members.map((membership) => membership.community_id);

  const peopleFilterOr: Prisma.usersWhereInput[] = [];
  if (userCity) {
    peopleFilterOr.push({ profiles: { city: userCity } });
  }
  if (userCountry) {
    peopleFilterOr.push({ profiles: { country: userCountry } });
  }
  if (userInterestIds.length > 0) {
    peopleFilterOr.push({ user_interests: { some: { interest_id: { in: userInterestIds } } } });
  }
  if (userVibeTagIds.length > 0) {
    peopleFilterOr.push({ user_vibe_tags: { some: { vibe_tag_id: { in: userVibeTagIds } } } });
  }
  if (joinedCommunityIds.length > 0) {
    peopleFilterOr.push({ community_members: { some: { community_id: { in: joinedCommunityIds } } } });
  }

  const hasUserPreferences = userInterestIds.length > 0 || userVibeTagIds.length > 0;

  // Community recommendation logic:
  // 1. If user has interests or vibe tags, fetch communities that match at least one of them, ordered by popularity (member count).
  // 2. Otherwise, fetch all public communities ordered by popularity.
  // 3. Score each community based on: interest matches (3pts each), vibe matches (2pts each), location match (4pts city, 1pt country), popularity bonus (min(members/25, 2)).
  // 4. Filter to communities with score >=1 (to avoid irrelevant), sort by score desc, take top 4.
  // 5. If fewer than 4, add popular communities not already selected to fill up to 4.
  // This ensures relevant communities are prioritized, with sensible fallbacks to popular ones.
  const communityWhere: Prisma.communitiesWhereInput = {
    visibility: community_visibility.PUBLIC,
    owner_id: { not: userId },
    community_members: {
      none: { user_id: userId },
    },
  };

  if (hasUserPreferences) {
    communityWhere.OR = [
      ...(userInterestIds.length > 0
        ? [{ community_interests: { some: { interest_id: { in: userInterestIds } } } }]
        : []),
      ...(userVibeTagIds.length > 0
        ? [{ community_vibe_tags: { some: { vibe_tag_id: { in: userVibeTagIds } } } }]
        : []),
    ];
  }

  const [peopleCandidates, communityCandidates, activityCandidates] = await Promise.all([
    prisma.users.findMany({
      where: {
        id: { not: userId },
        profiles: { isNot: null },
        OR: peopleFilterOr.length > 0 ? peopleFilterOr : [{ profiles: { isNot: null } }],
      },
      include: {
        profiles: true,
        user_interests: true,
        user_vibe_tags: true,
        community_members: {
          select: {
            community_id: true,
          },
        },
      },
      take: 40,
    }),
    prisma.communities.findMany({
      where: communityWhere,
      include: {
        _count: {
          select: {
            community_members: true,
          },
        },
        community_interests: {
          select: {
            interest_id: true,
          },
        },
        community_vibe_tags: {
          select: {
            vibe_tag_id: true,
          },
        },
      },
      orderBy: {
        community_members: {
          _count: "desc",
        },
      },
      take: 40,
    }),
    prisma.activities.findMany({
      where: {
        status: activity_status.OPEN,
        start_time: {
          gte: new Date(),
        },
        activity_participants: {
          none: {
            user_id: userId,
          },
        },
        OR: [
          { community_id: null },
          { communities: { visibility: community_visibility.PUBLIC } },
          ...(joinedCommunityIds.length > 0
            ? [{ community_id: { in: joinedCommunityIds } }]
            : []),
        ],
      },
      orderBy: { start_time: "asc" },
      take: 50,
      include: {
        _count: {
          select: {
            activity_participants: true,
          },
        },
        communities: true,
      },
    }),
  ]);

  const people = peopleCandidates
    .map((person) => {
      const interestMatchCount = person.user_interests.filter((interest) =>
        userInterestIds.includes(interest.interest_id),
      ).length;
      const vibeMatchCount = person.user_vibe_tags.filter((tag) =>
        userVibeTagIds.includes(tag.vibe_tag_id),
      ).length;
      const sharedCommunityCount = person.community_members.filter((membership) =>
        joinedCommunityIds.includes(membership.community_id),
      ).length;
      const sameCity = person.profiles?.city && userCity && person.profiles.city === userCity;
      const sameCountry = person.profiles?.country && userCountry && person.profiles.country === userCountry;

      return {
        id: person.id,
        username: person.username,
        profiles: person.profiles,
        score:
          interestMatchCount * 3 +
          vibeMatchCount * 2 +
          sharedCommunityCount * 4 +
          (sameCity ? 4 : sameCountry ? 1 : 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ score, ...person }) => person);

  let communities = communityCandidates
    .map((community) => {
      const interestMatchCount = community.community_interests.filter((interest) =>
        userInterestIds.includes(interest.interest_id),
      ).length;
      const vibeMatchCount = community.community_vibe_tags.filter((tag) =>
        userVibeTagIds.includes(tag.vibe_tag_id),
      ).length;
      const sameCity = community.city && userCity && community.city === userCity;
      const sameCountry = community.country && userCountry && community.country === userCountry;

      return {
        ...community,
        score:
          interestMatchCount * 3 +
          vibeMatchCount * 2 +
          (sameCity ? 4 : sameCountry ? 1 : 0) +
          Math.min(community._count.community_members / 25, 2),
      };
    })
    .filter((community) => community.score >= 1) // Only include communities with at least minimal relevance
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ score, ...community }) => community);

  // Fallback: if fewer than 4 communities, add popular ones not already selected
  if (communities.length < 4) {
    const selectedIds = communities.map((c) => c.id);
    const additionalCommunities = await prisma.communities.findMany({
      where: {
        visibility: community_visibility.PUBLIC,
        owner_id: { not: userId },
        community_members: {
          none: { user_id: userId },
        },
        id: { notIn: selectedIds },
      },
      include: {
        _count: {
          select: {
            community_members: true,
          },
        },
        community_interests: {
          select: {
            interest_id: true,
          },
        },
        community_vibe_tags: {
          select: {
            vibe_tag_id: true,
          },
        },
      },
      orderBy: {
        community_members: {
          _count: "desc",
        },
      },
      take: 4 - communities.length,
    });

    const scoredAdditional = additionalCommunities.map((community) => {
      const interestMatchCount = community.community_interests.filter((interest) =>
        userInterestIds.includes(interest.interest_id),
      ).length;
      const vibeMatchCount = community.community_vibe_tags.filter((tag) =>
        userVibeTagIds.includes(tag.vibe_tag_id),
      ).length;
      const sameCity = community.city && userCity && community.city === userCity;
      const sameCountry = community.country && userCountry && community.country === userCountry;

      return {
        ...community,
        score:
          interestMatchCount * 3 +
          vibeMatchCount * 2 +
          (sameCity ? 4 : sameCountry ? 1 : 0) +
          Math.min(community._count.community_members / 25, 2),
      };
    });

    communities = [...communities, ...scoredAdditional];
  }

  const activities = activityCandidates
    .map((activity) => {
      const sameCity = activity.city && userCity && activity.city === userCity;
      const sameCountry = activity.country && userCountry && activity.country === userCountry;
      const categoryMatch =
        activity.category_id && userActivityCategoryIds.includes(activity.category_id);
      const communityMatch =
        activity.community_id && joinedCommunityIds.includes(activity.community_id);

      return {
        ...activity,
        score:
          (sameCity ? 4 : sameCountry ? 1 : 0) +
          (categoryMatch ? 4 : 0) +
          (communityMatch ? 3 : 0) +
          Math.min(activity._count.activity_participants / 15, 2),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.start_time.getTime() - b.start_time.getTime();
    })
    .slice(0, 4)
    .map(({ score, ...activity }) => activity);

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
          select: {
            community_id: true,
            user_id: true,
            role: true,
            joined_at: true,
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
  await ensureDirectMessageImageColumns();

  const [threads, communityChats] = await Promise.all([
    prisma.direct_message_threads.findMany({
      where: {
        participants: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        participants: {
          select: {
            user_id: true,
            users: {
              include: {
                profiles: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            created_at: "asc",
          },
          take: 40,
        },
      },
      orderBy: {
        updated_at: "desc",
      },
      take: 12,
    }),
    prisma.communities.findMany({
      where: {
        community_members: {
          some: {
            user_id: userId,
          },
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        cover_url: true,
        _count: {
          select: {
            community_members: true,
          },
        },
      },
      orderBy: { updated_at: "desc" },
      take: 12,
    }),
  ]);

  return {
    conversations: threads
      .map((thread) => {
        const participant = thread.participants.find((item) => item.user_id !== userId)?.users;

        if (!participant) {
          return null;
        }

        return {
          id: thread.id,
          participant: {
            id: participant.id,
            username: participant.username,
            profile: participant.profiles,
          },
          messages: thread.messages.map((message) => ({
            id: message.id,
            senderId: message.sender_id,
            text: message.message,
            createdAt: message.created_at,
          })),
        };
      })
      .filter((thread): thread is NonNullable<typeof thread> => Boolean(thread)),
    communityChats: communityChats.map((community) => ({
      id: community.id,
      slug: community.slug,
      name: community.name,
      coverUrl: community.cover_url,
      memberCount: community._count.community_members,
    })),
  };
}

export async function getCommunityChatPageData(userId: string, communitySlug: string) {
  const community = await prisma.communities.findUnique({
    where: { slug: communitySlug },
    include: {
      users: {
        include: {
          profiles: true,
        },
      },
      community_chat: {
        include: {
          messages: {
            orderBy: { created_at: "asc" },
            include: {
              users: {
                include: {
                  profiles: true,
                },
              },
            },
          },
        },
      },
      community_members: {
        where: {
          user_id: userId,
        },
        select: {
          role: true,
        },
      },
      _count: {
        select: {
          community_members: true,
        },
      },
    },
  });

  if (!community) {
    return null;
  }

  const isMember = community.community_members.length > 0;
  const canChat = isMember;

  return {
    community: {
      id: community.id,
      slug: community.slug,
      name: community.name,
      description: community.description,
      visibility: community.visibility,
      coverUrl: community.cover_url,
      owner: {
        id: community.users.id,
        username: community.users.username,
        profile: community.users.profiles,
      },
      memberCount: community._count.community_members,
      isMember,
      canChat,
    },
    messages:
      community.community_chat?.messages.map((message) => ({
        id: message.id,
        sender: {
          id: message.users.id,
          username: message.users.username,
          profile: message.users.profiles,
        },
        text: message.message,
        createdAt: message.created_at,
      })) ?? [],
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
        users_notifications_related_user_idTousers: {
          include: {
            profiles: true,
          },
        },
        posts: {
          select: {
            id: true,
            title: true,
          },
        },
        communities: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        activities: {
          select: {
            id: true,
            title: true,
          },
        },
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
  const [ownedCommunities, joinedMemberships, userInterests, userVibeTags, recommendedCommunities] = await Promise.all([
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
      select: {
        community_id: true,
        user_id: true,
        role: true,
        joined_at: true,
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
    prisma.user_interests.findMany({
      where: { user_id: userId },
      select: { interest_id: true },
    }),
    prisma.user_vibe_tags.findMany({
      where: { user_id: userId },
      select: { vibe_tag_id: true },
    }),
    prisma.communities.findMany({
      where: {
        visibility: community_visibility.PUBLIC,
        owner_id: { not: userId },
        community_members: {
          none: { user_id: userId },
        },
      },
      include: {
        _count: {
          select: {
            community_members: true,
          },
        },
        community_interests: {
          select: { interest_id: true },
        },
        community_vibe_tags: {
          select: { vibe_tag_id: true },
        },
      },
      take: 50,
    }),
  ]);

  const joinedCommunities = joinedMemberships
    .map((membership) => membership.communities)
    .filter((community) => community.owner_id !== userId);

  // Score and rank recommended communities based on user interests and vibe tags
  const userInterestIds = new Set(userInterests.map((ui) => ui.interest_id));
  const userVibeTagIds = new Set(userVibeTags.map((uvt) => uvt.vibe_tag_id));

  const rankedCommunities = recommendedCommunities
    .map((community) => {
      let score = 0;

      // Bonus for matching interests
      const interestMatches = community.community_interests.filter((ci) =>
        userInterestIds.has(ci.interest_id),
      ).length;
      score += interestMatches * 3;

      // Bonus for matching vibe tags
      const vibeMatches = community.community_vibe_tags.filter((cvt) =>
        userVibeTagIds.has(cvt.vibe_tag_id),
      ).length;
      score += vibeMatches * 2;

      // Slight bonus for active communities (more members = more active)
      score += Math.min(community._count.community_members / 20, 2);

      return { ...community, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ score, ...community }) => community);

  // If not enough personalized recommendations, fill with recently created communities
  if (rankedCommunities.length < 4) {
    const additionalCommunities = await prisma.communities.findMany({
      where: {
        visibility: community_visibility.PUBLIC,
        owner_id: { not: userId },
        community_members: {
          none: { user_id: userId },
        },
        id: {
          notIn: rankedCommunities.map((c) => c.id),
        },
      },
      orderBy: { created_at: "desc" },
      take: 8 - rankedCommunities.length,
      include: {
        _count: {
          select: {
            community_members: true,
          },
        },
        community_interests: {
          select: { interest_id: true },
        },
        community_vibe_tags: {
          select: { vibe_tag_id: true },
        },
      },
    });

    rankedCommunities.push(...additionalCommunities);
  }

  return {
    ownedCommunities,
    joinedCommunities,
    discoverCommunities: rankedCommunities,
  };
}

type ExploreTab = "all" | "people" | "communities" | "events" | "photos";
type ExploreTheme = "all" | "outdoor" | "social" | "study-coding" | "free-weekend";

type ExploreGridItem =
  | {
      type: "photo";
      id: string;
      href: string;
      imageUrl: string;
      title: string;
      subtitle: string;
      description: string;
      meta: string[];
      tags: string[];
    }
  | {
      type: "community";
      id: string;
      href: string;
      imageUrl: string | null;
      title: string;
      subtitle: string;
      description: string;
      meta: string[];
      tags: string[];
    }
  | {
      type: "event";
      id: string;
      href: string;
      imageUrl: string | null;
      title: string;
      subtitle: string;
      description: string;
      meta: string[];
      tags: string[];
      isPublic: boolean;
      isFree: boolean;
    }
  | {
      type: "person";
      id: string;
      href: string;
      imageUrl: string | null;
      title: string;
      subtitle: string;
      description: string;
      meta: string[];
      tags: string[];
    };

export type ExplorePageData = {
  items: ExploreGridItem[];
  total: number;
  hasMore: boolean;
  currentPage: number;
  searchQuery: string;
  activeTab: ExploreTab;
  activeTheme: ExploreTheme;
  trendingCommunities: {
    id: string;
    name: string;
    slug: string;
    coverUrl: string | null;
    memberCount: number;
    categoryLabel: string;
  }[];
  happeningSoon: {
    id: string;
    title: string;
    imageUrl: string | null;
    location: string;
    startsAt: Date;
    participantCount: number;
  }[];
  peopleYouMayKnow: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
    bio: string;
    context: string;
  }[];
};

const EXPLORE_PAGE_SIZE = 24;

function getExploreThemeTags(values: (string | null | undefined)[]) {
  const joined = values
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const tags: ExploreTheme[] = ["all"];

  if (/(hike|photo|travel|outdoor|nature|walk)/.test(joined)) {
    tags.push("outdoor");
  }

  if (/(coffee|movie|board|basket|meetup|social|music)/.test(joined)) {
    tags.push("social");
  }

  if (/(coding|study|language|tech|design)/.test(joined)) {
    tags.push("study-coding");
  }

  return tags;
}

function includesSearch(haystack: string[], searchQuery: string) {
  if (!searchQuery) {
    return true;
  }

  return haystack.join(" ").toLowerCase().includes(searchQuery.toLowerCase());
}

function mixExploreItems(itemsByType: Record<ExploreGridItem["type"], ExploreGridItem[]>) {
  const pattern: ExploreGridItem["type"][] = [
    "photo",
    "photo",
    "community",
    "photo",
    "event",
    "photo",
    "person",
    "photo",
    "community",
    "event",
    "photo",
    "person",
  ];
  const cursors: Record<ExploreGridItem["type"], number> = {
    photo: 0,
    community: 0,
    event: 0,
    person: 0,
  };
  const mixed: ExploreGridItem[] = [];
  let exhaustedPasses = 0;

  while (exhaustedPasses < pattern.length) {
    let addedInLoop = false;

    for (const type of pattern) {
      const nextItem = itemsByType[type][cursors[type]];

      if (!nextItem) {
        exhaustedPasses += 1;
        continue;
      }

      cursors[type] += 1;
      mixed.push(nextItem);
      addedInLoop = true;
    }

    if (!addedInLoop) {
      break;
    }

    exhaustedPasses = 0;
  }

  return mixed;
}

export async function getExplorePageData(
  userId: string,
  options?: {
    tab?: string;
    theme?: string;
    query?: string;
    page?: number;
  },
): Promise<ExplorePageData> {
  const activeTab: ExploreTab =
    options?.tab === "people" ||
    options?.tab === "communities" ||
    options?.tab === "events" ||
    options?.tab === "photos"
      ? options.tab
      : "all";
  const activeTheme: ExploreTheme =
    options?.theme === "outdoor" ||
    options?.theme === "social" ||
    options?.theme === "study-coding" ||
    options?.theme === "free-weekend"
      ? options.theme
      : "all";
  const currentPage = Math.max(1, options?.page ?? 1);
  const searchQuery = (options?.query ?? "").trim();

  const currentUser = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      profiles: true,
      user_interests: { select: { interest_id: true } },
      user_vibe_tags: { select: { vibe_tag_id: true } },
      user_activity_preferences: { select: { category_id: true } },
      community_members: { select: { community_id: true } },
    },
  });

  const userInterestIds = new Set(currentUser?.user_interests.map((item) => item.interest_id) ?? []);
  const userVibeIds = new Set(currentUser?.user_vibe_tags.map((item) => item.vibe_tag_id) ?? []);
  const userActivityCategoryIds = new Set(currentUser?.user_activity_preferences.map((item) => item.category_id) ?? []);
  const joinedCommunityIds = new Set(currentUser?.community_members.map((item) => item.community_id) ?? []);
  const userCity = currentUser?.profiles?.city ?? null;
  const userCountry = currentUser?.profiles?.country ?? null;
  const now = new Date();

  const [photoPosts, communities, activities, people] = await Promise.all([
    prisma.posts.findMany({
      where: {
        image_url: { not: null },
        OR: [
          { post_type: { in: ["STANDARD_POST", "COMMUNITY_POST", "ACTIVITY_POST"] } },
          { post_type: "INVITE_POST", invite_visibility: invite_visibility.PUBLIC },
        ],
      },
      include: {
        users: {
          include: {
            profiles: true,
          },
        },
        communities: true,
        activities: true,
        post_likes: { select: { user_id: true } },
        post_comments: { select: { id: true } },
      },
      orderBy: { created_at: "desc" },
      take: 80,
    }),
    prisma.communities.findMany({
      where: {
        visibility: community_visibility.PUBLIC,
      },
      include: {
        _count: {
          select: {
            community_members: true,
            posts: true,
          },
        },
        community_interests: { select: { interest_id: true } },
        community_vibe_tags: { select: { vibe_tag_id: true } },
      },
      take: 24,
    }),
    prisma.activities.findMany({
      where: {
        invite_visibility: invite_visibility.PUBLIC,
        status: activity_status.OPEN,
        start_time: { gte: now },
      },
      include: {
        communities: true,
        users: {
          include: {
            profiles: true,
          },
        },
        activity_categories: true,
        _count: {
          select: {
            activity_participants: true,
          },
        },
      },
      take: 24,
    }),
    prisma.users.findMany({
      where: {
        id: { not: userId },
        profiles: {
          is: {
            profile_visibility: "PUBLIC",
          },
        },
      },
      include: {
        profiles: true,
        user_interests: { select: { interest_id: true } },
        user_vibe_tags: { select: { vibe_tag_id: true } },
        community_members: { select: { community_id: true } },
      },
      take: 24,
    }),
  ]);

  const rankedPhotos = photoPosts
    .map((post) => {
      const sameCity = Boolean(post.users.profiles?.city && userCity && post.users.profiles.city === userCity);
      const sameCountry = Boolean(post.users.profiles?.country && userCountry && post.users.profiles.country === userCountry);
      const joinedCommunityBoost = post.community_id && joinedCommunityIds.has(post.community_id) ? 4 : 0;
      const likesScore = post.post_likes.length * 2;
      const commentsScore = post.post_comments.length * 3;
      const freshnessScore = Math.max(0, 18 - Math.floor((now.getTime() - post.created_at.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        score: likesScore + commentsScore + freshnessScore + joinedCommunityBoost + (sameCity ? 4 : sameCountry ? 1 : 0),
        card: {
          type: "photo" as const,
          id: post.id,
          href: `/posts/${post.id}`,
          imageUrl: post.image_url ?? post.activities?.image_url ?? createFallbackExploreImage(post.title ?? post.content, "photo"),
          title: post.title ?? (post.communities?.name ? `${post.communities.name} highlight` : "Photo post"),
          subtitle: `${post.users.profiles?.full_name ?? post.users.username} · @${post.users.username}`,
          description: post.content,
          meta: [
            `${post.post_likes.length} likes`,
            `${post.post_comments.length} comments`,
            post.communities?.name ?? post.activities?.title ?? "Public post",
          ],
          tags: getExploreThemeTags([
            post.title,
            post.content,
            post.communities?.name,
            post.communities?.category,
            post.activities?.title,
            post.location_text,
          ]),
        },
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((item) => item.card);

  const rankedCommunities = communities
    .map((community) => {
      const sharedInterestCount = community.community_interests.filter((item) => userInterestIds.has(item.interest_id)).length;
      const sharedVibeCount = community.community_vibe_tags.filter((item) => userVibeIds.has(item.vibe_tag_id)).length;
      const sameCity = Boolean(community.city && userCity && community.city === userCity);
      const sameCountry = Boolean(community.country && userCountry && community.country === userCountry);
      const score =
        community._count.community_members +
        community._count.posts * 1.5 +
        sharedInterestCount * 8 +
        sharedVibeCount * 5 +
        (sameCity ? 12 : sameCountry ? 3 : 0);

      return {
        score,
        card: {
          type: "community" as const,
          id: community.id,
          href: `/communities/${community.slug}`,
          imageUrl: community.cover_url ?? createFallbackExploreImage(community.name, "community"),
          title: community.name,
          subtitle: getCommunityCategoryLabel(community.category, community.custom_category) ?? "Open community",
          description: community.description ?? "People, plans, and conversation around a shared interest.",
          meta: [
            `${community._count.community_members} members`,
            [community.city, community.country].filter(Boolean).join(", ") || "Open location",
          ],
          tags: getExploreThemeTags([community.name, community.description, community.category, community.custom_category]),
        },
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((item) => item.card);

  const rankedEvents = activities
    .map((activity) => {
      const sameCity = Boolean(activity.city && userCity && activity.city === userCity);
      const sameCountry = Boolean(activity.country && userCountry && activity.country === userCountry);
      const categoryMatch = Boolean(activity.category_id && userActivityCategoryIds.has(activity.category_id));
      const soonScore = Math.max(0, 20 - Math.floor((activity.start_time.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const score = activity._count.activity_participants * 3 + soonScore + (categoryMatch ? 8 : 0) + (sameCity ? 10 : sameCountry ? 2 : 0);

      return {
        score,
        card: {
          type: "event" as const,
          id: activity.id,
          href: `/activity/${activity.id}`,
          imageUrl: activity.image_url ?? activity.communities?.cover_url ?? createFallbackExploreImage(activity.title, "event"),
          title: activity.title,
          subtitle: formatDistanceToNow(activity.start_time),
          description: activity.description ?? "Open public plan on SyncUp.",
          meta: [
            [activity.location_text, activity.city, activity.country].filter(Boolean).join(", "),
            `${activity._count.activity_participants} going`,
          ],
          tags: [
            ...getExploreThemeTags([activity.title, activity.description, activity.location_text, activity.activity_categories?.name]),
            ...(activity.start_time.getTime() - now.getTime() <= 1000 * 60 * 60 * 24 * 7 ? (["free-weekend"] as ExploreTheme[]) : []),
          ],
          isPublic: activity.invite_visibility === invite_visibility.PUBLIC,
          isFree: true,
        },
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((item) => item.card);

  const rankedPeople = people
    .map((person) => {
      const sharedInterests = person.user_interests.filter((item) => userInterestIds.has(item.interest_id)).length;
      const sharedVibes = person.user_vibe_tags.filter((item) => userVibeIds.has(item.vibe_tag_id)).length;
      const sharedCommunities = person.community_members.filter((item) => joinedCommunityIds.has(item.community_id)).length;
      const sameCity = Boolean(person.profiles?.city && userCity && person.profiles.city === userCity);
      const sameCountry = Boolean(person.profiles?.country && userCountry && person.profiles.country === userCountry);
      const score = sharedInterests * 6 + sharedVibes * 4 + sharedCommunities * 7 + (sameCity ? 8 : sameCountry ? 2 : 0);

      return {
        score,
        card: {
          type: "person" as const,
          id: person.id,
          href: `/profile/${person.username}`,
          imageUrl: person.profiles?.avatar_url ?? createFallbackExploreImage(person.username, "person"),
          title: person.profiles?.full_name ?? person.username,
          subtitle: `@${person.username}`,
          description: person.profiles?.bio ?? "Open to meeting people with similar interests.",
          meta: [
            sharedCommunities > 0 ? `${sharedCommunities} shared communities` : sameCity ? person.profiles?.city ?? "Nearby" : "Discoverable profile",
            sharedInterests > 0 ? `${sharedInterests} shared interests` : person.profiles?.country ?? "SyncUp",
          ],
          tags: getExploreThemeTags([person.profiles?.bio, person.profiles?.city, person.profiles?.country]),
        },
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((item) => item.card);

  const allCards = {
    photo: rankedPhotos.filter((item) => includesSearch([item.title, item.subtitle, item.description, ...item.meta], searchQuery)),
    community: rankedCommunities.filter((item) => includesSearch([item.title, item.subtitle, item.description, ...item.meta], searchQuery)),
    event: rankedEvents.filter((item) => includesSearch([item.title, item.subtitle, item.description, ...item.meta], searchQuery)),
    person: rankedPeople.filter((item) => includesSearch([item.title, item.subtitle, item.description, ...item.meta], searchQuery)),
  };

  const themedCards = Object.fromEntries(
    Object.entries(allCards).map(([type, items]) => [
      type,
      activeTheme === "all" ? items : items.filter((item) => item.tags.includes(activeTheme)),
    ]),
  ) as Record<ExploreGridItem["type"], ExploreGridItem[]>;

  const filteredCards =
    activeTab === "all"
      ? mixExploreItems(themedCards)
      : activeTab === "photos"
        ? themedCards.photo
        : activeTab === "communities"
          ? themedCards.community
          : activeTab === "events"
            ? themedCards.event
            : themedCards.person;

  const total = filteredCards.length;
  const items = filteredCards.slice(0, currentPage * EXPLORE_PAGE_SIZE);

  return {
    items,
    total,
    hasMore: total > items.length,
    currentPage,
    searchQuery,
    activeTab,
    activeTheme,
    trendingCommunities: rankedCommunities.slice(0, 4).map((community) => ({
      id: community.id,
      name: community.title,
      slug: community.href.split("/").at(-1) ?? community.id,
      coverUrl: community.imageUrl,
      memberCount: Number(community.meta[0].split(" ")[0]) || 0,
      categoryLabel: community.subtitle,
    })),
    happeningSoon: rankedEvents.slice(0, 4).map((event) => ({
      id: event.id,
      title: event.title,
      imageUrl: event.imageUrl,
      location: event.meta[0] ?? "Open location",
      startsAt: activities.find((item) => item.id === event.id)?.start_time ?? now,
      participantCount: Number(event.meta[1]?.split(" ")[0]) || 0,
    })),
    peopleYouMayKnow: rankedPeople.slice(0, 4).map((person) => ({
      id: person.id,
      username: person.subtitle.replace(/^@/, ""),
      name: person.title,
      avatarUrl: person.imageUrl,
      bio: person.description,
      context: person.meta[0] ?? "Discoverable profile",
    })),
  };
}

function createFallbackExploreImage(seed: string, kind: "photo" | "community" | "event" | "person") {
  const tone =
    kind === "photo"
      ? ["#1d4ed8", "#06b6d4"]
      : kind === "community"
        ? ["#7c3aed", "#ec4899"]
        : kind === "event"
          ? ["#059669", "#38bdf8"]
          : ["#0f172a", "#6366f1"];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" role="img" aria-label="${seed}">
    <defs>
      <linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="${tone[0]}"/>
        <stop offset="100%" stop-color="${tone[1]}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="1000" fill="url(#g)"/>
    <circle cx="650" cy="180" r="150" fill="rgba(255,255,255,0.08)"/>
    <circle cx="180" cy="760" r="220" fill="rgba(255,255,255,0.06)"/>
    <text x="72" y="886" fill="rgba(255,255,255,0.86)" font-size="44" font-family="Arial, sans-serif">${seed
      .replace(/&/g, "&amp;")
      .slice(0, 28)}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ========================
   UNIFIED CHAT QUERIES
   ======================== */

export async function getUnifiedChatsData(userId: string) {
  const [hasDmReadState, hasCommunityReadState, hasDmHiddenState, hasDmMedia, _hasDmInteractions, _hasCommunityInteractions] = await Promise.all([
    ensureDirectThreadLastReadAtColumn(),
    ensureCommunityMemberLastReadAtColumn(),
    ensureDirectThreadHiddenAtColumn(),
    ensureDirectMessageImageColumns(),
    ensureDirectMessageInteractionSchema(),
    ensureCommunityMessageInteractionSchema(),
  ]);

  const [threads, communityChats] = await Promise.all([
    prisma.direct_message_threads.findMany({
      where: {
        participants: {
          some: hasDmHiddenState
            ? {
                user_id: userId,
                hidden_at: null,
              }
            : {
                user_id: userId,
              },
        },
      },
      include: {
        participants: hasDmReadState
          ? {
              select: {
                user_id: true,
                last_read_at: true,
                ...(hasDmHiddenState ? { hidden_at: true } : {}),
                users: {
                  include: {
                    profiles: true,
                  },
                },
              },
            }
          : {
              select: {
                user_id: true,
                ...(hasDmHiddenState ? { hidden_at: true } : {}),
                users: {
                  include: {
                    profiles: true,
                  },
                },
              },
            },
        messages: {
          orderBy: {
            created_at: "asc",
          },
          include: {
            users: {
              include: {
                profiles: true,
              },
            },
          },
        },
      },
      orderBy: {
        updated_at: "desc",
      },
      take: 50,
    }),
    prisma.communities.findMany({
      where: {
        community_members: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        community_chat: {
          include: {
            messages: {
              orderBy: { created_at: "asc" },
              include: {
                users: {
                  include: {
                    profiles: true,
                  },
                },
              },
            },
          },
        },
        users: {
          include: {
            profiles: true,
          },
        },
        _count: {
          select: {
            community_members: true,
          },
        },
        community_members: hasCommunityReadState
          ? {
              where: {
                user_id: userId,
              },
              select: {
                user_id: true,
                last_read_at: true,
              },
            }
          : {
              where: {
                user_id: userId,
              },
              select: {
                user_id: true,
              },
            },
      },
      orderBy: { updated_at: "desc" },
      take: 50,
    }),
  ]);

  const chats = [
    // Direct Messages
    ...threads
      .map((thread) => {
        const participant = thread.participants.find((item) => item.user_id !== userId)?.users;
        const lastMessage = thread.messages.at(-1);
        const currentParticipant = thread.participants.find((item) => item.user_id === userId);
        const currentParticipantLastReadAt =
          hasDmReadState &&
          currentParticipant &&
          "last_read_at" in currentParticipant
            ? currentParticipant.last_read_at
            : null;
        const unreadCount = thread.messages.filter(
          (message) => {
            if (message.sender_id === userId || !currentParticipantLastReadAt) {
              return false;
            }

            return message.created_at > currentParticipantLastReadAt;
          },
        ).length;

        if (!participant) {
          return null;
        }

        return {
          id: thread.id,
          type: "dm" as const,
          title: participant.profiles?.full_name ?? participant.username,
          avatar: participant.profiles?.avatar_url ?? null,
          lastMessage:
            lastMessage
              ? "is_deleted" in lastMessage && lastMessage.is_deleted
                ? "Deleted message"
                : hasDmMedia && "image_url" in lastMessage && lastMessage.image_url && !lastMessage.message
                ? "Sent an image"
                : lastMessage.message || null
              : null,
          lastMessageAt: lastMessage?.created_at ?? null,
          unreadCount,
          metadata: {
            username: participant.username,
          },
        };
      })
      .filter(Boolean),

    // Community Chats
    ...communityChats.map((community) => {
      const lastMessage = community.community_chat?.messages.at(-1);
      const membership = community.community_members[0];
      const membershipLastReadAt =
        hasCommunityReadState &&
        membership &&
        "last_read_at" in membership
          ? membership.last_read_at
          : null;
      const unreadCount =
        community.community_chat?.messages.filter((message) => {
          if (message.sender_id === userId || !membershipLastReadAt) {
            return false;
          }

          return message.created_at > membershipLastReadAt;
        }).length ?? 0;

      return {
        id: community.id,
        type: "community" as const,
        title: community.name,
        avatar: community.cover_url ?? null,
        lastMessage: lastMessage ? ("is_deleted" in lastMessage && lastMessage.is_deleted ? "Deleted message" : lastMessage.message) : null,
        lastMessageAt: lastMessage?.created_at ?? null,
        unreadCount,
        metadata: {
          slug: community.slug,
          memberCount: community._count.community_members,
          description: community.description,
          creator: community.users.profiles?.full_name ?? community.users.username,
          creatorId: community.users.id,
        },
      };
    }),
  ];

  return chats
    .filter((chat): chat is NonNullable<typeof chat> => chat !== null)
    .sort((left, right) => {
    const leftTime = left.lastMessageAt?.getTime() ?? 0;
    const rightTime = right.lastMessageAt?.getTime() ?? 0;

    return rightTime - leftTime;
    });
}

export async function getUnreadNavCounts(userId: string) {
  const [chats, activityUnreadCount] = await Promise.all([
    getUnifiedChatsData(userId),
    prisma.notifications.count({
      where: {
        user_id: userId,
        read: false,
      },
    }),
  ]);

  return {
    messagesUnreadCount: chats.reduce((total, chat) => total + (chat.unreadCount ?? 0), 0),
    activityUnreadCount,
  };
}

export async function getUnifiedChatDetails(userId: string, chatId: string) {
  const [hasDmReadState, hasDmMedia, hasDmHiddenState] = await Promise.all([
    ensureDirectThreadLastReadAtColumn(),
    ensureDirectMessageImageColumns(),
    ensureDirectThreadHiddenAtColumn(),
  ]);
  await Promise.all([
    ensureDirectMessageInteractionSchema(),
    ensureCommunityMessageInteractionSchema(),
  ]);

  // Try to find as a DM thread first
  const dmThread = await prisma.direct_message_threads.findUnique({
    where: { id: chatId },
    include: {
      participants: hasDmReadState
        ? {
            select: {
              user_id: true,
              last_read_at: true,
              ...(hasDmHiddenState ? { hidden_at: true } : {}),
              users: {
                include: {
                  profiles: true,
                },
              },
            },
          }
        : {
            select: {
              user_id: true,
              ...(hasDmHiddenState ? { hidden_at: true } : {}),
              users: {
                include: {
                  profiles: true,
                },
              },
            },
          },
      messages: {
        orderBy: { created_at: "asc" },
        include: {
          likes: {
            where: {
              user_id: userId,
            },
            select: {
              user_id: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
          reply_to_message: {
            select: {
              id: true,
              sender_id: true,
              message: true,
              image_url: true,
              is_deleted: true,
              users: {
                include: {
                  profiles: true,
                },
              },
            },
          },
          users: {
            include: {
              profiles: true,
            },
          },
        },
      },
    },
  });

  if (dmThread) {
    const currentParticipant = dmThread.participants.find((item) => item.user_id === userId);
    const participant = dmThread.participants.find((item) => item.user_id !== userId)?.users;
    const recipientParticipant = dmThread.participants.find((item) => item.user_id !== userId);
    const isMember = Boolean(currentParticipant);
    const isHidden =
      hasDmHiddenState &&
      currentParticipant &&
      "hidden_at" in currentParticipant
        ? Boolean(currentParticipant.hidden_at)
        : false;
    const recipientLastReadAt =
      hasDmReadState &&
      recipientParticipant &&
      "last_read_at" in recipientParticipant
        ? recipientParticipant.last_read_at
        : null;

    if (!participant || !isMember || isHidden) {
      return null;
    }

    const latestOutgoingMessage = [...dmThread.messages]
      .reverse()
      .find((message) => message.sender_id === userId);
    const currentParticipantLastReadAt =
      hasDmReadState &&
      currentParticipant &&
      "last_read_at" in currentParticipant
        ? currentParticipant.last_read_at
        : null;
    const firstUnreadMessageId =
      currentParticipantLastReadAt
        ? dmThread.messages.find(
            (message) =>
              message.sender_id !== userId &&
              message.created_at.getTime() > currentParticipantLastReadAt.getTime(),
          )?.id ?? null
        : null;
    const seenMessageId =
      recipientLastReadAt &&
      latestOutgoingMessage &&
      latestOutgoingMessage.created_at.getTime() <= recipientLastReadAt.getTime()
        ? latestOutgoingMessage.id
        : null;

    const blockedByUserId = await isUserBlocked(userId, participant.id);
    const isBlocked = Boolean(blockedByUserId);
    const sharedMedia = hasDmMedia
      ? [...dmThread.messages]
          .filter((message) => "image_url" in message && Boolean(message.image_url))
          .reverse()
          .map((message) => ({
            id: message.id,
            type: "image" as const,
            url: "image_url" in message ? message.image_url ?? "" : "",
            thumbnailUrl: "image_url" in message ? message.image_url ?? "" : "",
            createdAt: message.created_at,
          }))
          .filter((media) => Boolean(media.url))
      : [];

    return {
      type: "dm" as const,
      id: dmThread.id,
      title: participant.profiles?.full_name ?? participant.username,
      description: participant.profiles?.bio ?? undefined,
      avatar: participant.profiles?.avatar_url ?? null,
      messages: dmThread.messages.map((message) => ({
        id: message.id,
        senderId: message.sender_id,
        senderName: message.users.profiles?.full_name ?? message.users.username,
        senderAvatar: message.users.profiles?.avatar_url ?? null,
        text: message.message,
        imageUrl: hasDmMedia && "image_url" in message ? message.image_url ?? null : null,
        isDeleted: "is_deleted" in message ? message.is_deleted : false,
        likeCount: "_count" in message ? message._count.likes : 0,
        likedByCurrentUser: "likes" in message ? message.likes.length > 0 : false,
        replyTo: message.reply_to_message
          ? {
              id: message.reply_to_message.id,
              senderId: message.reply_to_message.sender_id,
              senderName:
                message.reply_to_message.users.profiles?.full_name ?? message.reply_to_message.users.username,
              text: message.reply_to_message.is_deleted ? "Deleted message" : message.reply_to_message.message,
              imageUrl: message.reply_to_message.is_deleted ? null : message.reply_to_message.image_url ?? null,
              isDeleted: message.reply_to_message.is_deleted,
            }
          : null,
        createdAt: message.created_at,
      })),
      initialScrollTargetMessageId: firstUnreadMessageId,
      seenMessageId,
      canChat: !isBlocked,
      accessNotice:
        blockedByUserId === userId
          ? "You blocked this person. Unblock them to send more messages."
          : isBlocked
            ? "You cannot message this person right now."
            : undefined,
      details: {
        type: "dm" as const,
        title: participant.profiles?.full_name ?? participant.username,
        description: participant.profiles?.bio ?? undefined,
        avatar: participant.profiles?.avatar_url ?? null,
        currentUserId: userId,
        sharedMedia,
        profileUsername: participant.username,
        profileBio: participant.profiles?.bio ?? undefined,
        profileLocation: [participant.profiles?.city, participant.profiles?.country].filter(Boolean).join(", ") || undefined,
        isBlocked,
        isBlockedByCurrentUser: blockedByUserId === userId,
      },
    };
  }

  // Try to find as a community chat
  const community = await prisma.communities.findUnique({
    where: { id: chatId },
    include: {
      community_chat: {
        include: {
          messages: {
            orderBy: { created_at: "asc" },
            include: {
              likes: {
                where: {
                  user_id: userId,
                },
                select: {
                  user_id: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                },
              },
              reply_to_message: {
                select: {
                  id: true,
                  sender_id: true,
                  message: true,
                  is_deleted: true,
                  users: {
                    include: {
                      profiles: true,
                    },
                  },
                },
              },
              users: {
                include: {
                  profiles: true,
                },
              },
            },
          },
        },
      },
      users: {
        include: {
          profiles: true,
        },
      },
      community_members: {
        where: { user_id: userId },
        select: {
          community_id: true,
          user_id: true,
          role: true,
          joined_at: true,
          users: {
            include: {
              profiles: true,
            },
          },
        },
      },
      _count: {
        select: {
          community_members: true,
        },
      },
    },
  });

  if (!community) {
    return null;
  }

  const isMember = community.community_members.length > 0;
  const canChat = isMember;
  const userRole = community.community_members[0]?.role;
  const membershipLastReadAt =
    community.community_members[0] &&
    "last_read_at" in community.community_members[0] &&
    community.community_members[0].last_read_at instanceof Date
      ? community.community_members[0].last_read_at
      : null;
  const firstUnreadCommunityMessageId =
    membershipLastReadAt
      ? community.community_chat?.messages.find(
          (message) =>
            message.sender_id !== userId &&
            message.created_at.getTime() > membershipLastReadAt.getTime(),
        )?.id ?? null
      : null;

  // Extract shared media from messages (placeholder - messages with image URLs)
  const sharedMedia = community.community_chat?.messages
    .filter((message) => message.message.includes("http") && /\.(jpg|jpeg|png|gif|webp)/i.test(message.message))
    .slice(-9) // Get last 9 media items
    .map((message) => {
      const urlMatch = message.message.match(/(https?:\/\/[^\s]+)/);
      return {
        id: message.id,
        type: "image" as const,
        url: urlMatch ? urlMatch[1] : "",
        createdAt: message.created_at,
      };
    }) ?? [];

  // Get all members
  const allMembers = await prisma.community_members.findMany({
    where: { community_id: chatId },
    include: {
      users: {
        include: {
          profiles: true,
        },
      },
    },
    orderBy: { joined_at: "asc" },
  });

  const members = allMembers.map((member) => ({
    id: member.users.id,
    username: member.users.username,
    name: member.users.profiles?.full_name ?? member.users.username,
    avatar: member.users.profiles?.avatar_url ?? null,
    role: member.role,
    isCurrentUser: member.users.id === userId,
  }));

  return {
    type: "community" as const,
    id: community.id,
    title: community.name,
    description: community.description,
    avatar: community.cover_url ?? null,
    messages:
      community.community_chat?.messages.map((message) => ({
        id: message.id,
        senderId: message.users.id,
        senderName: message.users.profiles?.full_name ?? message.users.username,
        senderAvatar: message.users.profiles?.avatar_url ?? null,
        text: message.message,
        isDeleted: "is_deleted" in message ? message.is_deleted : false,
        likeCount: "_count" in message ? message._count.likes : 0,
        likedByCurrentUser: "likes" in message ? message.likes.length > 0 : false,
        replyTo: message.reply_to_message
          ? {
              id: message.reply_to_message.id,
              senderId: message.reply_to_message.sender_id,
              senderName:
                message.reply_to_message.users.profiles?.full_name ?? message.reply_to_message.users.username,
              text: message.reply_to_message.is_deleted ? "Deleted message" : message.reply_to_message.message,
              imageUrl: null,
              isDeleted: message.reply_to_message.is_deleted,
            }
          : null,
        createdAt: message.created_at,
      })) ?? [],
    initialScrollTargetMessageId: firstUnreadCommunityMessageId,
    canChat,
    details: {
      type: "community" as const,
      title: community.name,
      description: community.description,
      memberCount: community._count.community_members,
      creator: community.users.profiles?.full_name ?? community.users.username,
      createdAt: community.created_at,
      currentUserId: userId,
      members,
      sharedMedia,
      canAddMembers: userRole === "OWNER" || userRole === "MODERATOR",
      canLeave: userRole !== "OWNER",
    },
  };
}
