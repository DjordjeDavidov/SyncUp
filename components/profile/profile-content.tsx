"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarClock,
  ImageIcon,
  MessageSquareText,
  Sparkles,
  SquareLibrary,
  Users,
  Vote,
  X,
} from "lucide-react";
import { PostCard } from "@/components/post-card";
import { ProfileActivity, ProfileCommunity, ProfileUser } from "@/components/profile/types";
import { InteractionState } from "@/lib/interaction-state";
import { SyncUpPost } from "@/lib/post-types";
import { formatDistanceToNow } from "@/lib/utils";

type TabKey = "all" | "posts" | "media" | "invites" | "activity" | "saved";

type TimelineItem =
  | {
      id: string;
      kind: "post";
      createdAt: Date;
      post: SyncUpPost;
    }
  | {
      id: string;
      kind: "activity";
      createdAt: Date;
      activity: ProfileActivity;
    }
  | {
      id: string;
      kind: "community";
      createdAt: Date;
      community: ProfileCommunity;
    };

type Props = {
  user: ProfileUser;
  posts: SyncUpPost[];
  likedPosts: SyncUpPost[];
  savedPosts: SyncUpPost[];
  communities: ProfileCommunity[];
  activities: ProfileActivity[];
  isOwner: boolean;
  likeAction: (formData: FormData) => Promise<void>;
  saveAction: (formData: FormData) => Promise<void>;
  commentAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  voteAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  joinAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  cancelAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  deleteAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  updateAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
};

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "all", label: "All", icon: SquareLibrary },
  { key: "posts", label: "Posts", icon: MessageSquareText },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "invites", label: "Invites", icon: Sparkles },
  { key: "activity", label: "Activity", icon: CalendarClock },
  { key: "saved", label: "Saved", icon: SquareLibrary },
];

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-indigo-200">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[0, 1].map((item) => (
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-6" key={item}>
          <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-6 w-2/3 animate-pulse rounded-full bg-white/10" />
          <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-white/8" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-white/8" />
          <div className="mt-5 h-32 animate-pulse rounded-2xl bg-white/8" />
        </div>
      ))}
    </div>
  );
}

