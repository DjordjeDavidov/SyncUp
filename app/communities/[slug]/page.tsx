import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MessageCircleMore, Pencil, Settings2, Sparkles, Users } from "lucide-react";
import {
  joinCommunityAction,
  leaveCommunityAction,
  removeCommunityMemberAction,
  updateCommunityMemberRoleAction,
} from "@/actions/communities";
import {
  cancelActivityPostAction,
  createCommentAction,
  createPostAction,
  deleteOwnPostAction,
  joinActivityPostAction,
  logoutAction,
  toggleLikeAction,
  toggleSaveAction,
  updateActivityPostAction,
  voteOnPollAction,
} from "@/actions/feed";
import { CreatePostCard } from "@/components/create-post-card";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { PostCard } from "@/components/post-card";
import { SuggestedActivityCard } from "@/components/suggested-activity-card";
import { getCommunityCategoryLabel } from "@/lib/community-categories";
import { mapPostRecordToPost } from "@/lib/post-mappers";
import { formatDistanceToNow, getInitials } from "@/lib/utils";
import { getCurrentUserOrRedirect } from "@/server/auth";
import {
  canAssignCommunityRoles,
  canEditCommunity,
  canManageCommunityMembers,
  canRemoveCommunityMember,
  getManageableRoles,
  type CommunityRole,
} from "@/server/community-permissions";
import { getCommunityPageData } from "@/server/queries";

function getRoleLabel(role: CommunityRole) {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "ADMIN":
      return "Admin";
    case "MODERATOR":
      return "Moderator";
    default:
      return "Member";
  }
}

