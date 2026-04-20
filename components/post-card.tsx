"use client";

import Link from "next/link";
import { LikeButton } from "@/components/post-like-button";
import { PostCommentsModal } from "@/components/post-comments-modal";
import { PostActionForm } from "@/components/post-action-form";
import { PostOwnerActions } from "@/components/post-owner-actions";
import { formatDistanceToNow } from "@/lib/utils";
import { InteractionState } from "@/lib/interaction-state";
import { PollPost, SyncUpPost } from "@/lib/post-types";
import {
  Bookmark,
  CalendarClock,
  Globe2,
  MapPin,
  Share,
  Users,
} from "lucide-react";
import { useCallback, useState } from "react";

type Props = {
  post: SyncUpPost;
  action: (formData: FormData) => Promise<void>;
  saveAction: (formData: FormData) => Promise<void>;
  commentAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  voteAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  joinAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  cancelAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  deleteAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  updateAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
};

function getAuthorProfileHref(username: string) {
  return `/profile/${username}`;
}

function TypeBadge({ post }: { post: SyncUpPost }) {
  if (post.type === "invite_post") {
    return (
      <span className="rounded-xl border border-sky-300/18 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
        Invite
      </span>
    );
  }

  if (post.type === "poll_post") {
    return (
      <span className="rounded-xl border border-indigo-300/18 bg-indigo-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
        Poll
      </span>
    );
  }

  if (post.type === "community_post") {
    return (
      <span className="rounded-xl border border-fuchsia-300/18 bg-fuchsia-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200">
        Community
      </span>
    );
  }

  if (post.type === "activity_post") {
    return (
      <span className="rounded-xl border border-emerald-300/18 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
        Activity
      </span>
    );
  }

  if (post.type === "alert_post") {
    return (
      <span className="rounded-xl border border-amber-300/18 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
        Alert
      </span>
    );
  }

  return (
    <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
      Post
    </span>
  );
}

function StatusPill({ status }: { status: "open" | "full" | "closed" | "cancelled" }) {
  const palette =
    status === "open"
      ? "border-emerald-300/18 bg-emerald-400/10 text-emerald-200"
      : status === "full"
        ? "border-amber-300/18 bg-amber-400/10 text-amber-200"
        : status === "cancelled"
          ? "border-rose-300/18 bg-rose-400/10 text-rose-200"
          : "border-slate-300/18 bg-slate-400/10 text-slate-200";

  return (
    <span className={`rounded-xl border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${palette}`}>
      {status}
    </span>
  );
}

function InviteVisibilityPill({ visibility }: { visibility: "public" | "followers_friends" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-slate-200">
      {visibility === "public" ? <Globe2 className="h-3.5 w-3.5 text-sky-200" /> : <Users className="h-3.5 w-3.5 text-indigo-200" />}
      {visibility === "public" ? "Public" : "Followers & Friends"}
    </span>
  );
}

function PollOptions({
  post,
  voteAction,
}: {
  post: PollPost;
  voteAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
}) {
  return (
    <div className="mt-5 space-y-3">
      {post.poll.options.map((option) => (
        <PostActionForm
          action={voteAction}
          className={`w-full overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
            option.isSelectedByCurrentUser
              ? "border-indigo-300/24 bg-indigo-400/10"
              : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]"
          }`}
          disabled={!post.poll.canVote}
          hiddenFields={{ postId: post.id, optionId: option.id }}
          idleLabel={option.label}
          key={option.id}
          pendingLabel="Voting..."
        >
          <div
            className="h-full bg-[linear-gradient(90deg,rgba(99,102,241,0.18),rgba(56,189,248,0.12))]"
            style={{ width: `${Math.max(option.percentage, 6)}%` }}
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm font-semibold text-slate-100">{option.label}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                {option.percentage}%
              </span>
            </div>
          </div>
        </PostActionForm>
      ))}
      <div className="flex flex-wrap items-center gap-2 px-1 text-xs text-muted-foreground">
        <span>{post.poll.totalVotes} votes</span>
        {post.poll.endsAt ? <span>&bull; ends {formatDistanceToNow(post.poll.endsAt)}</span> : null}
        <span>&bull; {post.poll.status === "closed" ? "Closed" : "Open"}</span>
      </div>
    </div>
  );
}

function MetaPill({
  icon: Icon,
  label,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  colorClass?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
      <Icon className={`h-4 w-4 ${colorClass ?? "text-indigo-300"}`} />
      {label}
    </span>
  );
}

