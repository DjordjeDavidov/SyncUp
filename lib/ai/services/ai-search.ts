import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { activity_status, community_visibility, invite_visibility, profile_visibility } from "@/lib/prisma-generated";
import { getCommunityCategoryLabel } from "@/lib/community-categories";
import { prisma } from "@/lib/prisma";
import { calculateUserMatchScore, type MatchableUser } from "@/lib/user-match";

const MAX_AI_RESULTS = 18;
const MAX_CANDIDATES_PER_TYPE = 32;
const GEMINI_MODEL = "gemini-2.5-flash";

const aiRankedResultSchema = z.object({
  type: z.enum(["user", "community", "activity"]),
  id: z.string().min(1),
  score: z.number().min(0).max(100),
  reason: z.string().min(8).max(280),
});

const aiSearchSchema = z.object({
  results: z.array(aiRankedResultSchema).max(MAX_AI_RESULTS),
});

export type AiSearchResult =
  | {
      type: "user";
      id: string;
      score: number;
      reason: string;
      href: string;
      avatarUrl: string | null;
      username: string;
      name: string;
      matchScore: number;
      bio: string;
      sharedInterests: string[];
      recentContentPreview: string;
    }
  | {
      type: "community";
      id: string;
      score: number;
      reason: string;
      href: string;
      imageUrl: string | null;
      name: string;
      category: string;
      memberCount: number;
      description: string;
    }
  | {
      type: "activity";
      id: string;
      score: number;
      reason: string;
      href: string;
      imageUrl: string | null;
      title: string;
      location: string;
      date: string;
      participantCount: number;
      description: string;
    };

export type AiSearchResponse = {
  query: string;
  results: AiSearchResult[];
};

function toMatchableUser(input: {
  id: string;
  profiles?: {
    bio?: string | null;
    city?: string | null;
    country?: string | null;
    social_mode?: string | null;
  } | null;
  user_interests?: { interest_id: string }[];
  user_vibe_tags?: { vibe_tag_id: string }[];
  user_activity_preferences?: { category_id: string }[];
  user_languages?: { language_id: string }[];
  community_members?: {
    community_id: string;
    communities?: {
      category: string | null;
      custom_category: string | null;
    } | null;
  }[];
  follows_follows_follower_idTousers?: { following_id: string }[];
  follows_follows_following_idTousers?: { follower_id: string }[];
}): MatchableUser {
  return {
    id: input.id,
    profile: input.profiles
      ? {
          bio: input.profiles.bio ?? null,
          city: input.profiles.city ?? null,
          country: input.profiles.country ?? null,
          socialMode: input.profiles.social_mode ?? null,
        }
      : null,
    interestIds: input.user_interests?.map((entry) => entry.interest_id) ?? [],
    vibeTagIds: input.user_vibe_tags?.map((entry) => entry.vibe_tag_id) ?? [],
    activityCategoryIds: input.user_activity_preferences?.map((entry) => entry.category_id) ?? [],
    languageIds: input.user_languages?.map((entry) => entry.language_id) ?? [],
    communityIds: input.community_members?.map((entry) => entry.community_id) ?? [],
    communityCategoryKeys:
      input.community_members
        ?.map((entry) => entry.communities?.custom_category ?? entry.communities?.category)
        .filter((value): value is string => Boolean(value)) ?? [],
    followingIds: input.follows_follows_follower_idTousers?.map((entry) => entry.following_id) ?? [],
    followerIds: input.follows_follows_following_idTousers?.map((entry) => entry.follower_id) ?? [],
  };
}

function compactText(value: string | null | undefined, maxLength = 220) {
  if (!value) {
    return "";
  }

  const text = value.replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  return new GoogleGenAI({ apiKey });
}

