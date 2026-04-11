"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Loader2, UserMinus, Users, X } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ProfileFollowListUser } from "@/components/profile/types";

type Mode = "followers" | "following";

type Props = {
  mode: Mode;
  isOpen: boolean;
  title: string;
  users: ProfileFollowListUser[];
  isOwner: boolean;
  onClose: () => void;
  onUsersChange: (users: ProfileFollowListUser[]) => void;
  onCountChange: (nextCount: number) => void;
  removeFollowerAction?: (followerUserId: string) => Promise<{ ok: boolean; message?: string }>;
  unfollowAction?: (targetUserId: string) => Promise<{ ok: boolean; message?: string }>;
};

function getEmptyStateCopy(mode: Mode) {
  return mode === "followers"
    ? {
        title: "No followers yet",
        description: "When people start following this profile, they will appear here.",
      }
    : {
        title: "Not following anyone yet",
        description: "People this profile follows will appear here.",
      };
}

export function FollowListModal({
  mode,
  isOpen,
  title,
  users,
  isOwner,
  onClose,
  onUsersChange,
  onCountChange,
  removeFollowerAction,
  unfollowAction,
}: Props) {
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const emptyState = getEmptyStateCopy(mode);

  function handleAction(targetUser: ProfileFollowListUser) {
    if (!isOwner) {
      return;
    }

    const nextUsers = users.filter((user) => user.id !== targetUser.id);
    const action = mode === "followers" ? removeFollowerAction : unfollowAction;

    if (!action) {
      return;
    }

    const nextLabel = mode === "followers" ? "Removing..." : "Unfollowing...";

    setActiveUserId(targetUser.id);
    setPendingLabel(nextLabel);
    onUsersChange(nextUsers);
    onCountChange(nextUsers.length);

    startTransition(async () => {
      const result = await action(targetUser.id);

      if (!result.ok) {
        onUsersChange(users);
        onCountChange(users.length);
      }

      setActiveUserId(null);
      setPendingLabel(null);
    });
  }

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(3,7,18,0.72)] p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        aria-modal="true"
        className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,20,34,0.98),rgba(8,12,24,0.98))] shadow-[0_30px_90px_rgba(2,6,23,0.54)]"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">{title}</p>
            <p className="mt-1 text-sm text-slate-400">{users.length} people</p>
          </div>
          <button
            aria-label={`Close ${title.toLowerCase()} modal`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-white/16 hover:bg-white/[0.08]"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[min(68vh,36rem)] overflow-y-auto px-5 py-4 sm:px-6">
          {users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => {
                const isRowPending = isPending && activeUserId === user.id;
                const actionLabel = mode === "followers" ? "Remove" : "Unfollow";

                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                    key={user.id}
                  >
                    <Link
                      className="group/follow-row flex min-w-0 flex-1 items-center gap-3 rounded-2xl -m-2 p-2 transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/35"
                      href={`/profile/${user.username}`}
                      onClick={onClose}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.36),rgba(59,130,246,0.18))] text-sm font-semibold text-white">
                        {user.profile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt={user.profile.full_name ?? user.username} className="h-full w-full object-cover" src={user.profile.avatar_url} />
                        ) : (
                          getInitials(user.profile?.full_name ?? user.username)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white transition-colors group-hover/follow-row:text-indigo-100">
                          {user.profile?.full_name ?? user.username}
                        </p>
                        <p className="truncate text-xs text-slate-400">@{user.username}</p>
                        <p className="mt-1 line-clamp-1 text-sm text-slate-300">
                          {user.profile?.bio || "SyncUp profile"}
                        </p>
                      </div>
                    </Link>

                    {isOwner ? (
                      <button
                        className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                          mode === "followers"
                            ? "border-rose-300/16 bg-rose-400/10 text-rose-100 hover:border-rose-300/24 hover:bg-rose-400/14"
                            : "border-amber-300/16 bg-amber-400/10 text-amber-100 hover:border-amber-300/24 hover:bg-amber-400/14"
                        } disabled:cursor-not-allowed disabled:opacity-70`}
                        disabled={isRowPending}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleAction(user);
                        }}
                        type="button"
                      >
                        {isRowPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                        {isRowPending ? pendingLabel : actionLabel}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-indigo-200">
                <Users className="h-6 w-6" />
              </div>
              <p className="mt-4 text-base font-semibold text-white">{emptyState.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{emptyState.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
