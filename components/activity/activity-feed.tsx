"use client";

import { CalendarCheck2, Heart, MessageCircle, Sparkles, UserPlus, Users } from "lucide-react";
import { useMemo } from "react";
import { formatDistanceToNow, getInitials } from "@/lib/utils";

type Person = {
  id: string;
  username: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
};

type Community = {
  id: string;
  name: string;
};

type Activity = {
  id: string;
  title: string;
};

type NotificationRecord = {
  id: string;
  type:
    | "FOLLOWED"
    | "ACTIVITY_JOINED"
    | "COMMUNITY_JOINED"
    | "POST_LIKED"
    | "VERIFICATION_UPDATED"
    | "REPORT_UPDATED";
  title: string;
  body: string | null;
  read: boolean;
  created_at: Date;
  users_notifications_actor_idTousers: {
    id: string;
    username: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  communities: {
    id: string;
    name: string;
  } | null;
  activities: {
    id: string;
    title: string;
  } | null;
};

type Props = {
  currentUser: {
    username: string;
    profile: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  };
  notifications: NotificationRecord[];
  people: Person[];
  communities: Community[];
  activities: Activity[];
};

type ActivityItem = {
  id: string;
  kind: "follow" | "like" | "comment" | "invite" | "community";
  unread: boolean;
  createdAt: Date;
  actor: {
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  message: string;
  meta: string;
};

const kindStyles = {
  follow: {
    icon: UserPlus,
    badge: "Follow",
    accent: "border-sky-300/18 bg-sky-400/10 text-sky-100",
  },
  like: {
    icon: Heart,
    badge: "Like",
    accent: "border-rose-300/18 bg-rose-400/10 text-rose-100",
  },
  comment: {
    icon: MessageCircle,
    badge: "Comment",
    accent: "border-violet-300/18 bg-violet-400/10 text-violet-100",
  },
  invite: {
    icon: CalendarCheck2,
    badge: "Invite",
    accent: "border-emerald-300/18 bg-emerald-400/10 text-emerald-100",
  },
  community: {
    icon: Users,
    badge: "Community",
    accent: "border-amber-300/18 bg-amber-400/10 text-amber-100",
  },
} as const;

function getName(person: Person | Props["currentUser"]) {
  return person.profile?.full_name ?? person.username;
}

function normalizeNotifications(records: NotificationRecord[]): ActivityItem[] {
  return records.map((record) => {
    const actorName =
      record.users_notifications_actor_idTousers?.profiles?.full_name ??
      record.users_notifications_actor_idTousers?.username ??
      "SyncUp";
    const actorUsername = record.users_notifications_actor_idTousers?.username ?? "syncup";
    const avatarUrl = record.users_notifications_actor_idTousers?.profiles?.avatar_url ?? null;

    if (record.type === "FOLLOWED") {
      return {
        id: record.id,
        kind: "follow",
        unread: !record.read,
        createdAt: record.created_at,
        actor: {
          name: actorName,
          username: actorUsername,
          avatarUrl,
        },
        message: "started following you",
        meta: "New connection",
      };
    }

    if (record.type === "POST_LIKED") {
      return {
        id: record.id,
        kind: "like",
        unread: !record.read,
        createdAt: record.created_at,
        actor: {
          name: actorName,
          username: actorUsername,
          avatarUrl,
        },
        message: "liked your post",
        meta: record.body ?? record.title,
      };
    }

    if (record.type === "ACTIVITY_JOINED") {
      return {
        id: record.id,
        kind: "invite",
        unread: !record.read,
        createdAt: record.created_at,
        actor: {
          name: actorName,
          username: actorUsername,
          avatarUrl,
        },
        message: "joined your activity",
        meta: record.activities?.title ?? record.title,
      };
    }

    if (record.type === "COMMUNITY_JOINED") {
      return {
        id: record.id,
        kind: "community",
        unread: !record.read,
        createdAt: record.created_at,
        actor: {
          name: actorName,
          username: actorUsername,
          avatarUrl,
        },
        message: "interacted with your community",
        meta: record.communities?.name ?? record.title,
      };
    }

    return {
      id: record.id,
      kind: "community",
      unread: !record.read,
      createdAt: record.created_at,
      actor: {
        name: actorName,
        username: actorUsername,
        avatarUrl,
      },
      message: record.title,
      meta: record.body ?? "SyncUp update",
    };
  });
}

function buildSeedItems(
  currentUser: Props["currentUser"],
  people: Person[],
  communities: Community[],
  activities: Activity[],
): ActivityItem[] {
  const now = Date.now();
  const fallbackPeople = people.slice(0, 5);

  return [
    fallbackPeople[0]
      ? {
          id: `seed-follow-${fallbackPeople[0].id}`,
          kind: "follow",
          unread: true,
          createdAt: new Date(now - 1000 * 60 * 42),
          actor: {
            name: getName(fallbackPeople[0]),
            username: fallbackPeople[0].username,
            avatarUrl: fallbackPeople[0].profile?.avatar_url ?? null,
          },
          message: "started following you",
          meta: "New connection",
        }
      : null,
    fallbackPeople[1]
      ? {
          id: `seed-comment-${fallbackPeople[1].id}`,
          kind: "comment",
          unread: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 5),
          actor: {
            name: getName(fallbackPeople[1]),
            username: fallbackPeople[1].username,
            avatarUrl: fallbackPeople[1].profile?.avatar_url ?? null,
          },
          message: "commented on your post",
          meta: "This plan actually sounds fun. I'm in if there's room.",
        }
      : null,
    fallbackPeople[2] && activities[0]
      ? {
          id: `seed-invite-${fallbackPeople[2].id}`,
          kind: "invite",
          unread: false,
          createdAt: new Date(now - 1000 * 60 * 60 * 26),
          actor: {
            name: getName(fallbackPeople[2]),
            username: fallbackPeople[2].username,
            avatarUrl: fallbackPeople[2].profile?.avatar_url ?? null,
          },
          message: "joined your invite",
          meta: activities[0].title,
        }
      : null,
    fallbackPeople[3] && activities[1]
      ? {
          id: `seed-invite-declined-${fallbackPeople[3].id}`,
          kind: "invite",
          unread: false,
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
          actor: {
            name: getName(fallbackPeople[3]),
            username: fallbackPeople[3].username,
            avatarUrl: fallbackPeople[3].profile?.avatar_url ?? null,
          },
          message: "declined your invite",
          meta: activities[1].title,
        }
      : null,
    fallbackPeople[4] && communities[0]
      ? {
          id: `seed-community-${fallbackPeople[4].id}`,
          kind: "community",
          unread: false,
          createdAt: new Date(now - 1000 * 60 * 60 * 24 * 9),
          actor: {
            name: getName(fallbackPeople[4]),
            username: fallbackPeople[4].username,
            avatarUrl: fallbackPeople[4].profile?.avatar_url ?? null,
          },
          message: "reacted in your community",
          meta: communities[0].name,
        }
      : null,
  ].filter((item): item is ActivityItem => item !== null);
}

function groupItems(items: ActivityItem[]) {
  const now = Date.now();

  return {
    today: items.filter((item) => now - item.createdAt.getTime() < 1000 * 60 * 60 * 24),
    week: items.filter((item) => {
      const diff = now - item.createdAt.getTime();
      return diff >= 1000 * 60 * 60 * 24 && diff < 1000 * 60 * 60 * 24 * 7;
    }),
    older: items.filter((item) => now - item.createdAt.getTime() >= 1000 * 60 * 60 * 24 * 7),
  };
}

function Section({
  title,
  items,
}: {
  title: string;
  items: ActivityItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>
        <div className="h-px flex-1 bg-white/8" />
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const style = kindStyles[item.kind];
          const Icon = style.icon;

          return (
            <article
              className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 sm:p-5 ${
                item.unread
                  ? "border-indigo-300/18 bg-[linear-gradient(180deg,rgba(26,35,58,0.94),rgba(11,16,28,0.98))] shadow-[0_18px_48px_rgba(2,6,23,0.34),0_0_24px_rgba(99,102,241,0.08)]"
                  : "border-white/8 bg-[linear-gradient(180deg,rgba(20,28,46,0.92),rgba(10,14,26,0.96))] hover:border-white/12 hover:bg-[linear-gradient(180deg,rgba(24,34,56,0.94),rgba(11,16,28,0.98))]"
              }`}
              key={item.id}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.1),transparent_30%)] opacity-70" />
              <div className="relative flex items-start gap-3 sm:gap-4">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.32),rgba(59,130,246,0.16))] text-sm font-semibold text-white">
                  {item.actor.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={item.actor.name} className="h-full w-full object-cover" src={item.actor.avatarUrl} />
                  ) : (
                    getInitials(item.actor.name)
                  )}
                  {item.unread ? (
                    <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-indigo-400 shadow-[0_0_14px_rgba(129,140,248,0.7)]" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${style.accent}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {style.badge}
                    </span>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                      {formatDistanceToNow(item.createdAt)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-200">
                    <span className="font-semibold text-white">{item.actor.name}</span>{" "}
                    <span className="text-muted-foreground">@{item.actor.username}</span>{" "}
                    <span>{item.message}</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.meta}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ActivityFeed({ currentUser, notifications, people, communities, activities }: Props) {
  const allItems = useMemo(() => {
    const realItems = normalizeNotifications(notifications);
    const seededItems = buildSeedItems(currentUser, people, communities, activities);
    const seenKinds = new Set(realItems.map((item) => item.kind));
    const fillItems = seededItems.filter((item) => !seenKinds.has(item.kind));

    return [...realItems, ...fillItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [activities, communities, currentUser, notifications, people]);

  const grouped = useMemo(() => groupItems(allItems), [allItems]);
  const unreadCount = allItems.filter((item) => item.unread).length;

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-2xl border border-white/8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Activity</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">What’s happening around you</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track new followers, likes, comments, invite responses, and community activity in one clean stream.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Unread</p>
            <p className="mt-1 text-2xl font-semibold text-white">{unreadCount}</p>
          </div>
        </div>
      </div>

      {allItems.length > 0 ? (
        <div className="space-y-8">
          <Section items={grouped.today} title="Today" />
          <Section items={grouped.week} title="This week" />
          <Section items={grouped.older} title="Older" />
        </div>
      ) : (
        <div className="surface-card rounded-2xl border border-white/8 px-6 py-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-300/18 bg-indigo-400/10 text-indigo-100">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xl font-semibold text-white">No activity yet</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Once people start interacting with your posts, communities, and invites, everything will show up here in a simple timeline.
          </p>
        </div>
      )}
    </div>
  );
}