export async function runAiSearch(userId: string, query: string): Promise<AiSearchResponse> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 6) {
    return { query: trimmedQuery, results: [] };
  }

  const now = new Date();

  const [viewer, blockedRows, users, communities, activities] = await Promise.all([
    prisma.users.findUnique({
      where: { id: userId },
      include: {
        profiles: true,
        user_interests: { include: { interests: true } },
        user_vibe_tags: { include: { vibe_tags: true } },
        user_activity_preferences: { include: { activity_categories: true } },
        user_languages: { include: { languages: true } },
        community_members: {
          select: {
            community_id: true,
            communities: {
              select: {
                category: true,
                custom_category: true,
              },
            },
          },
        },
        follows_follows_follower_idTousers: { select: { following_id: true } },
        follows_follows_following_idTousers: { select: { follower_id: true } },
      },
    }),
    prisma.blocks.findMany({
      where: {
        OR: [{ blocker_id: userId }, { blocked_id: userId }],
      },
      select: {
        blocker_id: true,
        blocked_id: true,
      },
    }),
    prisma.users.findMany({
      where: {
        id: { not: userId },
        status: "ACTIVE",
        profiles: { is: { profile_visibility: profile_visibility.PUBLIC } },
      },
      include: {
        profiles: true,
        user_interests: { include: { interests: true } },
        user_vibe_tags: { include: { vibe_tags: true } },
        user_activity_preferences: { include: { activity_categories: true } },
        user_languages: { include: { languages: true } },
        community_members: {
          where: { communities: { visibility: community_visibility.PUBLIC } },
          select: {
            community_id: true,
            communities: {
              select: {
                name: true,
                category: true,
                custom_category: true,
              },
            },
          },
          take: 6,
        },
        posts: {
          where: {
            OR: [
              { community_id: null },
              { communities: { visibility: community_visibility.PUBLIC } },
            ],
            NOT: {
              post_type: "INVITE_POST",
              invite_visibility: invite_visibility.FOLLOWERS_FRIENDS,
            },
          },
          select: {
            title: true,
            content: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
          take: 2,
        },
      },
      orderBy: { created_at: "desc" },
      take: MAX_CANDIDATES_PER_TYPE,
    }),
    prisma.communities.findMany({
      where: {
        visibility: community_visibility.PUBLIC,
      },
      include: {
        community_interests: { include: { interests: true } },
        community_vibe_tags: { include: { vibe_tags: true } },
        _count: {
          select: {
            community_members: true,
            posts: true,
            activities: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: MAX_CANDIDATES_PER_TYPE,
    }),
    prisma.activities.findMany({
      where: {
        invite_visibility: invite_visibility.PUBLIC,
        status: activity_status.OPEN,
        start_time: { gte: now },
        OR: [
          { community_id: null },
          { communities: { visibility: community_visibility.PUBLIC } },
        ],
      },
      include: {
        activity_categories: true,
        communities: true,
        _count: {
          select: {
            activity_participants: true,
          },
        },
      },
      orderBy: { start_time: "asc" },
      take: MAX_CANDIDATES_PER_TYPE,
    }),
  ]);

  if (!viewer) {
    throw new Error("Current user not found.");
  }

  const blockedUserIds = new Set(
    blockedRows.map((row) => (row.blocker_id === userId ? row.blocked_id : row.blocker_id)),
  );
  const visibleUsers = users.filter((user) => !blockedUserIds.has(user.id));
  const viewerMatchUser = toMatchableUser(viewer);

  const userPayload = visibleUsers.map((user) => ({
    type: "user",
    id: user.id,
    username: user.username,
    name: user.profiles?.full_name ?? user.username,
    bio: compactText(user.profiles?.bio),
    location: [user.profiles?.city, user.profiles?.country].filter(Boolean).join(", "),
    socialMode: user.profiles?.social_mode,
    interests: user.user_interests.map((item) => item.interests.name),
    vibeTags: user.user_vibe_tags.map((item) => item.vibe_tags.name),
    activityPreferences: user.user_activity_preferences.map((item) => item.activity_categories.name),
    languages: user.user_languages.map((item) => item.languages.name),
    publicCommunities: user.community_members.map((item) => item.communities?.name).filter(Boolean),
    recentPublicPosts: user.posts.map((post) => compactText(post.title || post.content, 140)),
    compatibilityPercent: calculateUserMatchScore(viewerMatchUser, toMatchableUser(user)).percentage,
  }));

  const communityPayload = communities.map((community) => ({
    type: "community",
    id: community.id,
    name: community.name,
    category: getCommunityCategoryLabel(community.category, community.custom_category) ?? "Community",
    description: compactText(community.description),
    location: [community.city, community.country].filter(Boolean).join(", "),
    interests: community.community_interests.map((item) => item.interests.name),
    vibeTags: community.community_vibe_tags.map((item) => item.vibe_tags.name),
    memberCount: community._count.community_members,
    postCount: community._count.posts,
    activityCount: community._count.activities,
  }));

  const activityPayload = activities.map((activity) => ({
    type: "activity",
    id: activity.id,
    title: activity.title,
    category: activity.activity_categories?.name ?? "Activity",
    description: compactText(activity.description),
    location: [activity.location_text, activity.city, activity.country].filter(Boolean).join(", "),
    startsAt: activity.start_time.toISOString(),
    community: activity.communities?.visibility === community_visibility.PUBLIC ? activity.communities.name : null,
    participantCount: activity._count.activity_participants,
  }));

  const ai = getGeminiClient();
  const prompt = [
    "You are SyncUp's AI Search and Discovery ranking engine.",
    "Rank public discovery candidates for the authenticated user's natural language request.",
    "Use semantic intent, compatibility, interests, communities, activities, locations, recency, and public post previews.",
    "Return only candidates that genuinely match the request. Prefer a balanced discovery feed across people, communities, and activities when relevant.",
    "Never invent IDs. Use only IDs from the candidate arrays.",
    "Return JSON only with this shape: {\"results\":[{\"type\":\"user|community|activity\",\"id\":\"...\",\"score\":95,\"reason\":\"...\"}]}",
    "",
    `User query: ${trimmedQuery}`,
    "",
    `Viewer public context: ${JSON.stringify({
      location: [viewer.profiles?.city, viewer.profiles?.country].filter(Boolean).join(", "),
      bio: compactText(viewer.profiles?.bio),
      interests: viewer.user_interests.map((item) => item.interests.name),
      vibeTags: viewer.user_vibe_tags.map((item) => item.vibe_tags.name),
      activityPreferences: viewer.user_activity_preferences.map((item) => item.activity_categories.name),
      languages: viewer.user_languages.map((item) => item.languages.name),
    })}`,
    "",
    `Candidates: ${JSON.stringify({
      users: userPayload,
      communities: communityPayload,
      activities: activityPayload,
    })}`,
  ].join("\n");

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["user", "community", "activity"] },
                id: { type: Type.STRING },
                score: { type: Type.NUMBER },
                reason: { type: Type.STRING },
              },
              required: ["type", "id", "score", "reason"],
            },
          },
        },
        required: ["results"],
      },
    },
  });

  const parsed = aiSearchSchema.safeParse(JSON.parse(response.text ?? "{\"results\":[]}"));

  if (!parsed.success) {
    throw new Error("Gemini returned an invalid AI Search response.");
  }

  const usersById = new Map(visibleUsers.map((user) => [user.id, user]));
  const communitiesById = new Map(communities.map((community) => [community.id, community]));
  const activitiesById = new Map(activities.map((activity) => [activity.id, activity]));
  const ranked = parsed.data.results
    .filter((result, index, results) => results.findIndex((item) => item.type === result.type && item.id === result.id) === index)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_AI_RESULTS);

  const hydrated = ranked.flatMap((result): AiSearchResult[] => {
    if (result.type === "user") {
      const user = usersById.get(result.id);

      if (!user) {
        return [];
      }

      const match = calculateUserMatchScore(viewerMatchUser, toMatchableUser(user));
      const viewerInterestNames = new Set(viewer.user_interests.map((item) => item.interests.name));
      const sharedInterests = user.user_interests
        .map((item) => item.interests.name)
        .filter((name) => viewerInterestNames.has(name));
      const recentContentPreview =
        user.posts.map((post) => compactText(post.title || post.content, 120)).find(Boolean) ??
        compactText(user.profiles?.bio, 120) ??
        "Public SyncUp profile";

      return [{
        type: "user",
        id: user.id,
        score: Math.round(result.score),
        reason: result.reason,
        href: `/profile/${user.username}`,
        avatarUrl: user.profiles?.avatar_url ?? null,
        username: user.username,
        name: user.profiles?.full_name ?? user.username,
        matchScore: match.percentage,
        bio: user.profiles?.bio ?? "Open to meeting people with similar interests.",
        sharedInterests: sharedInterests.slice(0, 4),
        recentContentPreview,
      }];
    }

    if (result.type === "community") {
      const community = communitiesById.get(result.id);

      if (!community) {
        return [];
      }

      return [{
        type: "community",
        id: community.id,
        score: Math.round(result.score),
        reason: result.reason,
        href: `/communities/${community.slug}`,
        imageUrl: community.cover_url ?? null,
        name: community.name,
        category: getCommunityCategoryLabel(community.category, community.custom_category) ?? "Community",
        memberCount: community._count.community_members,
        description: community.description ?? "Public community for shared interests and meetups.",
      }];
    }

    const activity = activitiesById.get(result.id);

    if (!activity) {
      return [];
    }

    return [{
      type: "activity",
      id: activity.id,
      score: Math.round(result.score),
      reason: result.reason,
      href: `/activity/${activity.id}`,
      imageUrl: activity.image_url ?? activity.communities?.cover_url ?? null,
      title: activity.title,
      location: [activity.location_text, activity.city, activity.country].filter(Boolean).join(", ") || "Open location",
      date: formatDate(activity.start_time),
      participantCount: activity._count.activity_participants,
      description: activity.description ?? "Public SyncUp activity.",
    }];
  });

  return {
    query: trimmedQuery,
    results: hydrated,
  };
}
