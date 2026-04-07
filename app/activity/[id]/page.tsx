import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { logoutAction } from "@/actions/feed";
import { Navbar } from "@/components/navbar";
import { MobileNav } from "@/components/mobile-nav";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "@/lib/utils";

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
      _count: {
        select: {
          activity_participants: true,
        },
      },
    },
  });

  if (!activity) {
    notFound();
  }

  const isParticipant = activity.activity_participants.some((participant) => participant.user_id === currentUser.id);

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />

        <div className="space-y-6 py-8">
          <Link
            href="/activity"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition-all duration-200 hover:text-indigo-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to activities
          </Link>

          <section className="surface-card rounded-3xl border border-white/10 p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                    <p className="mt-2 text-sm text-white">
                      {activity.location_text || [activity.city, activity.country].filter(Boolean).join(", ") || "Location to be announced"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-950/60 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Going</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{activity._count.activity_participants}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                    {activity.status}
                  </div>
                </div>
                {activity.communities ? (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Community</p>
                    <Link
                      href={`/communities/${activity.communities.slug}`}
                      className="mt-2 block text-sm font-semibold text-white hover:text-indigo-200"
                    >
                      {activity.communities.name}
                    </Link>
                  </div>
                ) : null}
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Your status</p>
                  <p className="mt-2 text-sm text-white">{isParticipant ? "You’re going" : "Not joined yet"}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-slate-300" />
              <p className="text-sm font-semibold text-white">Participants</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activity.activity_participants.map((participant) => (
                <Link
                  key={participant.user_id}
                  href={`/profile/${participant.users.username}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.06]"
                >
                  <p className="text-sm font-semibold text-white">{participant.users.profiles?.full_name ?? participant.users.username}</p>
                  <p className="mt-1 text-xs text-muted-foreground">@{participant.users.username}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
