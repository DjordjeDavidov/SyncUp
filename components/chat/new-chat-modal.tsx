"use client";

import { Loader2, Search, UserRoundPlus, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateDirectConversationAction } from "@/actions/messages";
import { cn, getInitials } from "@/lib/utils";

type SearchUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  followsYou: boolean;
  youFollow: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function getSecondaryText(user: SearchUser) {
  if (user.youFollow && user.followsYou) {
    return "You follow each other";
  }

  if (user.youFollow) {
    return "You follow them";
  }

  if (user.followsYou) {
    return "Follows you";
  }

  const location = [user.city, user.country].filter(Boolean).join(", ");

  if (location) {
    return location;
  }

  return user.bio || "Available for a direct chat";
}

export function NewChatModal({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery("");
    setDebouncedQuery("");
    setError("");
    setPendingUserId(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [open, query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();

    async function loadUsers() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/chats/users?q=${encodeURIComponent(debouncedQuery)}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        const data = (await response.json()) as { users?: SearchUser[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Unable to load users.");
        }

        setResults(data.users ?? []);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setResults([]);
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load users.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => controller.abort();
  }, [debouncedQuery, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  function handleSelectUser(userId: string) {
    setError("");
    setPendingUserId(userId);

    startTransition(async () => {
      try {
        const result = await getOrCreateDirectConversationAction(userId);
        onClose();
        router.push(`/chats/${result.threadId}`);
        router.refresh();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to open that conversation.");
      } finally {
        setPendingUserId(null);
      }
    });
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/78 p-4 sm:items-center">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div
        aria-modal="true"
        className="relative flex max-h-[min(80vh,44rem)] w-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] shadow-[0_24px_80px_rgba(2,6,23,0.55)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">New chat</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Start a direct conversation</h2>
            <p className="mt-1 text-sm text-slate-400">Search people you follow, followers, or anyone by username.</p>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08]"
            onClick={onClose}
            type="button"
          >
            <X className="h-4.5 w-4.5" />
            <span className="sr-only">Close new chat</span>
          </button>
        </div>

        <div className="border-b border-white/8 px-5 py-4 sm:px-6">
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 transition focus-within:border-indigo-300/20 focus-within:bg-white/[0.06]">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              className="w-full border-0 bg-transparent p-0 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or username"
              type="text"
              value={query}
            />
          </label>
        </div>

        <div className="min-h-[18rem] flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex h-52 flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-300" />
              <p className="text-sm text-slate-400">Looking for people to message...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((user) => {
                const isCreating = pendingUserId === user.id && isPending;

                return (
                  <button
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition",
                      isCreating ? "opacity-80" : "hover:border-white/16 hover:bg-white/[0.06]",
                    )}
                    disabled={isCreating}
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    type="button"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.32),rgba(59,130,246,0.16))] text-sm font-semibold text-white">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={user.name} className="h-full w-full object-cover" src={user.avatarUrl} />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                        {(user.youFollow || user.followsYou) && (
                          <span className="rounded-full border border-emerald-400/18 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                            Network
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-400">@{user.username}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{getSecondaryText(user)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-slate-400">
                      {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundPlus className="h-4 w-4" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-300/18 bg-indigo-400/10 text-indigo-100">
                <Search className="h-5 w-5" />
              </div>
              <p className="mt-4 text-base font-semibold text-white">
                {debouncedQuery ? "No people found" : "Your people will show up here"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {debouncedQuery
                  ? "Try a different username or name."
                  : "Start with followers and people you follow, or search the wider platform by username."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
