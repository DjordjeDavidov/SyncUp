import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

type Activity = {
  id: string;
  title: string;
  location_text: string | null;
  city: string | null;
  country: string | null;
  start_time: Date;
  _count: {
    activity_participants: number;
  };
};

export function SuggestedActivityCard({ activities }: { activities: Activity[] }) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-sky-300/10 bg-[linear-gradient(180deg,rgba(22,28,46,0.96),rgba(11,16,28,0.98))] p-6 shadow-[0_18px_44px_rgba(2,6,23,0.32),0_0_24px_rgba(56,189,248,0.06)] transition-all duration-200"
      id="activity-discover"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.1),transparent_34%)]" />
      <div className="relative flex items-center gap-2 text-sky-200">
        <CalendarDays className="h-4 w-4" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300">
          Upcoming activities
        </h2>
      </div>
      <div className="relative mt-4 space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <Link
              href={`/activity/${activity.id}`}
              key={activity.id}
              className="block rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-50">{activity.title}</p>
                <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs text-slate-300">
                  {activity._count.activity_participants} going
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatDistanceToNow(activity.start_time)}</p>
              <p className="mt-3 text-sm text-slate-300">
                {activity.location_text ||
                  [activity.city, activity.country].filter(Boolean).join(", ") ||
                  "Location to be announced"}
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-sky-300/14 bg-[linear-gradient(180deg,rgba(56,189,248,0.08),rgba(255,255,255,0.02))] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/16 bg-sky-400/12 text-sky-100">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-100">Nothing on the calendar just yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Upcoming plans will show here as soon as events are added, along with timing and attendance.
            </p>
            <div className="mt-4 space-y-2">
              <div className="h-11 rounded-2xl border border-white/6 bg-white/[0.03]" />
              <div className="h-11 rounded-2xl border border-white/6 bg-white/[0.02]" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
