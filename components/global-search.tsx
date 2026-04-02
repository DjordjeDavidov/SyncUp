"use client";

import Link from "next/link";
import { CalendarClock, Search, Sparkles, UserRound, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn, getInitials } from "@/lib/utils";

type SearchResult = {
  id: string;
  type: "user" | "community" | "activity";
  title: string;
  subtitle: string;
  imageUrl: string | null;
  href: string;
};

type Props = {
  compact?: boolean;
};

const typeConfig = {
  user: {
    icon: UserRound,
    accent: "border-sky-300/18 bg-sky-400/10 text-sky-100",
  },
  community: {
    icon: Users,
    accent: "border-emerald-300/18 bg-emerald-400/10 text-emerald-100",
  },
  activity: {
    icon: CalendarClock,
    accent: "border-violet-300/18 bg-violet-400/10 text-violet-100",
  },
} as const;

export function GlobalSearch({ compact = false }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showCompactInput, setShowCompactInput] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        if (compact) {
          setShowCompactInput(false);
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [compact]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setResults([]);
          return;
        }

        const data = (await response.json()) as { results: SearchResult[] };
        setResults(data.results);
        setIsOpen(true);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  const shouldShowDropdown = isOpen && (isLoading || query.trim().length >= 2);
  const groupedResults = useMemo(
    () => ({
      users: results.filter((result) => result.type === "user"),
      communities: results.filter((result) => result.type === "community"),
      activities: results.filter((result) => result.type === "activity"),
    }),
    [results],
  );

  const input = (
    <label
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-all duration-200 focus-within:border-indigo-300/18 focus-within:bg-white/[0.06]",
        compact ? "w-[260px]" : "w-[240px]",
      )}
    >
      <Search className="h-4 w-4 text-slate-400" />
      <input
        aria-label="Search"
        className="w-full border-0 bg-transparent p-0 text-sm text-slate-100 outline-none placeholder:text-slate-500"
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          if (compact) {
            setShowCompactInput(true);
          }
        }}
        placeholder="Search SyncUp"
        type="text"
        value={query}
      />
      {query ? (
        <button
          aria-label="Clear search"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-white"
          onClick={() => {
            setQuery("");
            setResults([]);
            setIsLoading(false);
          }}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </label>
  );

  return (
    <div className="relative" ref={containerRef}>
      {compact ? (
        <>
          <button
            aria-label="Open search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-slate-300 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.07] hover:text-white active:scale-[0.99]"
            onClick={() => {
              setShowCompactInput((open) => !open);
              setIsOpen(true);
            }}
            type="button"
          >
            <Search className="h-4.5 w-4.5" />
          </button>
          <div
            className={cn(
              "absolute right-0 top-[calc(100%+0.75rem)] z-40 origin-top-right transition-all duration-200",
              showCompactInput ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
            )}
          >
            {input}
          </div>
        </>
      ) : (
        input
      )}

      <div
        className={cn(
          "absolute z-40 w-[320px] origin-top rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(14,20,36,0.98),rgba(9,14,26,0.98))] p-2 shadow-[0_22px_50px_rgba(2,6,23,0.48),0_0_24px_rgba(99,102,241,0.1)] transition-all duration-200",
          compact ? "right-0 top-[calc(100%+4.75rem)]" : "left-0 top-[calc(100%+0.75rem)]",
          shouldShowDropdown ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0",
        )}
      >
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((item) => (
              <div className="flex items-center gap-3 rounded-xl px-2 py-2" key={item}>
                <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
                  <div className="h-3 w-20 animate-pulse rounded-full bg-white/8" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {[
              { title: "Users", items: groupedResults.users },
              { title: "Communities", items: groupedResults.communities },
              { title: "Activities", items: groupedResults.activities },
            ].map((group) =>
              group.items.length > 0 ? (
                <div key={group.title}>
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {group.title}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((result) => {
                      const type = typeConfig[result.type];
                      const Icon = type.icon;

                      return (
                        <Link
                          className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:bg-white/[0.05]"
                          href={result.href}
                          key={result.id}
                          onClick={() => {
                            setIsOpen(false);
                            setQuery("");
                            if (compact) {
                              setShowCompactInput(false);
                            }
                          }}
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.28),rgba(59,130,246,0.16))] text-sm font-semibold text-white">
                            {result.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img alt={result.title} className="h-full w-full object-cover" src={result.imageUrl} />
                            ) : (
                              getInitials(result.title)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{result.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${type.accent}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {result.type}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        ) : query.trim().length >= 2 ? (
          <div className="px-4 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/18 bg-indigo-400/10 text-indigo-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-white">No results</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Try another name, community, or activity keyword.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