function RoleBadge({ role }: { role: CommunityRole }) {
  const palette =
    role === "OWNER"
      ? "border-amber-300/20 bg-amber-400/10 text-amber-200"
      : role === "ADMIN"
        ? "border-sky-300/20 bg-sky-400/10 text-sky-200"
        : role === "MODERATOR"
          ? "border-indigo-300/20 bg-indigo-400/10 text-indigo-200"
          : "border-white/10 bg-white/[0.05] text-slate-200";

  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${palette}`}>{getRoleLabel(role)}</span>;
}

async function JoinLeaveButton({
  communityId,
  isMember,
  isOwner,
}: {
  communityId: string;
  isMember: boolean;
  isOwner: boolean;
}) {
  const join = async () => {
    "use server";
    await joinCommunityAction(communityId);
  };

  const leave = async () => {
    "use server";
    await leaveCommunityAction(communityId);
  };

  if (isOwner) {
    return <div className="rounded-2xl border border-emerald-300/18 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">Owner</div>;
  }

  return isMember ? (
    <form action={leave}>
      <button className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition-all duration-200 hover:bg-red-500/20" type="submit">
        Leave Community
      </button>
    </form>
  ) : (
    <form action={join}>
      <button className="rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5" type="submit">
        Join Community
      </button>
    </form>
  );
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CommunityPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const currentUser = await getCurrentUserOrRedirect();
  const data = await getCommunityPageData(currentUser.id, slug);

  if (!data) {
    notFound();
  }

  const { community, viewerMembership, posts, canViewPrivate } = data;
  const viewerRole = (viewerMembership?.role as CommunityRole | undefined) ?? null;
  const isOwner = community.owner_id === currentUser.id;
  const isMember = Boolean(viewerMembership) || isOwner;
  const canEdit = canEditCommunity(viewerRole);
  const canManageMembers = canManageCommunityMembers(viewerRole);
  const canAssignRoles = canAssignCommunityRoles(viewerRole);
  const categoryLabel = getCommunityCategoryLabel(community.category, community.custom_category);
  const feedPosts = posts.map((post) => mapPostRecordToPost(post, currentUser.id));
  const members = [...community.community_members].sort((left, right) => left.joined_at.getTime() - right.joined_at.getTime());
  const memberPreview = members.slice(0, 6);

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />

        <div className="mt-8 space-y-8">
          <Link href="/communities" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition-all duration-200 hover:text-indigo-100">
            <ArrowLeft className="h-4 w-4" />
            Back to communities
          </Link>

          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/8 bg-slate-950/70 shadow-[0_30px_80px_rgba(6,11,26,0.55)]">
            <div className="relative h-56 overflow-hidden sm:h-64">
              {community.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={community.name} className="h-full w-full object-cover" src={community.cover_url} />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(6,10,24,0.96))]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
            </div>

            <div className="relative px-6 pb-6 pt-4 sm:px-8">
              <div className="flex flex-col gap-6 rounded-[2rem] bg-slate-950/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.26)] lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:p-8">
                <div className="flex items-start gap-5">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl font-semibold text-white shadow-[0_20px_60px_rgba(99,102,241,0.18)] sm:h-24 sm:w-24">
                    {community.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={community.name} className="h-full w-full object-cover" src={community.icon_url} />
                    ) : (
                      getInitials(community.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {categoryLabel ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">{categoryLabel}</span> : null}
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">{community.visibility === "PUBLIC" ? "Public" : "Private"}</span>
                      {viewerRole ? <RoleBadge role={viewerRole} /> : null}
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
                        {community._count.activities} upcoming activities
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
                        <Sparkles className="h-4 w-4 text-slate-300" />
                        {community._count.posts} posts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                  <div className="text-sm leading-6 text-slate-400">
                    <p className="font-semibold text-slate-100">Created by</p>
                    <Link href={`/profile/${community.users.username}`} className="text-slate-200 hover:text-indigo-200">
                      {community.users.profiles?.full_name || community.users.username}
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    <JoinLeaveButton communityId={community.id} isMember={isMember} isOwner={isOwner} />
                    {isMember ? (
                      <>
                        <a className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]" href="#community-composer">
                          <Sparkles className="h-4 w-4" />
                          Create Content
                        </a>
                        <Link className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]" href={`/chats/${community.id}`}>
                          <MessageCircleMore className="h-4 w-4" />
                          Open Chat
                        </Link>
                      </>
                    ) : null}
                    {canEdit ? (
                      <Link className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]" href={`/communities/${community.slug}/edit`}>
                        <Pencil className="h-4 w-4" />
                        Edit Community
                      </Link>
                    ) : null}
                    {canManageMembers ? (
                      <a className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]" href="#members-management">
                        <Settings2 className="h-4 w-4" />
                        Manage Members
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
            <div className="space-y-6">
              <section className="surface-card rounded-3xl border border-white/8 p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">About</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Community overview</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {community.community_interests.map((item) => <span key={item.interests.name} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">{item.interests.name}</span>)}
                    {community.community_vibe_tags.map((item) => <span key={item.vibe_tags.name} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">{item.vibe_tags.name}</span>)}
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
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Created</p>
                    <p className="mt-3 text-sm font-semibold text-white">{formatDistanceToNow(community.created_at)} ago</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Posting access</p>
                    <p className="mt-3 text-sm font-semibold text-white">{isMember ? "Members can post" : "Join to post"}</p>
                  </div>
                </div>
              </section>

              {isMember ? (
                <section className="animate-feed-in" id="community-composer">
                  <CreatePostCard action={createPostAction} currentUser={currentUser} forcedCommunity={{ id: community.id, name: community.name, slug: community.slug }} />
                </section>
              ) : null}

              <section className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Community feed</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">Latest posts</h2>
                  </div>
                </div>

                {canViewPrivate ? (
                  feedPosts.length > 0 ? (
                    <div className="space-y-5">
                      {feedPosts.map((post, index) => (
                        <div className="animate-feed-in" key={post.id} style={{ animationDelay: `${Math.min(index * 70, 280)}ms` }}>
                          <PostCard
                            action={toggleLikeAction}
                            cancelAction={cancelActivityPostAction}
                            commentAction={createCommentAction}
                            deleteAction={deleteOwnPostAction}
                            joinAction={joinActivityPostAction}
                            post={post}
                            saveAction={toggleSaveAction}
                            updateAction={updateActivityPostAction}
                            voteAction={voteOnPollAction}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-200">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-white">No posts yet</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">This community is ready for updates, invites, polls, alerts, and activities.</p>
                    </div>
                  )
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-white">Join to unlock the community feed</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Members can see posts, activities, chat, and management tools from inside the space.</p>
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              {canViewPrivate ? (
                <>
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
                      <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Members</h2>
                    </div>
                    <div className="mt-5 space-y-3">
                      {memberPreview.map((membership) => (
                        <Link key={membership.user_id} href={`/profile/${membership.users.username}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all duration-200 hover:border-white/20">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-semibold text-white">
                            {membership.users.profiles?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img alt={membership.users.username} className="h-full w-full object-cover" src={membership.users.profiles.avatar_url} />
                            ) : (
                              getInitials(membership.users.profiles?.full_name || membership.users.username)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">{membership.users.profiles?.full_name || membership.users.username}</p>
                            <p className="text-xs text-muted-foreground">@{membership.users.username}</p>
                          </div>
                          <RoleBadge role={membership.role as CommunityRole} />
                        </Link>
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                <section className="surface-card rounded-3xl border border-white/8 p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Private space</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Join this community to view members, upcoming activities, and the private community feed.</p>
                </section>
              )}
            </aside>
          </div>

          {canViewPrivate ? (
            <section className="surface-card rounded-3xl border border-white/8 p-8" id="members-management">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Member management</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Roles and member controls</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {canManageMembers ? "Manage roles and membership directly from the community page." : "Current roles are visible here."}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {members.map((membership) => {
                  const targetRole = membership.role as CommunityRole;
                  const isSelf = membership.user_id === currentUser.id;
                  const removable = canRemoveCommunityMember({
                    actorRole: viewerRole,
                    targetRole,
                    isSelf,
                  });
                  const manageableRoles = getManageableRoles(viewerRole);
                  const canChangeRole = canAssignRoles && !isSelf && manageableRoles.length > 0 && targetRole !== "OWNER";

                  const saveRole = async (formData: FormData) => {
                    "use server";
                    const nextRole = formData.get("role");

                    if (typeof nextRole !== "string") {
                      return;
                    }

                    await updateCommunityMemberRoleAction({
                      communityId: community.id,
                      targetUserId: membership.user_id,
                      nextRole: nextRole as CommunityRole,
                    });
                  };

                  const removeMember = async () => {
                    "use server";
                    await removeCommunityMemberAction({
                      communityId: community.id,
                      targetUserId: membership.user_id,
                    });
                  };

                  return (
                    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:justify-between" key={membership.user_id}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-semibold text-white">
                          {membership.users.profiles?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt={membership.users.username} className="h-full w-full object-cover" src={membership.users.profiles.avatar_url} />
                          ) : (
                            getInitials(membership.users.profiles?.full_name || membership.users.username)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{membership.users.profiles?.full_name || membership.users.username}</p>
                          <p className="text-xs text-muted-foreground">@{membership.users.username} • Joined {formatDistanceToNow(membership.joined_at)} ago</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <RoleBadge role={targetRole} />
                        {canChangeRole ? (
                          <form action={saveRole} className="flex items-center gap-2">
                            <select className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-100" defaultValue={targetRole} name="role">
                              {[...manageableRoles].map((role) => (
                                <option key={role} value={role}>
                                  {getRoleLabel(role as CommunityRole)}
                                </option>
                              ))}
                            </select>
                            <button className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]" type="submit">
                              Save Role
                            </button>
                          </form>
                        ) : null}
                        {removable ? (
                          <form action={removeMember}>
                            <button className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-100 transition-all duration-200 hover:bg-rose-500/16" type="submit">
                              Remove Member
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <MobileNav />
      </div>
    </div>
  );
}
