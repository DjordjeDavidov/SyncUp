"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getMeetupFeedbackDelegate,
  safeCreateMeetupFeedback,
  safeFindFirstMeetupFeedback,
  safeFindManyMeetupFeedback,
  safeUpdateMeetupFeedback,
} from "@/lib/meetup-feedback-store";
import { getCurrentUserOrRedirect } from "@/server/auth";
import {
  calculateMeetupFeedbackRisk,
  computeProfileCautionState,
  meetupFeedbackDisposition,
  meetupFeedbackModerationStatus,
  type MeetupFeedbackDisposition,
  shouldFlagFeedbackForReview,
} from "@/lib/trust-safety";

type MeetupFeedbackResult = {
  ok: boolean;
  message?: string;
};

function toOptionalScore(value: FormDataEntryValue | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
    return null;
  }

  return parsed;
}

async function refreshRatedUserCaution(ratedUserId: string) {
  const signals = await safeFindManyMeetupFeedback({
    where: {
      rated_user_id: ratedUserId,
    },
    select: {
      rater_user_id: true,
      quick_disposition: true,
      respectful_score: true,
      friendly_score: true,
      profile_accuracy_score: true,
      safety_score: true,
      reliability_score: true,
      moderation_status: true,
      public_caution_candidate: true,
      internal_risk_score: true,
    },
  }, "refreshing rated user caution");

  const cautionState = computeProfileCautionState(
    signals.map((entry) => ({
      raterUserId: entry.rater_user_id,
      quickDisposition: entry.quick_disposition,
      respectfulScore: entry.respectful_score,
      friendlyScore: entry.friendly_score,
      profileAccuracyScore: entry.profile_accuracy_score,
      safetyScore: entry.safety_score,
      reliabilityScore: entry.reliability_score,
      moderationStatus: entry.moderation_status,
      publicCautionCandidate: entry.public_caution_candidate,
      internalRiskScore: entry.internal_risk_score,
    })),
  );

  try {
    await (prisma.profiles.updateMany as unknown as (args: unknown) => Promise<unknown>)({
      where: {
        user_id: ratedUserId,
      },
      data: {
        caution_status: cautionState.showCaution ? "CAUTION" : "NONE",
      },
    });
  } catch {
    // The current database may not have the optional caution_status column yet.
  }
}

export async function submitMeetupFeedbackAction(formData: FormData): Promise<MeetupFeedbackResult> {
  const currentUser = await getCurrentUserOrRedirect();

  if (!getMeetupFeedbackDelegate()) {
    return {
      ok: false,
      message: "Meetup feedback is not available yet in this environment.",
    };
  }

  const activityId = String(formData.get("activityId") || "");
  const ratedUserId = String(formData.get("ratedUserId") || "");
  const quickDisposition = String(formData.get("quickDisposition") || meetupFeedbackDisposition.PREFER_NOT_TO_RATE);
  const adminOnlyComment = String(formData.get("adminOnlyComment") || "").trim();
  const respectfulScore = toOptionalScore(formData.get("respectfulScore"));
  const friendlyScore = toOptionalScore(formData.get("friendlyScore"));
  const profileAccuracyScore = toOptionalScore(formData.get("profileAccuracyScore"));
  const safetyScore = toOptionalScore(formData.get("safetyScore"));
  const reliabilityScore = toOptionalScore(formData.get("reliabilityScore"));

  if (!activityId || !ratedUserId) {
    return { ok: false, message: "Missing meetup feedback context." };
  }

  if (currentUser.id === ratedUserId) {
    return { ok: false, message: "You cannot leave meetup feedback for yourself." };
  }

  if (!Object.values(meetupFeedbackDisposition).includes(quickDisposition as MeetupFeedbackDisposition)) {
    return { ok: false, message: "Invalid feedback selection." };
  }

  const activity = await prisma.activities.findUnique({
    where: { id: activityId },
    include: {
      activity_participants: {
        select: {
          user_id: true,
        },
      },
    },
  });

  if (!activity) {
    return { ok: false, message: "This activity could not be found." };
  }

  const hasEnded =
    activity.status === "COMPLETED" ||
    (activity.status !== "CANCELLED" && activity.start_time.getTime() < Date.now());

  if (!hasEnded) {
    return { ok: false, message: "Feedback becomes available after the meetup ends." };
  }

  const participantIds = new Set(activity.activity_participants.map((participant) => participant.user_id));
  const isCurrentUserEligible = participantIds.has(currentUser.id);
  const isRatedUserEligible = participantIds.has(ratedUserId);

  if (!isCurrentUserEligible || !isRatedUserEligible) {
    return { ok: false, message: "Only verified participants can leave meetup feedback." };
  }

  const riskScore = calculateMeetupFeedbackRisk({
    quickDisposition: quickDisposition as MeetupFeedbackDisposition,
    respectfulScore,
    friendlyScore,
    profileAccuracyScore,
    safetyScore,
    reliabilityScore,
    adminOnlyComment,
  });
  const flaggedForReview = shouldFlagFeedbackForReview({
    quickDisposition: quickDisposition as MeetupFeedbackDisposition,
    safetyScore,
    respectfulScore,
    reliabilityScore,
    adminOnlyComment,
  });

  const existingFeedback = await safeFindFirstMeetupFeedback({
    where: {
      activity_id: activityId,
      rater_user_id: currentUser.id,
      rated_user_id: ratedUserId,
    },
    select: {
      id: true,
    },
  }, "loading existing meetup feedback");

  const feedbackPayload = {
    eligibility_verified: true,
    attendance_verified: true,
    quick_disposition: quickDisposition as MeetupFeedbackDisposition,
    respectful_score: respectfulScore,
    friendly_score: friendlyScore,
    profile_accuracy_score: profileAccuracyScore,
    safety_score: safetyScore,
    reliability_score: reliabilityScore,
    admin_only_comment: adminOnlyComment || null,
    internal_risk_score: riskScore,
    public_caution_candidate: flaggedForReview && riskScore >= 60,
    moderation_status: flaggedForReview
      ? meetupFeedbackModerationStatus.FLAGGED
      : meetupFeedbackModerationStatus.PENDING,
  };

  if (existingFeedback) {
    const updatedFeedback = await safeUpdateMeetupFeedback({
      where: {
        id: existingFeedback.id,
      },
      data: {
        ...feedbackPayload,
        reviewed_by: null,
        reviewed_at: null,
        moderator_note: null,
      },
    }, "updating meetup feedback");

    if (!updatedFeedback) {
      return { ok: false, message: "Meetup feedback is temporarily unavailable." };
    }
  } else {
    const createdFeedback = await safeCreateMeetupFeedback({
      data: {
        activity_id: activityId,
        rater_user_id: currentUser.id,
        rated_user_id: ratedUserId,
        ...feedbackPayload,
      },
    }, "creating meetup feedback");

    if (!createdFeedback) {
      return { ok: false, message: "Meetup feedback is temporarily unavailable." };
    }
  }

  await refreshRatedUserCaution(ratedUserId);

  const ratedUser = await prisma.users.findUnique({
    where: { id: ratedUserId },
    select: { username: true },
  });

  revalidatePath("/activity");
  revalidatePath("/profile");
  if (ratedUser?.username) {
    revalidatePath(`/profile/${ratedUser.username}`);
  }

  return { ok: true };
}
