type MatchableUserProfile = {
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  socialMode?: string | null;
};

export type MatchableUser = {
  id: string;
  profile?: MatchableUserProfile | null;
  interestIds: string[];
  vibeTagIds: string[];
  activityCategoryIds: string[];
  languageIds: string[];
  communityIds: string[];
  communityCategoryKeys: string[];
  followingIds: string[];
  followerIds: string[];
};

export type UserMatchBreakdown = {
  sharedCommunities: number;
  sharedCommunityCategories: number;
  sharedInterests: number;
  sharedVibeTags: number;
  sharedActivityPreferences: number;
  sharedLanguages: number;
  sharedBioKeywords: number;
  hasSameCity: boolean;
  hasSameCountry: boolean;
  hasSameSocialMode: boolean;
  followsEitherWay: boolean;
  isMutualFollow: boolean;
};

export type UserMatchResult = {
  percentage: number;
  breakdown: UserMatchBreakdown;
};

const MATCH_WEIGHTS = {
  communities: 24,
  communityCategories: 12,
  interests: 20,
  vibeTags: 12,
  activityPreferences: 10,
  bioKeywords: 8,
  languages: 4,
  location: 4,
  socialMode: 2,
  relationship: 4,
} as const;

const BIO_STOP_WORDS = new Set([
  "about",
  "after",
  "around",
  "been",
  "being",
  "build",
  "building",
  "casual",
  "city",
  "connect",
  "connecting",
  "connection",
  "connections",
  "enjoy",
  "from",
  "have",
  "just",
  "like",
  "love",
  "meet",
  "meeting",
  "more",
  "near",
  "open",
  "people",
  "really",
  "social",
  "some",
  "that",
  "their",
  "them",
  "there",
  "they",
  "this",
  "through",
  "want",
  "with",
]);

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function uniqueNormalized(values: string[]) {
  return Array.from(new Set(values.map(normalizeToken).filter(Boolean)));
}

function intersectionCount(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const rightSet = new Set(right);
  let count = 0;

  for (const value of left) {
    if (rightSet.has(value)) {
      count += 1;
    }
  }

  return count;
}

function diceSimilarity(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  return (2 * intersectionCount(left, right)) / (left.length + right.length);
}

function extractBioKeywords(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return uniqueNormalized(
    value
      .split(/[^a-zA-Z0-9]+/)
      .filter((token) => token.length >= 3)
      .filter((token) => !BIO_STOP_WORDS.has(token.toLowerCase())),
  );
}

function scoreLocation(
  viewerProfile: MatchableUserProfile | null | undefined,
  candidateProfile: MatchableUserProfile | null | undefined,
) {
  const sameCity = Boolean(
    viewerProfile?.city &&
      candidateProfile?.city &&
      normalizeToken(viewerProfile.city) === normalizeToken(candidateProfile.city),
  );
  const sameCountry = Boolean(
    viewerProfile?.country &&
      candidateProfile?.country &&
      normalizeToken(viewerProfile.country) === normalizeToken(candidateProfile.country),
  );

  if (sameCity) {
    return 1;
  }

  if (sameCountry) {
    return 0.55;
  }

  return 0;
}

function scoreRelationship(viewer: MatchableUser, candidate: MatchableUser) {
  const viewerFollowsCandidate = viewer.followingIds.includes(candidate.id);
  const candidateFollowsViewer = viewer.followerIds.includes(candidate.id);

  if (viewerFollowsCandidate && candidateFollowsViewer) {
    return 1;
  }

  if (viewerFollowsCandidate || candidateFollowsViewer) {
    return 0.6;
  }

  return 0;
}

