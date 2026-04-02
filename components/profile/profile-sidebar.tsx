import { CalendarClock, Camera, ChevronRight, Sparkles } from "lucide-react";
import { ProfileActivity, ProfileCommunity, ProfilePost, ProfileUser } from "@/components/profile/types";
import { formatDistanceToNow } from "@/lib/utils";

type Props = {
  user: ProfileUser;
  communities: ProfileCommunity[];
  activities: ProfileActivity[];
  posts: ProfilePost[];
};

export function ProfileSidebar({ user, communities, activities, posts }: Props) {
  const topCommunities = communities.slice(0, 3);
  const upcomingActivities = activities
    .filter((activity) => activity.start_time.getTime() >= Date.now())
    .slice(0, 3);
  const recentMedia = posts.filter((post) => Boolean(post.image_url)).slice(0, 6);

  return (
    <aside className="space-y-6">
      <section className="surface-card rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-300" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-300">
            Highlights
          </h2>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {user.profile?.full_name ?? user.username} is using SyncUp to discover people, join communities, and keep the momentum going through casual updates.
        </p>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Top Communities
            </h2>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {topCommunities.length > 0 ? (
            topCommunities.map((community) => (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4" key={community.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{community.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[community.city, community.country].filter(Boolean).join(", ") || "Global"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {community.description || "A fresh space for shared interests, plans, and local conversation."}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/8 px-4 py-4 text-sm text-muted-foreground">
              Community memberships will show up here once this profile joins or creates them.
            </p>
          )}
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-sky-300" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300">
            Upcoming Activity
          </h2>
        </div>
        <div className="mt-4 space-y-3">
          {upcomingActivities.length > 0 ? (
            upcomingActivities.map((activity) => (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4" key={activity.id}>
                <p className="text-sm font-semibold text-white">{activity.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDistanceToNow(activity.start_time)}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {[activity.city, activity.country].filter(Boolean).join(", ") || "Location to be announced"}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-white/8 px-4 py-4 text-sm text-muted-foreground">
              Upcoming meetups and plans will appear here when activity joins start stacking up.
            </p>
          )}
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-fuchsia-300" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-fuchsia-300">
            Recent Media
          </h2>
        </div>
        {recentMedia.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {recentMedia.map((post) => (
              <div className="aspect-square overflow-hidden rounded-xl border border-white/8 bg-slate-950/60" key={post.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Recent post media" className="h-full w-full object-cover" src={post.image_url ?? ""} />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-white/8 px-4 py-4 text-sm text-muted-foreground">
            Shared images will build out this gallery over time.
          </p>
        )}
      </section>
    </aside>
  );
}
