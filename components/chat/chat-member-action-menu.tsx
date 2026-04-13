"use client";

import { Loader2, MessageCircleMore, UserRound } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateDirectConversationAction } from "@/actions/messages";
import { cn, getInitials } from "@/lib/utils";

type Member = {
  id: string;
  username: string;
  name: string;
  avatar?: string | null;
  role?: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";
  isCurrentUser?: boolean;
};

type Props = {
  member: Member;
};

export function ChatMemberActionMenu({ member }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleViewProfile() {
    router.push(member.isCurrentUser ? "/profile" : `/profile/${member.username}`);
    setOpen(false);
  }

  function handleMessage() {
    setError("");

    startTransition(async () => {
      try {
        const result = await getOrCreateDirectConversationAction(member.id);
        setOpen(false);
        router.push(`/chats/${result.threadId}`);
        router.refresh();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to open that conversation.");
      }
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/40",
          open
            ? "border-indigo-300/24 bg-white/[0.07]"
            : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]",
        )}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-xs font-semibold text-white">
          {member.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={member.name} className="h-full w-full object-cover" src={member.avatar} />
          ) : (
            getInitials(member.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white">{member.name}</p>
            {member.role && member.role !== "MEMBER" ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {member.role}
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-slate-500">@{member.username}</p>
        </div>
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-2 shadow-[0_18px_48px_rgba(2,6,23,0.4)]">
          {!member.isCurrentUser ? (
            <button
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-100 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/40"
              disabled={isPending}
              onClick={handleMessage}
              type="button"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin text-indigo-300" /> : <MessageCircleMore className="h-4 w-4 text-indigo-300" />}
              <span>Message</span>
            </button>
          ) : null}
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-100 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/40"
            onClick={handleViewProfile}
            type="button"
          >
            <UserRound className="h-4 w-4 text-slate-300" />
            <span>View profile</span>
          </button>
          {error ? <p className="px-3 pt-2 text-xs text-rose-300">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
