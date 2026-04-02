import { formatDistanceToNow } from "@/lib/utils";

type Activity = {
  id: string;
  title: string;
  city: string | null;
  country: string | null;
  start_time: Date;
  _count: {
    activity_participants: number;
  };
};

export function SuggestedActivityCard({ activities }: { activities: Activity[] }) {
  return (
    <section className="surface-card rounded-[28px] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">
        Upcoming activities
      </h2>
      <div className="mt-4 space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <article className="rounded-3xl border border-white/6 bg-white/3 p-4" key={activity.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-50">{activity.title}</p>
                <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs text-slate-300">
                  {activity._count.activity_participants} going
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{formatDistanceToNow(activity.start_time)}</p>
              <p className="mt-3 text-sm text-slate-300">
                {[activity.city, activity.country].filter(Boolean).join(", ") || "Location to be announced"}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-white/8 px-4 py-4 text-sm leading-6 text-slate-400">
            No upcoming activities yet. As soon as real plans are added, they will show up here.
          </p>
        )}
      </div>
    </section>
  );
}