export function calculateUserMatchScore(
  viewer: MatchableUser,
  candidate: MatchableUser,
): UserMatchResult {
  const viewerInterestIds = uniqueNormalized(viewer.interestIds);
  const candidateInterestIds = uniqueNormalized(candidate.interestIds);
  const viewerVibeTagIds = uniqueNormalized(viewer.vibeTagIds);
  const candidateVibeTagIds = uniqueNormalized(candidate.vibeTagIds);
  const viewerActivityCategoryIds = uniqueNormalized(viewer.activityCategoryIds);
  const candidateActivityCategoryIds = uniqueNormalized(candidate.activityCategoryIds);
  const viewerLanguageIds = uniqueNormalized(viewer.languageIds);
  const candidateLanguageIds = uniqueNormalized(candidate.languageIds);
  const viewerCommunityIds = uniqueNormalized(viewer.communityIds);
  const candidateCommunityIds = uniqueNormalized(candidate.communityIds);
  const viewerCommunityCategoryKeys = uniqueNormalized(viewer.communityCategoryKeys);
  const candidateCommunityCategoryKeys = uniqueNormalized(candidate.communityCategoryKeys);
  const viewerBioKeywords = extractBioKeywords(viewer.profile?.bio);
  const candidateBioKeywords = extractBioKeywords(candidate.profile?.bio);

  const sharedCommunities = intersectionCount(viewerCommunityIds, candidateCommunityIds);
  const sharedCommunityCategories = intersectionCount(
    viewerCommunityCategoryKeys,
    candidateCommunityCategoryKeys,
  );
  const sharedInterests = intersectionCount(viewerInterestIds, candidateInterestIds);
  const sharedVibeTags = intersectionCount(viewerVibeTagIds, candidateVibeTagIds);
  const sharedActivityPreferences = intersectionCount(
    viewerActivityCategoryIds,
    candidateActivityCategoryIds,
  );
  const sharedLanguages = intersectionCount(viewerLanguageIds, candidateLanguageIds);
  const sharedBioKeywords = intersectionCount(viewerBioKeywords, candidateBioKeywords);
  const hasSameCity = Boolean(
    viewer.profile?.city &&
      candidate.profile?.city &&
      normalizeToken(viewer.profile.city) === normalizeToken(candidate.profile.city),
  );
  const hasSameCountry = Boolean(
    viewer.profile?.country &&
      candidate.profile?.country &&
      normalizeToken(viewer.profile.country) === normalizeToken(candidate.profile.country),
  );
  const hasSameSocialMode = Boolean(
    viewer.profile?.socialMode &&
      candidate.profile?.socialMode &&
      viewer.profile.socialMode === candidate.profile.socialMode,
  );
  const viewerFollowsCandidate = viewer.followingIds.includes(candidate.id);
  const candidateFollowsViewer = viewer.followerIds.includes(candidate.id);
  const followsEitherWay = viewerFollowsCandidate || candidateFollowsViewer;
  const isMutualFollow = viewerFollowsCandidate && candidateFollowsViewer;

  const weightedScore =
    diceSimilarity(viewerCommunityIds, candidateCommunityIds) * MATCH_WEIGHTS.communities +
    diceSimilarity(viewerCommunityCategoryKeys, candidateCommunityCategoryKeys) *
      MATCH_WEIGHTS.communityCategories +
    diceSimilarity(viewerInterestIds, candidateInterestIds) * MATCH_WEIGHTS.interests +
    diceSimilarity(viewerVibeTagIds, candidateVibeTagIds) * MATCH_WEIGHTS.vibeTags +
    diceSimilarity(viewerActivityCategoryIds, candidateActivityCategoryIds) *
      MATCH_WEIGHTS.activityPreferences +
    diceSimilarity(viewerBioKeywords, candidateBioKeywords) * MATCH_WEIGHTS.bioKeywords +
    diceSimilarity(viewerLanguageIds, candidateLanguageIds) * MATCH_WEIGHTS.languages +
    scoreLocation(viewer.profile, candidate.profile) * MATCH_WEIGHTS.location +
    (hasSameSocialMode ? 1 : 0) * MATCH_WEIGHTS.socialMode +
    scoreRelationship(viewer, candidate) * MATCH_WEIGHTS.relationship;

  const percentage = Math.max(0, Math.min(100, Math.round(8 + weightedScore * 0.92)));

  return {
    percentage,
    breakdown: {
      sharedCommunities,
      sharedCommunityCategories,
      sharedInterests,
      sharedVibeTags,
      sharedActivityPreferences,
      sharedLanguages,
      sharedBioKeywords,
      hasSameCity,
      hasSameCountry,
      hasSameSocialMode,
      followsEitherWay,
      isMutualFollow,
    },
  };
}

export function getMatchScoreTone(score: number) {
  if (score >= 75) {
    return {
      label: "great",
      badgeClassName:
        "border-emerald-300/20 bg-[linear-gradient(135deg,rgba(52,211,153,0.2),rgba(16,185,129,0.1))] text-emerald-100 shadow-[0_10px_24px_rgba(16,185,129,0.15)]",
      accentClassName: "from-emerald-400/18 via-emerald-300/8 to-transparent",
    };
  }

  if (score >= 50) {
    return {
      label: "solid",
      badgeClassName:
        "border-amber-300/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.2),rgba(245,158,11,0.1))] text-amber-100 shadow-[0_10px_24px_rgba(245,158,11,0.14)]",
      accentClassName: "from-amber-400/18 via-amber-300/8 to-transparent",
    };
  }

  if (score >= 25) {
    return {
      label: "light",
      badgeClassName:
        "border-orange-300/20 bg-[linear-gradient(135deg,rgba(251,146,60,0.2),rgba(249,115,22,0.1))] text-orange-100 shadow-[0_10px_24px_rgba(249,115,22,0.14)]",
      accentClassName: "from-orange-400/18 via-orange-300/8 to-transparent",
    };
  }

  return {
    label: "low",
    badgeClassName:
      "border-rose-300/20 bg-[linear-gradient(135deg,rgba(251,113,133,0.2),rgba(244,63,94,0.1))] text-rose-100 shadow-[0_10px_24px_rgba(244,63,94,0.14)]",
    accentClassName: "from-rose-400/18 via-rose-300/8 to-transparent",
  };
}
