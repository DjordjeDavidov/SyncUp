import { NextResponse } from "next/server";
import { activity_status, community_visibility } from "@/lib/prisma-generated";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

type AiSearchResult =
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

const TOKEN_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "be",
  "by",
  "for",
  "from",
  "have",
  "i",
  "in",
  "is",
  "it",
  "like",
  "me",
  "my",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "want",
  "with",
]);

function tokenize(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3 && !TOKEN_STOP_WORDS.has(token)),
    ),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasWholeWordMatch(content: string, token: string) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}([^a-z0-9]|$)`, "i").test(content);
}

function normalizePhrase(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function scoreFieldMatch(value: string | null | undefined, token: string, fieldWeight: number, tokenWeight: number) {
  if (!value) {
    return 0;
  }

  const normalized = value.toLowerCase();

  if (!normalized.includes(token)) {
    return 0;
  }

  const wholeWordBoost = hasWholeWordMatch(normalized, token) ? 1.25 : 1;
  const startsWithBoost = normalized.startsWith(token) ? 1.2 : 1;

  return fieldWeight * tokenWeight * wholeWordBoost * startsWithBoost;
}

function computeTokenWeights(documents: string[], tokens: string[]) {
  const safeDocuments = documents.map((document) => normalizePhrase(document));
  const totalDocuments = Math.max(safeDocuments.length, 1);

  return new Map(
    tokens.map((token) => {
      const frequency = safeDocuments.reduce((count, document) => count + (document.includes(token) ? 1 : 0), 0);
      const rarity = Math.log((totalDocuments + 1) / (frequency + 1)) + 1;
      return [token, rarity];
    }),
  );
}

function rankEntity(options: {
  fields: Array<{ value: string | null | undefined; weight: number }>;
  query: string;
  tokens: string[];
  tokenWeights: Map<string, number>;
}) {
  const normalizedQuery = normalizePhrase(options.query);
  const normalizedFields = options.fields
    .map((field) => ({
      ...field,
      normalized: normalizePhrase(field.value ?? ""),
    }))
    .filter((field) => field.normalized.length > 0);

  const matchingTokens = options.tokens.filter((token) =>
    normalizedFields.some((field) => field.normalized.includes(token)),
  );
  const rareTokens = matchingTokens.filter((token) => (options.tokenWeights.get(token) ?? 1) > 1.4);

  let score = 0;

  for (const token of options.tokens) {
    const tokenWeight = options.tokenWeights.get(token) ?? 1;

    for (const field of normalizedFields) {
      score += scoreFieldMatch(field.normalized, token, field.weight, tokenWeight);
    }
  }

  const phraseMatches = normalizedFields.filter((field) => normalizedQuery.length >= 5 && field.normalized.includes(normalizedQuery)).length;
  score += phraseMatches * 30;
  score += matchingTokens.length * matchingTokens.length * 8;
  score += rareTokens.length * 16;

  if (matchingTokens.length === 1 && rareTokens.length === 0) {
    score *= 0.38;
  } else if (matchingTokens.length <= 2 && rareTokens.length === 0) {
    score *= 0.62;
  }

  return {
    score,
    matchingTokens,
  };
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function buildReason(label: string, matchingTokens: string[], fallback: string) {
  if (matchingTokens.length === 0) {
    return fallback;
  }

  const preview = matchingTokens.slice(0, 3).join(", ");
  return `${label} matches: ${preview}`;
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Please sign in to use AI Search." }, { status: 401 });
  }

  let body: { query?: unknown };

  try {
    body = (await request.json()) as { query?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";

  if (query.length < 6) {
    return NextResponse.json({ error: "Try a longer request so AI Search has enough context." }, { status: 400 });
  }

  const tokens = tokenize(query);
  const fallbackTokens = query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  const searchTokens = tokens.length > 0 ? tokens : fallbackTokens;

  const [users, communities, activities] = await Promise.all([
    prisma.users.findMany({
      where: {
        id: { not: userId },
        profiles: { isNot: null },
      },
      include: {
        profiles: true,
        user_languages: {
          select: {
            languages: {
              select: {
                name: true,
              },
            },
          },
        },
        user_interests: {
          select: {
            interests: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: 24,
      orderBy: { created_at: "desc" },
    }),
    prisma.communities.findMany({
      where: {
        visibility: community_visibility.PUBLIC,
      },
      include: {
        _count: {
          select: {
            community_members: true,
          },
        },
        community_interests: {
          select: {
            interests: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: 24,
      orderBy: { created_at: "desc" },
    }),
    prisma.activities.findMany({
      where: {
        status: activity_status.OPEN,
      },
      include: {
        communities: {
          select: {
            slug: true,
            name: true,
            cover_url: true,
          },
        },
        activity_categories: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            activity_participants: true,
          },
        },
      },
      take: 24,
      orderBy: { start_time: "asc" },
    }),
  ]);

  const documents = [
    ...users.map((user) =>
      [
        user.username,
        user.profiles?.full_name,
        user.profiles?.bio,
        user.profiles?.city,
        user.profiles?.country,
        ...user.user_languages.map((entry) => entry.languages.name),
        ...user.user_interests.map((entry) => entry.interests.name),
      ]
        .filter(Boolean)
        .join(" "),
    ),
    ...communities.map((community) =>
      [
        community.name,
        community.description,
        community.category,
        community.custom_category,
        community.city,
        community.country,
        ...community.community_interests.map((entry) => entry.interests.name),
      ]
        .filter(Boolean)
        .join(" "),
    ),
    ...activities.map((activity) =>
      [
        activity.title,
        activity.description,
        activity.location_text,
        activity.city,
        activity.country,
        activity.activity_categories?.name,
        activity.communities?.name,
      ]
        .filter(Boolean)
        .join(" "),
    ),
  ];
  const tokenWeights = computeTokenWeights(documents, searchTokens);

  const userResults = users
    .map<AiSearchResult | null>((user) => {
      const interestNames = user.user_interests.map((entry) => entry.interests.name);
      const languageNames = user.user_languages.map((entry) => entry.languages.name);
      const { score, matchingTokens } = rankEntity({
        fields: [
          { value: user.username, weight: 8 },
          { value: user.profiles?.full_name, weight: 10 },
          { value: user.profiles?.bio, weight: 5 },
          { value: user.profiles?.city, weight: 4 },
          { value: user.profiles?.country, weight: 6 },
          ...languageNames.map((name) => ({ value: name, weight: 11 })),
          ...interestNames.map((name) => ({ value: name, weight: 9 })),
        ],
        query,
        tokens: searchTokens,
        tokenWeights,
      });

      if (score <= 0) {
        return null;
      }

      return {
        type: "user",
        id: user.id,
        score,
        reason: buildReason("Shared vibe", matchingTokens, "Matches your request across profile details and interests."),
        href: `/profile/${user.username}`,
        avatarUrl: user.profiles?.avatar_url ?? null,
        username: user.username,
        name: user.profiles?.full_name ?? user.username,
        matchScore: Math.min(99, 50 + matchingTokens.length * 12 + Math.floor(score / 6)),
        bio: user.profiles?.bio ?? "Open to meeting people with similar interests.",
        sharedInterests: interestNames.filter((name) => searchTokens.some((token) => name.toLowerCase().includes(token))).slice(0, 4),
        recentContentPreview:
          matchingTokens.length > 0
            ? `Matched on ${matchingTokens.slice(0, 3).join(", ")}.`
            : "Profile details align with your search.",
      };
    })
    .filter((result): result is AiSearchResult => result !== null);

  const communityResults = communities
    .map<AiSearchResult | null>((community) => {
      const interestNames = community.community_interests.map((entry) => entry.interests.name);
      const ranked = rankEntity({
        fields: [
          { value: community.name, weight: 11 },
          { value: community.category, weight: 8 },
          { value: community.custom_category, weight: 8 },
          { value: community.description, weight: 5 },
          { value: community.city, weight: 4 },
          { value: community.country, weight: 5 },
          ...interestNames.map((name) => ({ value: name, weight: 9 })),
        ],
        query,
        tokens: searchTokens,
        tokenWeights,
      });
      const matchingTokens = ranked.matchingTokens;
      const score = ranked.score + Math.min(community._count.community_members, 12);

      if (score <= 0) {
        return null;
      }

      return {
        type: "community",
        id: community.id,
        score,
        reason: buildReason("Community", matchingTokens, "Relevant community topics and member activity match your request."),
        href: `/communities/${community.slug}`,
        imageUrl: community.icon_url ?? community.cover_url ?? null,
        name: community.name,
        category: community.custom_category ?? community.category ?? "Community",
        memberCount: community._count.community_members,
        description: community.description ?? "Explore this community to see what members are organizing.",
      };
    })
    .filter((result): result is AiSearchResult => result !== null);

  const activityResults = activities
    .map<AiSearchResult | null>((activity) => {
      const ranked = rankEntity({
        fields: [
          { value: activity.title, weight: 12 },
          { value: activity.activity_categories?.name, weight: 9 },
          { value: activity.communities?.name, weight: 7 },
          { value: activity.location_text, weight: 8 },
          { value: activity.city, weight: 5 },
          { value: activity.country, weight: 6 },
          { value: activity.description, weight: 5 },
        ],
        query,
        tokens: searchTokens,
        tokenWeights,
      });
      const matchingTokens = ranked.matchingTokens;
      const score = ranked.score + Math.min(activity._count.activity_participants, 10);

      if (score <= 0) {
        return null;
      }

      return {
        type: "activity",
        id: activity.id,
        score,
        reason: buildReason("Activity", matchingTokens, "Relevant event details line up with your request."),
        href: `/activity/${activity.id}`,
        imageUrl: activity.image_url ?? activity.communities?.cover_url ?? null,
        title: activity.title,
        location: [activity.location_text, activity.city, activity.country].filter(Boolean).join(", ") || "Location to be announced",
        date: formatDate(activity.start_time),
        participantCount: activity._count.activity_participants,
        description: activity.description ?? "Open activity with room for new people to join.",
      };
    })
    .filter((result): result is AiSearchResult => result !== null);

  const results = [...userResults, ...communityResults, ...activityResults]
    .sort((left, right) => right.score - left.score)
    .slice(0, 12);

  return NextResponse.json({ results });
}
