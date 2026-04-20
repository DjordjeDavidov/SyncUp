"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, MapPin, Pencil, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import { getInitials } from "@/lib/utils";
import { ProfileFollowControls } from "@/components/profile/profile-follow-controls";
import { FollowListModal } from "@/components/profile/follow-list-modal";
import { MatchBadge } from "@/components/match-badge";
import { ProfileActivity, ProfileCommunity, ProfileFollowListUser, ProfileStats, ProfileUser } from "@/components/profile/types";

type Props = {
  user: ProfileUser;
  stats: ProfileStats;
  followers: ProfileFollowListUser[];
  following: ProfileFollowListUser[];
  communities: ProfileCommunity[];
  activities: ProfileActivity[];
  isOwner: boolean;
  followAction?: (targetUserId: string) => Promise<{ ok: boolean; message?: string }>;
  unfollowAction?: (targetUserId: string) => Promise<{ ok: boolean; message?: string }>;
  removeFollowerAction?: (followerUserId: string) => Promise<{ ok: boolean; message?: string }>;
};

function formatJoinedDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
}

export function ProfileHeader({
  user,
  stats,
  followers,
  following,
  communities,
  activities,
  isOwner,
  followAction,
  unfollowAction,
  removeFollowerAction,
}: Props) {
  const displayName = user.profile?.full_name ?? user.username;
  const location = [user.profile?.city, user.profile?.country].filter(Boolean).join(", ");
  const [followersCount, setFollowersCount] = useState(stats.followers);
  const [followingCount, setFollowingCount] = useState(stats.following);
  const [followersList, setFollowersList] = useState(followers);
  const [followingList, setFollowingList] = useState(following);
  const [openListMode, setOpenListMode] = useState<"followers" | "following" | "communities" | "activities" | null>(null);
  const tags = [
    ...user.user_interests.slice(0, 3).map((entry) => entry.interests.name),
    ...user.user_vibe_tags.slice(0, 2).map((entry) => entry.vibe_tags.name),
  ].slice(0, 5);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(16,22,38,0.98),rgba(9,13,24,0.98))] shadow-[0_24px_70px_rgba(2,6,23,0.36),0_0_36px_rgba(99,102,241,0.08)]">
      <div className="relative h-44 overflow-hidden border-b border-white/8 sm:h-56">
        {user.profile?.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${displayName} cover`} className="h-full w-full object-cover" src={user.profile.cover_url} />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_26%),radial-gradient(circle_at_top_right,rgba(129,140,248,0.28),transparent_30%),linear-gradient(135deg,rgba(30,41,59,0.92),rgba(10,14,26,0.98))]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(9,13,24,0.35)_78%,rgba(9,13,24,0.9))]" />
      </div>

      <div className="relative px-4 pb-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-12 flex items-end gap-4 sm:-mt-16">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#0c1323] bg-[linear-gradient(135deg,rgba(99,102,241,0.4),rgba(59,130,246,0.22))] text-2xl font-semibold text-white shadow-[0_18px_42px_rgba(2,6,23,0.44)] sm:h-32 sm:w-32">
              {user.profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={displayName} className="h-full w-full object-cover" src={user.profile.avatar_url} />
              ) : (
                getInitials(displayName)
              )}
            </div>

            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{displayName}</h1>
                {user.matchScore !== null && user.matchScore !== undefined ? <MatchBadge score={user.matchScore} /> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:justify-end">
            {isOwner ? (
              <>
                <Link
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/8"
                  href="/profile/edit"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </Link>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(99,102,241,0.34)]"
                  type="button"
                >
                  <Share2 className="h-4 w-4" />
                  Share Profile
                </button>
              </>
            ) : (
              followAction && unfollowAction ? (
                <ProfileFollowControls
                  followAction={followAction}
                  initialIsFollowing={user.isFollowedByViewer}
                  onFollowersCountChange={(delta) =>
                    setFollowersCount((count) => Math.max(0, count + delta))
                  }
                  targetUserId={user.id}
                  unfollowAction={unfollowAction}
                />
              ) : null
            )}
          </div>
        </div>

        <div className="mt-5 max-w-3xl">
          {user.cautionBanner ? (
            <div className="mb-4 rounded-2xl border border-amber-300/18 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <p className="leading-6">{user.cautionBanner}</p>
              </div>
            </div>
          ) : null}
          <p className="text-sm leading-7 text-slate-200">
            {user.profile?.bio ||
              "Building real connections through casual posts, community discovery, and spontaneous plans around the city."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {location ? (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-300" />
              {location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-indigo-300" />
            Joined {formatJoinedDate(user.created_at)}
          </span>
        </div>

        {tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200"
                key={tag}
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 border-t border-white/8 pt-5 sm:grid-cols-5">
          {[
            { label: "Posts", value: stats.posts },
            { label: "Followers", value: followersCount, clickable: true, onClick: () => setOpenListMode("followers") },
            { label: "Following", value: followingCount, clickable: true, onClick: () => setOpenListMode("following") },
            { label: "Communities", value: stats.communities, clickable: true, onClick: () => setOpenListMode("communities") },
            { label: "Activities", value: stats.activities, clickable: true, onClick: () => setOpenListMode("activities") },
          ].map((stat) =>
            stat.clickable ? (
              <button
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/35"
                key={stat.label}
                onClick={stat.onClick}
                type="button"
              >
                <p className="text-xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
              </button>
            ) : (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3" key={stat.label}>
                <p className="text-xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
              </div>
            ),
          )}
        </div>
      </div>

      <FollowListModal
        isOpen={openListMode === "followers"}
        isOwner={isOwner}
        mode="followers"
        onClose={() => setOpenListMode(null)}
        onCountChange={setFollowersCount}
        onUsersChange={setFollowersList}
        removeFollowerAction={removeFollowerAction}
        title="Followers"
        users={followersList}
      />
      <FollowListModal
        isOpen={openListMode === "following"}
        isOwner={isOwner}
        mode="following"
        onClose={() => setOpenListMode(null)}
        onCountChange={setFollowingCount}
        onUsersChange={setFollowingList}
        title="Following"
        unfollowAction={unfollowAction}
        users={followingList}
      />
      <FollowListModal
        communities={communities}
        isOpen={openListMode === "communities"}
        isOwner={isOwner}
        mode="communities"
        onClose={() => setOpenListMode(null)}
        onCountChange={() => {}}
        onUsersChange={() => {}}
        title="Communities"
      />
      <FollowListModal
        activities={activities}
        isOpen={openListMode === "activities"}
        isOwner={isOwner}
        mode="activities"
        onClose={() => setOpenListMode(null)}
        onCountChange={() => {}}
        onUsersChange={() => {}}
        title="Activities"
      />
    </section>
  );
}