function TimelineCard({ item }: { item: TimelineItem }) {
  if (item.kind === "community") {
    return (
      <article className="overflow-hidden rounded-2xl border border-emerald-300/12 bg-[linear-gradient(180deg,rgba(20,28,36,0.98),rgba(11,16,28,0.98))] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.26)]">
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-emerald-300/16 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Community
          </span>
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(item.createdAt)}</span>
        </div>
        <h3 className="mt-4 text-xl font-semibold text-white">{item.community.name}</h3>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {item.community.description || "A live space for discovering people, conversations, and future plans."}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            {item.community._count.community_members} members
          </span>
          <span className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            {[item.community.city, item.community.country].filter(Boolean).join(", ") || "Open to everyone"}
          </span>
        </div>
      </article>
    );
  }

  if (item.kind === "activity") {
    const activity = item.activity;

    return (
      <article className="overflow-hidden rounded-2xl border border-sky-300/12 bg-[linear-gradient(180deg,rgba(18,28,42,0.98),rgba(11,16,28,0.98))] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.26)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-sky-300/16 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
            Activity
          </span>
          {activity.communities ? (
            <span className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
              {activity.communities.name}
            </span>
          ) : null}
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(activity.start_time)}</span>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{activity.title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {activity.description || "Casual plan, open invite, and a good excuse to meet the right people."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-right">
            <p className="text-sm font-semibold text-white">{activity._count.activity_participants}</p>
            <p className="text-xs text-muted-foreground">going</p>
          </div>
        </div>
        {activity.image_url ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={activity.title} className="h-64 w-full object-cover" src={activity.image_url} />
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
            {[activity.city, activity.country].filter(Boolean).join(", ") || "Location to be announced"}
          </span>
        </div>
      </article>
    );
  }

  return null;
}

export function ProfileContent({
  user,
  posts,
  likedPosts,
  savedPosts,
  communities,
  activities,
  isOwner,
  likeAction,
  saveAction,
  commentAction,
  voteAction,
  joinAction,
  cancelAction,
  deleteAction,
  updateAction,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedMedia, setSelectedMedia] = useState<{ src: string; caption: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const standardPosts = useMemo(() => posts.filter((post) => post.type === "standard_post"), [posts]);
  const invitePosts = useMemo(() => posts.filter((post) => post.type === "invite_post"), [posts]);
  const pollPosts = useMemo(() => posts.filter((post) => post.type === "poll_post"), [posts]);
  const communityPosts = useMemo(() => posts.filter((post) => post.type === "community_post"), [posts]);
  const activityPosts = useMemo(() => posts.filter((post) => post.type === "activity_post"), [posts]);
  const mediaPosts = useMemo(() => posts.filter((post) => Boolean(post.imageUrl)), [posts]);

  const communityTimelineItems = useMemo<TimelineItem[]>(
    () =>
      communities.map((community) => ({
        id: `community-${community.id}`,
        kind: "community",
        createdAt: community.created_at,
        community,
      })),
    [communities],
  );

  const activityTimelineItems = useMemo<TimelineItem[]>(
    () =>
      activities.map((activity) => ({
        id: `activity-${activity.id}`,
        kind: "activity",
        createdAt: activity.created_at,
        activity,
      })),
    [activities],
  );

  const allTimelineItems = useMemo<TimelineItem[]>(
    () =>
      [
        ...posts.map((post) => ({
          id: `post-${post.id}`,
          kind: "post" as const,
          createdAt: post.createdAt,
          post,
        })),
        ...communityTimelineItems,
        ...activityTimelineItems,
      ].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
    [posts, communityTimelineItems, activityTimelineItems],
  );

  const currentTabContent = useMemo(() => {
    switch (activeTab) {
      case "posts":
        return {
          kind: "posts" as const,
          items: standardPosts,
        };
      case "media":
        return {
          kind: "media" as const,
          items: mediaPosts,
        };
      case "invites":
        return {
          kind: "posts" as const,
          items: invitePosts,
        };
      case "activity":
        return {
          kind: "mixed" as const,
          items: [
            ...activityPosts.map((post) => ({
              id: `post-${post.id}`,
              kind: "post" as const,
              createdAt: post.createdAt,
              post,
            })),
            ...activityTimelineItems,
          ].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
        };
      case "saved":
        return {
          kind: "posts" as const,
          items: savedPosts,
        };
      case "all":
      default:
        return {
          kind: "mixed" as const,
          items: allTimelineItems,
        };
    }
  }, [
    activeTab,
    activityPosts,
    activityTimelineItems,
    allTimelineItems,
    communityPosts,
    communityTimelineItems,
    invitePosts,
    mediaPosts,
    pollPosts,
    savedPosts,
    standardPosts,
  ]);

  function renderPost(post: SyncUpPost) {
    return (
      <PostCard
        action={likeAction}
        cancelAction={cancelAction}
        commentAction={commentAction}
        deleteAction={deleteAction}
        joinAction={joinAction}
        key={post.id}
        post={post}
        updateAction={updateAction}
        saveAction={saveAction}
        voteAction={voteAction}
      />
    );
  }

  function renderEmptyState() {
    switch (activeTab) {
      case "posts":
        return (
          <EmptyState
            icon={MessageSquareText}
            title="No posts yet"
            description="Casual updates, thoughts, and memes will show up here once this profile starts posting."
          />
        );
      case "media":
        return (
          <EmptyState
            icon={ImageIcon}
            title="No media yet"
            description="Photos and visual updates will collect here in a clean gallery view."
          />
        );
      case "invites":
        return (
          <EmptyState
            icon={Sparkles}
            title="No invites yet"
            description="Invite-style plans will show up here as soon as this profile starts organizing ideas."
          />
        );
      case "activity":
        return (
          <EmptyState
            icon={CalendarClock}
            title="No activity content yet"
            description="Meetups, plans, and activity updates tied to this profile will appear here."
          />
        );
      case "saved":
        return (
          <EmptyState
            icon={SquareLibrary}
            title="No saved posts yet"
            description="Posts you bookmark from the feed will show up here for easy return visits."
          />
        );
      case "all":
      default:
        return (
          <EmptyState
            icon={SquareLibrary}
            title="Nothing here yet"
            description="Once this profile starts posting, joining, and planning, everything will appear here in one timeline."
          />
        );
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-3xl border border-white/10 bg-slate-950/70 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
          {TAB_CONFIG.map((tab) => {
            if (tab.key === "saved" && !isOwner) {
              return null;
            }

            const Icon = tab.icon;
            const isActive = tab.key === activeTab;

            return (
              <button
                className={`inline-flex min-w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-[0_14px_24px_rgba(99,102,241,0.18)]"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                }`}
                key={tab.key}
                onClick={() => startTransition(() => setActiveTab(tab.key))}
                type="button"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`transition-all duration-200 ${isPending ? "opacity-70" : "opacity-100"}`}>
        {isPending ? (
          <LoadingState />
        ) : currentTabContent.kind === "media" ? (
          currentTabContent.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {currentTabContent.items.map((post) => (
                <button
                  className="group aspect-square overflow-hidden rounded-2xl border border-white/8 bg-slate-950/70"
                  key={post.id}
                  onClick={() =>
                    setSelectedMedia({
                      src: post.imageUrl ?? "",
                      caption: post.content,
                    })
                  }
                  type="button"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Profile media item"
                    className="h-full w-full object-cover transition-all duration-200 group-hover:scale-[1.03]"
                    src={post.imageUrl ?? ""}
                  />
                </button>
              ))}
            </div>
          ) : (
            renderEmptyState()
          )
        ) : currentTabContent.kind === "posts" ? (
          currentTabContent.items.length > 0 ? (
            <div className="space-y-4">
              {currentTabContent.items.map((post) => renderPost(post))}
            </div>
          ) : (
            renderEmptyState()
          )
        ) : currentTabContent.items.length > 0 ? (
          <div className="space-y-4">
            {currentTabContent.items.map((item) =>
              item.kind === "post" ? renderPost(item.post) : <TimelineCard item={item} key={item.id} />,
            )}
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>

      {selectedMedia ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,7,18,0.88)] p-4 backdrop-blur-md">
          <button
            aria-label="Close media viewer"
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white"
            onClick={() => setSelectedMedia(null)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.98),rgba(8,12,24,0.98))] shadow-[0_30px_90px_rgba(2,6,23,0.5)]">
            <div className="max-h-[78vh] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Expanded media" className="max-h-[78vh] w-full object-contain" src={selectedMedia.src} />
            </div>
            <div className="border-t border-white/8 px-5 py-4">
              <p className="text-sm leading-6 text-muted-foreground">{selectedMedia.caption || "Shared on SyncUp"}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