function PostBody({
  post,
  voteAction,
  joinAction,
}: {
  post: SyncUpPost;
  voteAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
  joinAction: (state: InteractionState, formData: FormData) => Promise<InteractionState>;
}) {
  switch (post.type) {
    case "invite_post":
      return (
        <div className="mt-5 rounded-2xl border border-sky-300/12 bg-[linear-gradient(180deg,rgba(22,32,48,0.92),rgba(11,16,28,0.98))] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge post={post} />
            <StatusPill status={post.invite.status} />
            <InviteVisibilityPill visibility={post.invite.visibility} />
            {post.invite.startsAt ? <span className="text-xs text-muted-foreground">{formatDistanceToNow(post.invite.startsAt)}</span> : null}
          </div>
          <h3 className="mt-4 text-xl font-semibold text-white">{post.invite.title}</h3>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-200">{post.invite.description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {post.invite.startsAt ? (
              <MetaPill colorClass="text-sky-300" icon={CalendarClock} label={formatDistanceToNow(post.invite.startsAt)} />
            ) : null}
            {post.invite.locationText ? <MetaPill colorClass="text-sky-300" icon={MapPin} label={post.invite.locationText} /> : null}
            <MetaPill
              colorClass="text-indigo-300"
              icon={Users}
              label={
                post.invite.maxParticipants
                  ? `${post.invite.joinedCount}/${post.invite.maxParticipants} joined`
                  : `${post.invite.joinedCount} joined`
              }
            />
          </div>
          {post.imageUrl ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/8 bg-slate-950/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Invite post attachment"
                className="max-h-[420px] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                src={post.imageUrl}
              />
            </div>
          ) : null}
          <div className="mt-5">
            {post.invite.activityId ? (
              <PostActionForm
                action={joinAction}
                className="rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!post.invite.canJoin}
                hiddenFields={{ activityId: post.invite.activityId }}
                idleLabel={post.invite.viewerHasJoined ? "Joined" : "Join"}
                pendingLabel="Joining..."
              />
            ) : null}
          </div>
        </div>
      );
    case "poll_post":
      return (
        <>
          {post.content ? <p className="relative mt-5 whitespace-pre-wrap text-[15px] leading-7 text-slate-200">{post.content}</p> : null}
          <div className="mt-5 rounded-2xl border border-indigo-300/12 bg-[linear-gradient(180deg,rgba(21,30,48,0.92),rgba(11,16,28,0.98))] p-5">
            <div className="flex items-center gap-2">
              <TypeBadge post={post} />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-white">{post.poll.question}</h3>
            <PollOptions post={post} voteAction={voteAction} />
          </div>
        </>
      );
    case "alert_post":
      return (
        <div className="mt-5 rounded-2xl border border-amber-300/12 bg-[linear-gradient(180deg,rgba(52,34,12,0.28),rgba(11,16,28,0.98))] p-5">
          <div className="flex items-center gap-2">
            <TypeBadge post={post} />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-white">{post.alert.title}</h3>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-200">{post.content}</p>
          {post.imageUrl ? (
            <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/8 bg-slate-950/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Alert post attachment" className="max-h-[420px] w-full object-cover transition duration-500 group-hover:scale-[1.02]" src={post.imageUrl} />
            </div>
          ) : null}
        </div>
      );
    case "community_post":
      return (
        <>
          <p className="relative mt-5 whitespace-pre-wrap text-[15px] leading-7 text-slate-200">{post.content}</p>
          {post.imageUrl ? (
            <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/8 bg-slate-950/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Community post attachment"
                className="max-h-[420px] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                src={post.imageUrl}
              />
            </div>
          ) : null}
        </>
      );
    case "activity_post":
      return (
        <div className="mt-5 rounded-2xl border border-emerald-300/12 bg-[linear-gradient(180deg,rgba(18,33,34,0.92),rgba(11,16,28,0.98))] p-5">
          <div className="flex items-center gap-2">
            <TypeBadge post={post} />
            <StatusPill status={post.activityPost.status} />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-white">{post.activityPost.title}</h3>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-200">{post.content}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {post.activityPost.startsAt ? (
              <MetaPill colorClass="text-emerald-300" icon={CalendarClock} label={formatDistanceToNow(post.activityPost.startsAt)} />
            ) : null}
            {post.activityPost.locationText ? <MetaPill colorClass="text-sky-300" icon={MapPin} label={post.activityPost.locationText} /> : null}
            <MetaPill
              colorClass="text-indigo-300"
              icon={Users}
              label={
                post.activityPost.maxParticipants
                  ? `${post.activityPost.goingCount}/${post.activityPost.maxParticipants} going`
                  : `${post.activityPost.goingCount} going`
              }
            />
          </div>
          <div className="mt-5">
            {post.activityPost.activityId ? (
              <PostActionForm
                action={joinAction}
                className="rounded-2xl bg-[linear-gradient(135deg,#10b981,#06b6d4)] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!post.activityPost.canJoin}
                hiddenFields={{ activityId: post.activityPost.activityId }}
                idleLabel={post.activityPost.viewerHasJoined ? "Joined" : "I'm in"}
                pendingLabel="Joining..."
              />
            ) : null}
          </div>
        </div>
      );
    case "standard_post":
    default:
      return (
        <>
          <p className="relative mt-5 whitespace-pre-wrap text-[15px] leading-7 text-slate-200">{post.content}</p>
          {post.imageUrl ? (
            <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/8 bg-slate-950/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Post attachment"
                className="max-h-[420px] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                src={post.imageUrl}
              />
            </div>
          ) : null}
        </>
      );
  }
}

