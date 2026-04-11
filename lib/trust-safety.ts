export const meetupFeedbackDisposition = {
  MET_OK: "MET_OK",
  NO_SHOW: "NO_SHOW",
  DIDNT_REALLY_MEET: "DIDNT_REALLY_MEET",
  PREFER_NOT_TO_RATE: "PREFER_NOT_TO_RATE",
} as const;

export const meetupFeedbackModerationStatus = {
  PENDING: "PENDING",
  FLAGGED: "FLAGGED",
  REVIEWED: "REVIEWED",
  DISMISSED: "DISMISSED",
} as const;

export type MeetupFeedbackDisposition =
  (typeof meetupFeedbackDisposition)[keyof typeof meetupFeedbackDisposition];
export type MeetupFeedbackModerationStatus =
  (typeof meetupFeedbackModerationStatus)[keyof typeof meetupFeedbackModerationStatus];

type FeedbackSignal = {
  raterUserId: string;
  quickDisposition: MeetupFeedbackDisposition;
  respectfulScore: number | null;
  friendlyScore: number | null;
  profileAccuracyScore: number | null;
  safetyScore: number | null;
  reliabilityScore: number | null;
  moderationStatus: MeetupFeedbackModerationStatus;
  publicCautionCandidate?: boolean;
  internalRiskScore?: number;
};

export function calculateMeetupFeedbackRisk(input: {
  quickDisposition: MeetupFeedbackDisposition;
  respectfulScore?: number | null;
  friendlyScore?: number | null;
  profileAccuracyScore?: number | null;
  safetyScore?: number | null;
  reliabilityScore?: number | null;
  adminOnlyComment?: string | null;
}) {
  let risk = 0;

  if (input.quickDisposition === meetupFeedbackDisposition.NO_SHOW) {
    risk += 26;
  } else if (input.quickDisposition === meetupFeedbackDisposition.DIDNT_REALLY_MEET) {
    risk += 4;
  } else if (input.quickDisposition === meetupFeedbackDisposition.PREFER_NOT_TO_RATE) {
    risk += 2;
  }

  const weightedScores = [
    { value: input.respectfulScore ?? null, weight: 18 },
    { value: input.friendlyScore ?? null, weight: 8 },
    { value: input.profileAccuracyScore ?? null, weight: 14 },
    { value: input.safetyScore ?? null, weight: 28 },
    { value: input.reliabilityScore ?? null, weight: 22 },
  ];

  for (const score of weightedScores) {
    if (!score.value) {
      continue;
    }

    risk += Math.max(0, (5 - score.value) * score.weight);
  }

  if (input.adminOnlyComment?.trim()) {
    risk += 8;
  }

  return Math.max(0, Math.min(100, Math.round(risk / 4)));
}

export function shouldFlagFeedbackForReview(input: {
  quickDisposition: MeetupFeedbackDisposition;
  safetyScore?: number | null;
  respectfulScore?: number | null;
  reliabilityScore?: number | null;
  adminOnlyComment?: string | null;
}) {
  return Boolean(
    input.quickDisposition === meetupFeedbackDisposition.NO_SHOW ||
      (input.safetyScore !== null && input.safetyScore !== undefined && input.safetyScore <= 2) ||
      (input.respectfulScore !== null && input.respectfulScore !== undefined && input.respectfulScore <= 2) ||
      (input.reliabilityScore !== null && input.reliabilityScore !== undefined && input.reliabilityScore <= 2) ||
      input.adminOnlyComment?.trim(),
  );
}

export function computeProfileCautionState(feedback: FeedbackSignal[]) {
  const actionableFeedback = feedback.filter(
    (entry) =>
      entry.moderationStatus !== meetupFeedbackModerationStatus.DISMISSED &&
      entry.quickDisposition !== meetupFeedbackDisposition.DIDNT_REALLY_MEET &&
      entry.quickDisposition !== meetupFeedbackDisposition.PREFER_NOT_TO_RATE,
  );

  const independentRaters = new Set(actionableFeedback.map((entry) => entry.raterUserId)).size;
  const seriousSignals = actionableFeedback.filter(
    (entry) =>
      (entry.publicCautionCandidate ?? false) ||
      (entry.internalRiskScore ?? 0) >= 65 ||
      (entry.safetyScore !== null && entry.safetyScore !== undefined && entry.safetyScore <= 2),
  );
  const reviewedSignals = seriousSignals.filter(
    (entry) =>
      entry.moderationStatus === meetupFeedbackModerationStatus.REVIEWED ||
      entry.moderationStatus === meetupFeedbackModerationStatus.FLAGGED,
  );
  const averageRisk =
    actionableFeedback.length > 0
      ? actionableFeedback.reduce((total, entry) => total + (entry.internalRiskScore ?? 0), 0) / actionableFeedback.length
      : 0;

  const showCaution =
    independentRaters >= 2 &&
    actionableFeedback.length >= 3 &&
    reviewedSignals.length >= 2 &&
    averageRisk >= 48;

  return {
    showCaution,
    independentRaters,
    actionableCount: actionableFeedback.length,
    reviewedSeriousCount: reviewedSignals.length,
    averageRisk: Math.round(averageRisk),
  };
}

export function getMeetupDispositionLabel(disposition: MeetupFeedbackDisposition) {
  switch (disposition) {
    case meetupFeedbackDisposition.MET_OK:
      return "Met them, all good";
    case meetupFeedbackDisposition.NO_SHOW:
      return "Didn't show up";
    case meetupFeedbackDisposition.DIDNT_REALLY_MEET:
      return "Didn't really meet them";
    case meetupFeedbackDisposition.PREFER_NOT_TO_RATE:
    default:
      return "Prefer not to rate";
  }
}
