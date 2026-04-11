"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Sparkles, Users } from "lucide-react";
import { formatDistanceToNow, getInitials } from "@/lib/utils";
import { getCommunityCategoryLabel } from "@/lib/community-categories";
import { MatchBadge } from "@/components/match-badge";

type Person = {
  id: string;
  username: string;
  matchScore: number;
  matchContext: string;
  profiles: {
    full_name: string;
    bio: string | null;
    avatar_url: string | null;
    city: string | null;
    country: string | null;
  } | null;
};

type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  custom_category: string | null;
  cover_url: string | null;
  city: string | null;
  country: string | null;
  _count: {
    community_members: number;
  };
};

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

type TabKey = "people" | "communities" | "activities";

type Props = {
  people: Person[];
  communities: Community[];
  activities: Activity[];
};

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "people", label: "People", icon: Users },
  { key: "communities", label: "Communities", icon: Sparkles },
  { key: "activities", label: "Activities", icon: CalendarDays },
];

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function ExploreSidebar({ people, communities, activities }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("people");

  return (
    <aside className="surface-card self-start rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.3)]">
      <div className="flex items-center gap-2 text-indigo-200">
        <Sparkles className="h-4 w-4" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Explore</p>
          <p className="text-sm text-slate-300">Real recommendations based on your profile and activity.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.key === activeTab;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex max-w-full items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-semibold uppercase tracking-normal transition-all duration-200 ${
                active
                  ? "border-indigo-300/25 bg-indigo-400/10 text-white shadow-[0_8px_24px_rgba(99,102,241,0.15)]"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-indigo-300/20 hover:bg-indigo-400/8 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {activeTab === "people" ? (
          people.length > 0 ? (
            people.slice(0, 4).map((person) => (
                <Link
                  key={person.id}
                  href={`/profile/${person.username}`}
                  className="block overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-indigo-500/20 text-sm font-semibold text-white">
                      {person.profiles?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={person.profiles.full_name ?? person.username} src={person.profiles.avatar_url} className="h-full w-full object-cover" />
                      ) : (
                        getInitials(person.profiles?.full_name ?? person.username)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{person.profiles?.full_name ?? person.username}</p>
                          <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
                        </div>
                        <MatchBadge score={person.matchScore} compact />
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">
                        {person.profiles?.bio || "Active in your area and ready to connect."}
                      </p>
                      <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        {person.matchContext}
                      </p>
                    </div>
                  </div>
                </Link>
            ))
          ) : (
            <EmptyPanel
              title="No people recommendations yet"
              description="When your profile activity grows, suggested people with shared interests and local connections will appear here."
            />
          )
        ) : activeTab === "communities" ? (
          communities.length > 0 ? (
            communities.slice(0, 4).map((community) => {
              const categoryLabel = getCommunityCategoryLabel(community.category, community.custom_category);

              return (
                <Link
                  key={community.id}
                  href={`/communities/${community.slug}`}
                  className="block overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{community.name}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {community.description || "Community with shared interests."}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                      {community._count.community_members}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-400">
                    <span>{categoryLabel || "Open group"}</span>
                    <span className="h-px flex-1 bg-white/10" />
                    <span>{[community.city, community.country].filter(Boolean).join(", ") || "Location open"}</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <EmptyPanel
              title="No community recommendations yet"
              description="Relevant public communities will appear here once the system has enough info about your interests and activity." />
          )
        ) : activities.length > 0 ? (
          activities.slice(0, 4).map((activity) => (
            <Link
              key={activity.id}
              href={`/activity/${activity.id}`}
              className="block rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{activity.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {activity.location_text || [activity.city, activity.country].filter(Boolean).join(", ") || "Location pending"}
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                  {activity._count.activity_participants} going
                </span>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                Starts {formatDistanceToNow(activity.start_time)}
              </p>
            </Link>
          ))
        ) : (
          <EmptyPanel
            title="No upcoming activities found"
            description="Upcoming public activities and community events will appear here soon." />
        )}
      </div>
    </aside>
  );
}
