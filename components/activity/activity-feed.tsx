"use client";

import Link from "next/link";
import { CalendarCheck2, CheckCircle2, Heart, MessageCircle, Sparkles, Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo } from "react";
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
  slug: string;
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
  created_at: string | Date;
  users_notifications_actor_idTousers: {
    id: string;
    username: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  users_notifications_related_user_idTousers: {
    id: string;
    username: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  posts: {
    id: string;
    title: string | null;
  } | null;
  communities: Community | null;
  activities: Activity | null;
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
  kind: "follow" | "like" | "comment" | "invite" | "community" | "update" | "report";
  unread: boolean;
  createdAt: Date;
  actor: {
    name: string;
    username: string;
    avatarUrl: string | null;
    href: string | null;
  };
  message: string;
  meta: string;
  metaHref: string | null;
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
  update: {
    icon: CheckCircle2,
    badge: "Update",
    accent: "border-slate-300/18 bg-slate-400/10 text-slate-100",
  },
  report: {
    icon: Sparkles,
    badge: "Report",
    accent: "border-indigo-300/18 bg-indigo-400/10 text-indigo-100",
  },
} as const;

function getName(person: Person | Props["currentUser"]) {
  return person.profile?.full_name ?? person.username;
}

function getCreatedAtValue(createdAt: string | Date) {
  return typeof createdAt === "string" ? new Date(createdAt) : createdAt;
}

function resolveNotificationHref(record: NotificationRecord) {
  if (record.type === "FOLLOWED") {
    return record.users_notifications_actor_idTousers
      ? `/profile/${record.users_notifications_actor_idTousers.username}`
      : "/profile";
  }

  if (record.type === "POST_LIKED") {
    return record.posts ? `/posts/${record.posts.id}` : "/home";
  }

  if (record.type === "ACTIVITY_JOINED") {
    return record.activities ? `/activity/${record.activities.id}` : "/activity";
  }

  if (record.type === "COMMUNITY_JOINED") {
    return record.communities ? `/communities/${record.communities.slug}` : "/communities";
  }

  if (record.type === "VERIFICATION_UPDATED" || record.type === "REPORT_UPDATED") {
    return "/profile";
  }

  return "/activity";
}

function resolveActorHref(record: NotificationRecord) {
  const actorUsername =
    record.users_notifications_actor_idTousers?.username ?? record.users_notifications_related_user_idTousers?.username;

  return actorUsername ? `/profile/${actorUsername}` : null;
}

function normalizeNotifications(records: NotificationRecord[]): ActivityItem[] {
  return records.map((record) => {
    const actorName =
      record.users_notifications_actor_idTousers?.profiles?.full_name ??
      record.users_notifications_actor_idTousers?.username ??
      record.users_notifications_related_user_idTousers?.profiles?.full_name ??
      record.users_notifications_related_user_idTousers?.username ??
      "SyncUp";
    const actorUsername =
      record.users_notifications_actor_idTousers?.username ??
      record.users_notifications_related_user_idTousers?.username ??
      "syncup";
    const avatarUrl =
      record.users_notifications_actor_idTousers?.profiles?.avatar_url ??
      record.users_notifications_related_user_idTousers?.profiles?.avatar_url ??
      null;
    const createdAt = getCreatedAtValue(record.created_at);
    const actorHref = resolveActorHref(record);
    const metaHref = resolveNotificationHref(record);

    if (record.type === "FOLLOWED") {
      return {
        id: record.id,
        kind: "follow",
        unread: !record.read,
        createdAt,
        actor: {
          name: actorName,
          username: actorUsername,
          avatarUrl,
          href: actorHref,
        },
        message: "started following you",
        meta: "Open profile",
        metaHref: actorHref,
      };
    }

    if (record.type === "POST_LIKED") {
      return {
        id: record.id,
        kind: "like",
        unread: !record.read,
        createdAt,
        actor: {
          name: actorName,
          username: actorUsername,
          avatarUrl,
          href: actorHref,
        },
        message: "liked your post",
        meta: record.posts?.title ?? record.title,
        metaHref,
      };
    }

    if (record.type === "ACTIVITY_JOINED") {
      return {
        id: record.id,
        kind: "invite",
        unread: !record.read,
        createdAt,
        actor: {
          name: actorName,
          username: actorUsername,
          avatarUrl,
          href: actorHref,
        },
        message: "joined your activity",
        meta: record.activities?.title ?? record.title,
        metaHref,
      };
    }

    if (record.type === "COMMUNITY_JOINED") {
      return {
        id: record.id,
        kind: "community",
        unread: !record.read,
        createdAt,
        actor: {
          name: actorName,
          username: actorUsername,
          avatarUrl,
          href: actorHref,
        },
        message: "joined your community",
        meta: record.communities?.name ?? record.title,
        metaHref,
      };
    }

    if (record.type === "VERIFICATION_UPDATED") {
      return {
        id: record.id,
        kind: "update",
        unread: !record.read,
        createdAt,
        actor: {
          name: actorName,
          username: actorUsername,
          avatarUrl,
          href: actorHref,
        },
        message: record.title,
        meta: record.body ?? "Profile update",
        metaHref,
      };
    }

    return {
      id: record.id,
      kind: "report",
      unread: !record.read,
      createdAt,
      actor: {
        name: actorName,
        username: actorUsername,
        avatarUrl,
        href: actorHref,
      },
      message: record.title,
      meta: record.body ?? "SyncUp update",
      metaHref,
    };
  });
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

async function sendNotificationRequest(action: string, notificationId?: string) {
  const response = await fetch("/api/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, notificationId }),
    keepalive: true,
  });

  if (!response.ok) {
    throw new Error("Unable to update notifications.");
  }

  return response.json();
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
                {item.actor.href ? (
                  <Link
                    aria-label={`Open ${item.actor.name}'s profile`}
                    className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.32),rgba(59,130,246,0.16))] text-sm font-semibold text-white cursor-pointer"
                    href={item.actor.href}
                  >
                    {item.actor.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={item.actor.name} className="h-full w-full object-cover" src={item.actor.avatarUrl} />
                    ) : (
                      getInitials(item.actor.name)
                    )}
                    {item.unread ? (
                      <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-indigo-400 shadow-[0_0_14px_rgba(129,140,248,0.7)]" />
                    ) : null}
                  </Link>
                ) : (
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.32),rgba(59,130,246,0.16))] text-sm font-semibold text-white">
                    {item.actor.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={item.actor.name} className="h-full w-full object-cover" src={item.actor.avatarUrl} />
                    ) : (
                      getInitials(item.actor.name)
                    )}
                    {item.unread ? (
                      <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-indigo-400 shadow-[0_0_14px_rgba(129,140,248,0.7)]" />
                    ) : null}
                  </div>
                )}
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
                    {item.actor.href ? (
                      <Link className="font-semibold text-white cursor-pointer" href={item.actor.href}>
                        {item.actor.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-white">{item.actor.name}</span>
                    )}{" "}
                    {item.actor.href ? (
                      <Link className="text-muted-foreground cursor-pointer" href={item.actor.href}>
                        @{item.actor.username}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">@{item.actor.username}</span>
                    )}{" "}
                    <span>{item.message}</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.metaHref ? (
                      <Link className="cursor-pointer" href={item.metaHref}>
                        {item.meta}
                      </Link>
                    ) : (
                      item.meta
                    )}
                  </p>
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
  useEffect(() => {
    const unreadIds = notifications.filter((notification) => !notification.read).map((notification) => notification.id);

    if (unreadIds.length === 0) {
      return;
    }

    const controller = new AbortController();

    async function markAllRead() {
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "markAllRead" }),
          signal: controller.signal,
          keepalive: true,
        });

        window.dispatchEvent(new CustomEvent("syncup:counts-refresh"));
      } catch {
        // Ignore background mark-as-read failures.
      }
    }

    void markAllRead();

    return () => controller.abort();
  }, [notifications]);

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