export function PostCard({
  post,
  action,
  saveAction,
  commentAction,
  voteAction,
  joinAction,
  cancelAction,
  deleteAction,
  updateAction,
}: Props) {
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [liked, setLiked] = useState(post.likedByCurrentUser);

  const handleLike = useCallback(async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
      const formData = new FormData();
      formData.append('postId', post.id);
      await action(formData);
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setLikesCount(prev => newLiked ? prev - 1 : prev + 1);
    }
  }, [liked, action, post.id]);
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(24,32,52,0.94),rgba(11,16,28,0.96))] p-4 shadow-[0_18px_48px_rgba(2,6,23,0.34),0_0_0_1px_rgba(255,255,255,0.02),0_0_28px_rgba(99,102,241,0.06)] transition-all duration-200 hover:scale-[1.01] hover:border-indigo-300/20 hover:shadow-[0_24px_56px_rgba(2,6,23,0.42),0_0_0_1px_rgba(129,140,248,0.08),0_0_36px_rgba(99,102,241,0.1)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.07),transparent_28%)] opacity-80" />
      <div className="relative flex items-start gap-4">
        <Link
          href={getAuthorProfileHref(post.author.username)}
          className="group/author flex min-w-0 flex-1 items-start gap-4 rounded-2xl -m-2 p-2 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/35 hover:bg-white/[0.03]"
          aria-label={`Open ${post.author.name}'s profile`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.36),rgba(59,130,246,0.18))] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.35)]">
            {post.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={post.author.name} className="h-full w-full object-cover" src={post.author.avatarUrl} />
            ) : (
              post.author.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <p className="text-[15px] font-bold tracking-tight text-slate-50 transition-colors duration-200 group-hover/author:text-indigo-100">
              {post.author.name}
            </p>
            <p className="text-sm font-medium text-muted-foreground transition-colors duration-200 group-hover/author:text-slate-300">
              @{post.author.username}
            </p>
            <span className="text-[11px] text-slate-600">&bull;</span>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
              {formatDistanceToNow(post.createdAt)}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <TypeBadge post={post} />
            {post.community ? (
              <p className="rounded-xl border border-fuchsia-400/15 bg-fuchsia-400/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-200">
                {post.community.name}
              </p>
            ) : null}
            {post.activity ? (
              <p className="rounded-xl border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                {post.activity.title}
              </p>
            ) : null}
          </div>
          </div>
        </Link>
      </div>

      <PostBody joinAction={joinAction} post={post} voteAction={voteAction} />

      {post.isOwner ? (
        <PostOwnerActions
          cancelAction={post.type === "invite_post" || post.type === "activity_post" ? cancelAction : undefined}
          canEditPlan={post.type === "invite_post" || post.type === "activity_post"}
          content={post.content}
          deleteAction={deleteAction}
          locationText={
            post.type === "invite_post"
              ? post.invite.locationText
              : post.type === "activity_post"
                ? post.activityPost.locationText
                : null
          }
          postId={post.id}
          startsAt={
            post.type === "invite_post"
              ? post.invite.startsAt
              : post.type === "activity_post"
                ? post.activityPost.startsAt
                : null
          }
          title={
            post.type === "invite_post"
              ? post.invite.title
              : post.type === "activity_post"
                ? post.activityPost.title
                : undefined
          }
          updateAction={post.type === "invite_post" || post.type === "activity_post" ? updateAction : undefined}
        />
      ) : null}

      <div className="relative mt-5 flex items-center justify-between px-1 text-sm">
        <p className="font-medium text-muted-foreground">
          {likesCount} likes
          <span className="mx-2 text-slate-600">&bull;</span>
          {post.commentsCount} comments
        </p>
      </div>

      <div className="relative mt-3 grid grid-cols-4 gap-2 border-t border-white/6 pt-4">
        <LikeButton onLike={handleLike} liked={liked} />
        <PostCommentsModal
          action={commentAction}
          comments={post.comments}
          commentsCount={post.commentsCount}
          postId={post.id}
        />
        <button
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-indigo-400/20 hover:bg-indigo-400/8 hover:text-indigo-200"
          type="button"
        >
          <Share className="h-4 w-4" />
          <span>Share</span>
        </button>
        <form action={saveAction}>
          <input name="postId" type="hidden" value={post.id} />
          <button
            className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
              post.savedByCurrentUser
                ? "border-amber-300/20 bg-amber-400/10 text-amber-200"
                : "border-white/6 bg-white/[0.03] text-slate-400 hover:border-amber-300/20 hover:bg-amber-400/8 hover:text-amber-200"
            }`}
            type="submit"
          >
            <Bookmark className={`h-4 w-4 ${post.savedByCurrentUser ? "fill-current" : ""}`} />
            <span>{post.savedByCurrentUser ? "Saved" : "Save"}</span>
          </button>
        </form>
      </div>
    </article>
  );
}
