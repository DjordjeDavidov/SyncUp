"use server";

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
        community_members: true,
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
  const [contacts, communityChats] = await Promise.all([
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
      take: 8,
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
    contacts: contacts.map((contact) => ({
      id: contact.id,
      username: contact.username,
      profile: contact.profiles,
    })),
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
