import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Globe2, Lock, MapPin, Sparkles, Users } from "lucide-react";
import { logoutAction } from "@/actions/feed";
import { joinCommunityAction, leaveCommunityAction } from "@/actions/communities";
import { Navbar } from "@/components/navbar";
import { MobileNav } from "@/components/mobile-nav";
import { SuggestedActivityCard } from "@/components/suggested-activity-card";
import { getCommunityCategoryLabel } from "@/lib/community-categories";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "@/lib/utils";

function getRoleLabel(role: "OWNER" | "MODERATOR" | "MEMBER") {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "MODERATOR":
      return "Moderator";
    default:
      return "Member";
  }
}

function RoleBadge({ role }: { role: "OWNER" | "MODERATOR" | "MEMBER" }) {
  const palette =
    role === "OWNER"
      ? "border-amber-300/20 bg-amber-400/10 text-amber-200"
      : role === "MODERATOR"
      ? "border-indigo-300/20 bg-indigo-400/10 text-indigo-200"
      : "border-white/10 bg-white/[0.05] text-slate-200";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${palette}`}>
      {getRoleLabel(role)}
    </span>
  );
}

async function JoinButton({ communityId, isMember, isOwner }: { communityId: string; isMember: boolean; isOwner: boolean }) {
  const handleJoin = async () => {
    "use server";
    await joinCommunityAction(communityId);
  };

  const handleLeave = async () => {
    "use server";
    await leaveCommunityAction(communityId);
  };

  if (isOwner) {
    return (
      <div className="rounded-3xl border border-emerald-300/10 bg-emerald-400/5 px-4 py-3 text-sm font-semibold text-emerald-200">
        Owner
      </div>
    );
  }

  return isMember ? (
    <form action={handleLeave}>
      <button
        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition-all duration-200 hover:bg-red-500/20 hover:border-red-500/50"
        type="submit"
      >
        Leave Community
      </button>
    </form>
  ) : (
    <form action={handleJoin}>
      <button
        className="rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5"
        type="submit"
      >
        Join Community
      </button>
    </form>
  );
}

async function handleJoinPrivate(formData: FormData) {
  "use server";
  const communityId = formData.get("communityId") as string;
  await joinCommunityAction(communityId);
}

export default async function CommunityPage({ params }: { params: { slug: string } }) {
  const currentUser = await getCurrentUserOrRedirect();
  const now = new Date();

  const community = await prisma.communities.findUnique({
    where: { slug: params.slug },
    include: {
      users: {
        include: {
          profiles: true,
        },
      },
      community_interests: {
        select: {
          interests: {
            select: {
              name: true,
            },
          },
        },
      },
      community_vibe_tags: {
        select: {
          vibe_tags: {
            select: {
              name: true,
            },
          },
        },
      },
      community_members: {
        take: 10,
        include: {
          users: {
            include: {
              profiles: true,
            },
          },
        },
      },
      posts: {
        take: 6,
        orderBy: { created_at: "desc" },
        include: {
          users: {
            include: {
              profiles: true,
            },
          },
        },
      },
      activities: {
        where: {
          status: "OPEN",
          start_time: { gte: now },
        },
        orderBy: { start_time: "asc" },
        take: 4,
        include: {
          _count: {
            select: {
              activity_participants: true,
            },
          },
        },
      },
      _count: {
        select: {
          community_members: true,
          posts: true,
          activities: true,
        },
      },
    },
  });

  if (!community) {
    redirect("/communities");
  }

  const categoryLabel = getCommunityCategoryLabel(community.category, community.custom_category);
  const isMember = community.community_members.some((member) => member.user_id === currentUser.id);
  const isOwner = community.owner_id === currentUser.id;
  const hasFullAccess = community.visibility === "PUBLIC" || isMember || isOwner;

  const owner = community.users;
  const moderators = community.community_members.filter((member) => member.role === "MODERATOR");
  const membersPreview = community.community_members.filter((member) => member.user_id !== community.owner_id).slice(0, 8);
  const mediaPosts = community.posts.filter((post) => post.image_url).slice(0, 3);
  const interestTags = community.community_interests.map((item) => item.interests.name);
  const vibeTags = community.community_vibe_tags.map((item) => item.vibe_tags.name);

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />

        <div className="mt-8 space-y-8">
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition-all duration-200 hover:text-indigo-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to communities
          </Link>

          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/8 bg-slate-950/70 shadow-[0_30px_80px_rgba(6,11,26,0.55)]">
            <div className="relative h-56 overflow-hidden sm:h-64">
              {community.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={community.cover_url} alt={community.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(6,10,24,0.96))]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
            </div>

            <div className="relative px-6 pb-6 pt-4 sm:px-8">
              <div className="flex flex-col gap-6 rounded-[2rem] bg-slate-950/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.26)] lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:p-8">
                <div className="flex items-start gap-5">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl font-semibold text-white shadow-[0_20px_60px_rgba(99,102,241,0.18)] sm:h-24 sm:w-24">
                    {community.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {categoryLabel ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                          {categoryLabel}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                        {community.visibility === "PUBLIC" ? "Public" : "Private"}
                      </span>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{community.name}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                      {community.description || "A community for focused discussions, shared plans, and member-driven content."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
                        <Users className="h-4 w-4 text-slate-300" />
                        {community._count.community_members} members
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
                        <CalendarDays className="h-4 w-4 text-slate-300" />
                        {community._count.activities} upcoming events
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
                        <Sparkles className="h-4 w-4 text-slate-300" />
                        {community._count.posts} posts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right text-sm leading-6 text-slate-400">
                    <p className="font-semibold text-slate-100">Created by</p>
                    <Link href={`/profile/${owner.username}`} className="text-slate-200 hover:text-indigo-200">
                      {owner.profiles?.full_name || owner.username}
                    </Link>
                  </div>
                  <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
                    <JoinButton communityId={community.id} isMember={isMember} isOwner={isOwner} />
                    {(isMember || isOwner) && (
                      <Link
                        href={`/communities/${community.slug}/chat`}
                        className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]"
                      >
                        Open community chat
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
            <div className="space-y-6">
              <section className="surface-card rounded-3xl border border-white/8 p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">About</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Community overview</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interestTags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                        {tag}
                      </span>
                    ))}
                    {vibeTags.map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Category</p>
                    <p className="mt-3 text-sm font-semibold text-white">{categoryLabel || "Uncategorized"}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Visibility</p>
                    <p className="mt-3 text-sm font-semibold text-white">{community.visibility === "PUBLIC" ? "Public" : "Private"}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Location</p>
                    <p className="mt-3 text-sm font-semibold text-white">
                      {community.city || community.country
                        ? [community.city, community.country].filter(Boolean).join(", ")
                        : "No location set"}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Created</p>
                    <p className="mt-3 text-sm font-semibold text-white">{formatDistanceToNow(new Date(community.created_at))} ago</p>
                  </div>
                </div>
              </section>

              <section className="surface-card rounded-3xl border border-white/8 p-8">
                <div className="flex items-center gap-3 text-sky-200">
                  <Sparkles className="h-4 w-4" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Community roles</h2>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Owner</p>
                    <Link href={`/profile/${owner.username}`} className="mt-3 block text-sm font-semibold text-white hover:text-indigo-200">
                      {owner.profiles?.full_name || owner.username}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">@{owner.username}</p>
                  </div>
                  {moderators.length > 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Moderators</p>
                      <div className="mt-3 space-y-3">
                        {moderators.map((membership) => (
                          <Link
                            key={membership.users.id}
                            href={`/profile/${membership.users.username}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-all duration-200 hover:border-white/20"
                          >
                            <div>
                              <p className="text-sm font-semibold text-white">{membership.users.profiles?.full_name || membership.users.username}</p>
                              <p className="text-xs text-muted-foreground">@{membership.users.username}</p>
                            </div>
                            <RoleBadge role={membership.role} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              {mediaPosts.length > 0 ? (
                <section className="surface-card rounded-3xl border border-white/8 p-8">
                  <div className="flex items-center gap-3 text-sky-200">
                    <Globe2 className="h-4 w-4" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Media</h2>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {mediaPosts.map((post) => (
                      <Link
                        href={`/posts/${post.id}`}
                        key={post.id}
                        className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition-all duration-200 hover:border-white/20"
                      >
                        <div className="h-36 w-full overflow-hidden bg-slate-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.image_url ?? ""}
                            alt={post.content.slice(0, 60)}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="space-y-6">
              <SuggestedActivityCard
                activities={community.activities.map((activity) => ({
                  id: activity.id,
                  title: activity.title,
                  location_text: activity.location_text,
                  city: activity.city,
                  country: activity.country,
                  start_time: activity.start_time,
                  _count: {
                    activity_participants: activity._count.activity_participants,
                  },
                }))}
              />

              <section className="surface-card rounded-3xl border border-white/8 p-8">
                <div className="flex items-center gap-3 text-sky-200">
                  <Users className="h-4 w-4" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Members preview</h2>
                </div>
                <div className="mt-5 space-y-3">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Owner</p>
                    <Link href={`/profile/${owner.username}`} className="mt-3 block text-sm font-semibold text-white hover:text-indigo-200">
                      {owner.profiles?.full_name || owner.username}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">@{owner.username}</p>
                  </div>
                  {membersPreview.length > 0 ? (
                    <div className="grid gap-3">
                      {membersPreview.map((membership) => (
                        <Link
                          key={membership.users.id}
                          href={`/profile/${membership.users.username}`}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all duration-200 hover:border-white/20"
                        >
                          {membership.users.profiles?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={membership.users.profiles.full_name}
                              src={membership.users.profiles.avatar_url}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">{membership.users.profiles?.full_name || membership.users.username}</p>
                            <p className="text-xs text-muted-foreground">@{membership.users.username}</p>
                          </div>
                          <RoleBadge role={membership.role} />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-200">No additional members to preview yet.</p>
                  )}
                </div>
              </section>
            </aside>
          </div>

          <section className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Community feed</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Latest posts</h2>
              </div>
              <Link href="/communities" className="text-sm font-semibold text-slate-300 transition-all duration-200 hover:text-white">
                Explore communities →
              </Link>
            </div>

            {hasFullAccess ? (
              <div className="grid gap-4">
                {community.posts.length > 0 ? (
                  community.posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="group block overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 p-6 transition-all duration-200 hover:border-white/20 hover:bg-slate-900"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">{post.users.profiles?.full_name || post.users.username}</p>
                          <p className="mt-2 text-2xl font-semibold text-white line-clamp-2">{post.content.slice(0, 120) || "Shared a post"}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                          <span>{formatDistanceToNow(post.created_at)}</span>
                          <span>&bull;</span>
                          <span>{community.name}</span>
                        </div>
                      </div>
                      {post.image_url ? (
                        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt="Post preview" className="h-48 w-full object-cover" src={post.image_url} />
                        </div>
                      ) : null}
                    </Link>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-200">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-white">No posts yet</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Be the first to start the conversation in this community.
                    </p>
                    {(isMember || isOwner) && (
                      <div className="mt-6">
                        <Link
                          href="/home"
                          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5"
                        >
                          <Sparkles className="h-4 w-4" />
                          Create a post
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                  <Lock className="h-6 w-6" />
                </div>
                <p className="mt-4 text-lg font-semibold text-white">Private community</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Join this community to view posts, events, and member activity.
                </p>
                {!isOwner && (
                  <div className="mt-6">
                    <form action={handleJoinPrivate}>
                      <input type="hidden" name="communityId" value={community.id} />
                      <button
                        className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5"
                        type="submit"
                      >
                        <Users className="h-4 w-4" />
                        Join Community
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <MobileNav />
      </div>
    </div>
  );
}
