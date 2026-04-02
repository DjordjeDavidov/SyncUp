"use client";

import Link from "next/link";
import { MessageCircleMore, Users } from "lucide-react";
import { useState, useTransition } from "react";

type Props = {
  targetUserId: string;
  initialIsFollowing: boolean;
  followAction: (targetUserId: string) => Promise<{ ok: boolean; message?: string }>;
  unfollowAction: (targetUserId: string) => Promise<{ ok: boolean; message?: string }>;
  onFollowersCountChange: (nextCount: number) => void;
};

export function ProfileFollowControls({
  targetUserId,
  initialIsFollowing,
  followAction,
  unfollowAction,
  onFollowersCountChange,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const nextIsFollowing = !isFollowing;

    setIsFollowing(nextIsFollowing);
    onFollowersCountChange(nextIsFollowing ? 1 : -1);

    startTransition(async () => {
      const result = nextIsFollowing
        ? await followAction(targetUserId)
        : await unfollowAction(targetUserId);

      if (!result.ok) {
        setIsFollowing(!nextIsFollowing);
        onFollowersCountChange(nextIsFollowing ? -1 : 1);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-3 sm:justify-end">
      <button
        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
          isFollowing
            ? "border border-white/10 bg-white/5 text-slate-100 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/8"
            : "bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(99,102,241,0.34)]"
        } disabled:cursor-not-allowed disabled:opacity-70`}
        disabled={isPending}
        onClick={handleToggle}
        type="button"
      >
        <Users className="h-4 w-4" />
        {isPending ? (isFollowing ? "Updating..." : "Updating...") : isFollowing ? "Following" : "Follow"}
      </button>
      <Link
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/8"
        href="/messages"
      >
        <MessageCircleMore className="h-4 w-4" />
        Message
      </Link>
    </div>
  );
}
