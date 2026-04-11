"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Send, ShieldAlert, Star, X } from "lucide-react";
import { MeetupFeedbackPrompt } from "@/components/profile/types";
import { getInitials } from "@/lib/utils";

type Props = {
  prompts: MeetupFeedbackPrompt[];
  submitFeedbackAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
};

const quickOptions = [
  { value: "MET_OK", label: "Met them, all good" },
  { value: "NO_SHOW", label: "Didn't show up" },
  { value: "DIDNT_REALLY_MEET", label: "Didn't really meet them" },
  { value: "PREFER_NOT_TO_RATE", label: "Prefer not to rate" },
] as const;

const ratingFields = [
  { key: "respectfulScore", label: "Respectful" },
  { key: "friendlyScore", label: "Friendly" },
  { key: "profileAccuracyScore", label: "Matched profile expectations" },
  { key: "safetyScore", label: "Felt safe to meet" },
  { key: "reliabilityScore", label: "Reliable / showed up" },
] as const;

type SelectedTarget = {
  activityId: string;
  activityTitle: string;
  targetId: string;
  targetName: string;
  targetUsername: string;
  targetAvatarUrl: string | null;
};

export function MeetupFeedbackPanel({ prompts, submitFeedbackAction }: Props) {
  const [queue, setQueue] = useState(prompts);
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null);
  const [quickDisposition, setQuickDisposition] = useState<(typeof quickOptions)[number]["value"]>("MET_OK");
  const [ratings, setRatings] = useState<Record<(typeof ratingFields)[number]["key"], string>>({
    respectfulScore: "5",
    friendlyScore: "5",
    profileAccuracyScore: "5",
    safetyScore: "5",
    reliabilityScore: "5",
  });
  const [adminOnlyComment, setAdminOnlyComment] = useState("");
  const [isPending, startTransition] = useTransition();

  const pendingCount = useMemo(
    () => queue.reduce((total, prompt) => total + prompt.targets.length, 0),
    [queue],
  );

  function resetForm() {
    setQuickDisposition("MET_OK");
    setRatings({
      respectfulScore: "5",
      friendlyScore: "5",
      profileAccuracyScore: "5",
      safetyScore: "5",
      reliabilityScore: "5",
    });
    setAdminOnlyComment("");
  }

  function closeModal() {
    setSelectedTarget(null);
    resetForm();
  }

  useEffect(() => {
    if (!selectedTarget) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTarget]);

  function removeTargetFromQueue(activityId: string, targetId: string) {
    setQueue((current) =>
      current
        .map((prompt) =>
          prompt.activityId === activityId
            ? {
                ...prompt,
                targets: prompt.targets.filter((target) => target.id !== targetId),
              }
            : prompt,
        )
        .filter((prompt) => prompt.targets.length > 0),
    );
  }

  function submitFeedback() {
    if (!selectedTarget) {
      return;
    }

    const formData = new FormData();
    formData.append("activityId", selectedTarget.activityId);
    formData.append("ratedUserId", selectedTarget.targetId);
    formData.append("quickDisposition", quickDisposition);
    formData.append("adminOnlyComment", adminOnlyComment);

    for (const field of ratingFields) {
      formData.append(field.key, ratings[field.key]);
    }

    const targetSnapshot = selectedTarget;
    const previousQueue = queue;

    removeTargetFromQueue(targetSnapshot.activityId, targetSnapshot.targetId);
    closeModal();

    startTransition(async () => {
      const result = await submitFeedbackAction(formData);

      if (!result.ok) {
        setQueue(previousQueue);
      }
    });
  }

  if (queue.length === 0) {
    return null;
  }

  return (
    <>
      <section className="surface-card rounded-2xl border border-white/8 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Meetup feedback</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Private post-event trust check-ins</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Share lightweight private feedback about people you actually met. These check-ins stay internal unless repeated serious safety concerns trigger a neutral caution notice.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-white">{pendingCount}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {queue.map((prompt) => (
            <div
              className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(22,30,48,0.88),rgba(10,14,26,0.96))] p-4"
              key={prompt.activityId}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{prompt.activityTitle}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                    {prompt.participantCount} attendees - finished meetup
                  </p>
                </div>
                <span className="rounded-full border border-indigo-300/18 bg-indigo-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-100">
                  {prompt.targets.length} awaiting feedback
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {prompt.targets.map((target) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                    key={target.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.36),rgba(59,130,246,0.18))] text-sm font-semibold text-white">
                        {target.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt={target.name} className="h-full w-full object-cover" src={target.avatarUrl} />
                        ) : (
                          getInitials(target.name)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{target.name}</p>
                        <p className="truncate text-xs text-slate-400">@{target.username}</p>
                        <p className="mt-1 line-clamp-1 text-sm text-slate-300">{target.bio || "Met during this activity."}</p>
                      </div>
                    </div>
                    <button
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/16 hover:bg-white/[0.08]"
                      onClick={() =>
                        setSelectedTarget({
                          activityId: prompt.activityId,
                          activityTitle: prompt.activityTitle,
                          targetId: target.id,
                          targetName: target.name,
                          targetUsername: target.username,
                          targetAvatarUrl: target.avatarUrl,
                        })
                      }
                      type="button"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Leave feedback
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedTarget ? (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-[rgba(3,7,18,0.78)] p-4 backdrop-blur-md"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,20,34,0.98),rgba(8,12,24,0.98))] shadow-[0_30px_90px_rgba(2,6,23,0.54)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Meetup feedback</p>
                <p className="mt-1 text-lg font-semibold text-white">{selectedTarget.targetName}</p>
                <p className="text-sm text-slate-400">{selectedTarget.activityTitle}</p>
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-white/16 hover:bg-white/[0.08]"
                onClick={closeModal}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.36),rgba(59,130,246,0.18))] text-sm font-semibold text-white">
                    {selectedTarget.targetAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={selectedTarget.targetName} className="h-full w-full object-cover" src={selectedTarget.targetAvatarUrl} />
                    ) : (
                      getInitials(selectedTarget.targetName)
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedTarget.targetName}</p>
                    <p className="text-xs text-slate-400">@{selectedTarget.targetUsername}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold text-white">Quick outcome</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {quickOptions.map((option) => (
                    <button
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                        quickDisposition === option.value
                          ? "border-indigo-300/24 bg-indigo-400/10 text-white"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/16 hover:bg-white/[0.05]"
                      }`}
                      key={option.value}
                      onClick={() => setQuickDisposition(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-white">Private trust categories</p>
                <div className="mt-3 space-y-3">
                  {ratingFields.map((field) => (
                    <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3" key={field.key}>
                      <span className="text-sm text-slate-200">{field.label}</span>
                      <span className="inline-flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-300" />
                        <select
                          className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none"
                          onChange={(event) => setRatings((current) => ({ ...current, [field.key]: event.target.value }))}
                          value={ratings[field.key]}
                        >
                          {[1, 2, 3, 4, 5].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-white" htmlFor="admin-comment">
                  Admin-only concerns
                </label>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Optional. This text is private to moderation review and is not shown publicly or sent back to the other person directly.
                </p>
                <textarea
                  className="mt-3 min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-indigo-300/24"
                  id="admin-comment"
                  onChange={(event) => setAdminOnlyComment(event.target.value)}
                  placeholder="Share any concern or context that a moderator should privately review."
                  value={adminOnlyComment}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-5">
                <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Private trust input only
                </div>
                <div className="flex gap-3">
                  <button
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/16 hover:bg-white/[0.06]"
                    onClick={closeModal}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isPending}
                    onClick={submitFeedback}
                    type="button"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {isPending ? "Submitting..." : "Submit feedback"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
