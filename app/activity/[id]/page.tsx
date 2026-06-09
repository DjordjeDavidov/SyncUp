import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { joinActivityPostAction, leaveActivityPostAction, logoutAction } from "@/actions/feed";
import { MessageCreatorButton } from "@/components/activity/message-creator-button";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { PostActionForm } from "@/components/post-action-form";
import { prisma } from "@/lib/prisma";
import { getInitials, formatDistanceToNow } from "@/lib/utils";
import { getCurrentUserOrRedirect } from "@/server/auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ActivityDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const currentUser = await getCurrentUserOrRedirect();

  const activity = await prisma.activities.findUnique({
    where: { id },
    include: {
      communities: true,
      activity_participants: {
        include: {
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
  });

  if (!activity) {
    notFound();
  }

  const isParticipant = activity.activity_participants.some((participant) => participant.user_id === currentUser.id);
  const isCreator = activity.creator_id === currentUser.id;
  const creatorName = activity.users.profiles?.full_name ?? activity.users.username;
  const locationLabel =
    activity.location_text || [activity.city, activity.country].filter(Boolean).join(", ") || "Location to be announced";
  const goingCount = activity.activity_participants.length + 1;
  const canJoin =
    !isCreator &&
    !isParticipant &&
    activity.status !== "CANCELLED" &&
    activity.status !== "COMPLETED" &&
    activity.start_time.getTime() >= Date.now() &&
    (activity.max_participants === null || goingCount < activity.max_participants);

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar logoutAction={logoutAction} user={currentUser} />

        <div className="space-y-6 py-8">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition-all duration-200 hover:text-indigo-100"
            href="/activity"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to activities
          </Link>

          <section className="surface-card rounded-3xl border border-white/10 p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Activity details</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{activity.title}</h1>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {activity.description || "No description provided for this activity."}
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">When</p>
                    <p className="mt-2 text-sm text-white">{formatDistanceToNow(activity.start_time)} from now</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Where</p>
                    <p className="mt-2 text-sm text-white">{locationLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Created by</p>
                    <Link className="mt-2 block text-sm font-semibold text-white hover:text-indigo-200" href={`/profile/${activity.users.username}`}>
                      {creatorName}
                    </Link>
                    <p className="mt-1 text-xs text-slate-400">@{activity.users.username}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Capacity</p>
                    <p className="mt-2 text-sm text-white">
                      {activity.max_participants ? `${goingCount}/${activity.max_participants} going` : `${goingCount} going`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-950/60 p-6 lg:w-[22rem]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Going</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{goingCount}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                    {activity.status}
                  </div>
                </div>

                {activity.communities ? (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Community</p>
                    <Link
                      className="mt-2 block text-sm font-semibold text-white hover:text-indigo-200"
                      href={`/communities/${activity.communities.slug}`}
                    >
                      {activity.communities.name}
                    </Link>
                  </div>
                ) : null}

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Your status</p>
                  <p className="mt-2 text-sm text-white">
                    {isCreator ? "You created this activity" : isParticipant ? "You're going" : "Not joined yet"}
                  </p>
                </div>

                {isCreator ? null : isParticipant ? (
                  <PostActionForm
                    action={leaveActivityPostAction}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.07]"
                    hiddenFields={{ activityId: activity.id }}
                    idleLabel="Leave activity"
                    pendingLabel="Leaving..."
                  />
                ) : (
                  <PostActionForm
                    action={joinActivityPostAction}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!canJoin}
                    hiddenFields={{ activityId: activity.id }}
                    idleLabel={activity.status === "FULL" ? "Activity full" : "Join activity"}
                    pendingLabel="Joining..."
                  />
                )}

                {!isCreator ? <MessageCreatorButton creatorId={activity.users.id} /> : null}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-slate-300" />
                <p className="text-sm font-semibold text-white">Participants</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  className="rounded-2xl border border-indigo-300/18 bg-indigo-400/10 p-4 transition-all duration-200 hover:border-indigo-300/28 hover:bg-indigo-400/14"
                  href={`/profile/${activity.users.username}`}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Creator</p>
                  <p className="mt-2 text-sm font-semibold text-white">{creatorName}</p>
                  <p className="mt-1 text-xs text-slate-300">@{activity.users.username}</p>
                </Link>
                {activity.activity_participants.map((participant) => (
                  <Link
                    key={participant.user_id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.06]"
                    href={`/profile/${participant.users.username}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-indigo-500/20 text-sm font-semibold text-white">
                        {participant.users.profiles?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={participant.users.profiles.full_name ?? participant.users.username}
                            className="h-full w-full object-cover"
                            src={participant.users.profiles.avatar_url}
                          />
                        ) : (
                          getInitials(participant.users.profiles?.full_name ?? participant.users.username)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {participant.users.profiles?.full_name ?? participant.users.username}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">@{participant.users.username}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Quick links</p>
                <div className="mt-4 space-y-3">
                  <Link
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/18 hover:bg-white/[0.07]"
                    href={`/profile/${activity.users.username}`}
                  >
                    View creator profile
                  </Link>
                  {activity.communities ? (
                    <Link
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/18 hover:bg-white/[0.07]"
                      href={`/communities/${activity.communities.slug}`}
                    >
                      Open related community
                    </Link>
                  ) : null}
                </div>
              </div>
            </aside>
          </section>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