function buildSeedItems(
  currentUser: Props["currentUser"],
  people: Person[],
  communities: Community[],
  activities: Activity[],
): ActivityItem[] {
  const seededItems: ActivityItem[] = [];
  const now = new Date();

  // Seed follow suggestions
  if (people.length > 0) {
    const followPerson = people[Math.floor(Math.random() * people.length)];
    seededItems.push({
      id: `seed-follow-${followPerson.id}`,
      kind: "follow",
      unread: false,
      createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
      actor: {
        name: getName(followPerson),
        username: followPerson.username,
        avatarUrl: followPerson.profile?.avatar_url ?? null,
        href: `/profile/${followPerson.username}`,
      },
      message: "is active in your network",
      meta: "Suggested follow",
      metaHref: `/profile/${followPerson.username}`,
    });
  }

  // Seed community suggestions
  if (communities.length > 0) {
    const community = communities[Math.floor(Math.random() * communities.length)];
    seededItems.push({
      id: `seed-community-${community.id}`,
      kind: "community",
      unread: false,
      createdAt: new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000), // Random within last 3 days
      actor: {
        name: community.name,
        username: "syncup",
        avatarUrl: null,
        href: null,
      },
      message: "Community you might like",
      meta: community.name,
      metaHref: `/communities/${community.slug}`,
    });
  }

  // Seed activity suggestions
  if (activities.length > 0) {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    seededItems.push({
      id: `seed-activity-${activity.id}`,
      kind: "invite",
      unread: false,
      createdAt: new Date(now.getTime() - Math.random() * 5 * 24 * 60 * 60 * 1000), // Random within last 5 days
      actor: {
        name: currentUser.profile?.full_name ?? currentUser.username,
        username: currentUser.username,
        avatarUrl: currentUser.profile?.avatar_url ?? null,
        href: `/profile/${currentUser.username}`,
      },
      message: "has upcoming plans",
      meta: activity.title,
      metaHref: `/activity/${activity.id}`,
    });
  }

  return seededItems;
}
