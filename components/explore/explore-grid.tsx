"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Compass, Loader2, MapPin, Search, Sparkles, Users } from "lucide-react";
import { FormEvent, useState } from "react";
import { formatDistanceToNow, getInitials } from "@/lib/utils";
import type { ExplorePageData } from "@/server/queries";
import { MatchBadge } from "@/components/match-badge";
import { AiSearchPanel } from "@/components/explore/ai-search-panel";

type Props = {
  data: ExplorePageData;
};

type SearchMode = "explore" | "ai";

const primaryActionButtonClass =
  "inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] transition hover:-translate-y-0.5";

type AiSearchResult =
  | {
      type: "user";
      id: string;
      score: number;
      reason: string;
      href: string;
      avatarUrl: string | null;
      username: string;
      name: string;
      matchScore: number;
      bio: string;
      sharedInterests: string[];
      recentContentPreview: string;
    }
  | {
      type: "community";
      id: string;
      score: number;
      reason: string;
      href: string;
      imageUrl: string | null;
      name: string;
      category: string;
      memberCount: number;
      description: string;
    }
  | {
      type: "activity";
      id: string;
      score: number;
      reason: string;
      href: string;
      imageUrl: string | null;
      title: string;
      location: string;
      date: string;
      participantCount: number;
      description: string;
    };

const tabs = [
  { key: "all", label: "All" },
  { key: "people", label: "People" },
  { key: "communities", label: "Communities" },
  { key: "events", label: "Events" },
  { key: "photos", label: "Photos" },
] as const;

const themes = [
  { key: "all", label: "Everything" },
  { key: "outdoor", label: "Outdoor" },
  { key: "social", label: "Social" },
  { key: "study-coding", label: "Study & Coding" },
  { key: "free-weekend", label: "Free This Weekend" },
] as const;

function buildHref({
  query,
  tab,
  theme,
  page,
}: {
  query: string;
  tab: string;
  theme: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (tab !== "all") {
    params.set("tab", tab);
  }

  if (theme !== "all") {
    params.set("theme", theme);
  }

  if (page && page > 1) {
    params.set("page", String(page));
  }

  const value = params.toString();
  return value ? `/explore?${value}` : "/explore";
}

function tileClassName(index: number, type: ExplorePageData["items"][number]["type"]) {
  if (index === 0) {
    return "sm:col-span-2 sm:row-span-3";
  }

  if (type === "community" && index % 7 === 0) {
    return "sm:col-span-2 sm:row-span-2";
  }

  if (type === "event") {
    return "row-span-2";
  }

  if (type === "person" && index % 5 === 0) {
    return "row-span-2";
  }

  if (type === "photo" && index % 4 === 0) {
    return "row-span-2";
  }

  return "row-span-1";
}

function SectionRail({
  title,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">{title}</p>
        </div>
        <Link className="text-sm font-medium text-slate-400 transition hover:text-white" href={actionHref}>
          {actionLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

function ResultImage({
  alt,
  initials,
  src,
  variant,
}: {
  alt: string;
  initials: string;
  src: string | null;
  variant: "avatar" | "cover";
}) {
  const className = variant === "avatar" ? "h-16 w-16 rounded-full" : "h-36 w-full rounded-t-[1.3rem]";

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(168,85,247,0.16))] text-lg font-semibold text-white`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={alt} className="h-full w-full object-cover" loading="lazy" src={src} />
      ) : (
        initials
      )}
    </div>
  );
}

function UserResultCard({ result }: { result: Extract<AiSearchResult, { type: "user" }> }) {
  return (
    <article className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-slate-950/70 p-4 shadow-[0_18px_48px_rgba(2,6,23,0.24)]">
      <div className="flex items-start gap-4">
        <ResultImage alt={result.name} initials={getInitials(result.name)} src={result.avatarUrl} variant="avatar" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">{result.name}</p>
              <p className="truncate text-sm text-slate-400">@{result.username}</p>
            </div>
            <MatchBadge compact score={result.matchScore} />
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{result.bio}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="rounded-2xl border border-indigo-300/14 bg-indigo-400/8 px-3 py-2 text-sm leading-6 text-indigo-50">
          {result.reason}
        </p>
        <div className="flex flex-wrap gap-2">
          {result.sharedInterests.length > 0 ? (
            result.sharedInterests.map((interest) => (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300" key={interest}>
                {interest}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300">
              AI match {result.score}%
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-slate-400">{result.recentContentPreview}</p>
        <Link
          className={primaryActionButtonClass}
          href={result.href}
        >
          Open profile
        </Link>
      </div>
    </article>
  );
}

function CommunityResultCard({ result }: { result: Extract<AiSearchResult, { type: "community" }> }) {
  return (
    <article className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-slate-950/70 shadow-[0_18px_48px_rgba(2,6,23,0.24)]">
      <ResultImage alt={result.name} initials={getInitials(result.name)} src={result.imageUrl} variant="cover" />
      <div className="space-y-3 p-4">
        <div>
          <p className="text-base font-semibold text-white">{result.name}</p>
          <p className="mt-1 text-sm text-slate-400">{result.category}</p>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-slate-300">{result.description}</p>
        <p className="rounded-2xl border border-emerald-300/14 bg-emerald-400/8 px-3 py-2 text-sm leading-6 text-emerald-50">{result.reason}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            <Users className="h-3.5 w-3.5" />
            {result.memberCount} members
          </span>
          <Link className={primaryActionButtonClass} href={result.href}>
            Open community
          </Link>
        </div>
      </div>
    </article>
  );
}

function ActivityResultCard({ result }: { result: Extract<AiSearchResult, { type: "activity" }> }) {
  return (
    <article className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-slate-950/70 shadow-[0_18px_48px_rgba(2,6,23,0.24)]">
      <ResultImage alt={result.title} initials={getInitials(result.title)} src={result.imageUrl} variant="cover" />
      <div className="space-y-3 p-4">
        <div>
          <p className="text-base font-semibold text-white">{result.title}</p>
          <div className="mt-2 space-y-1 text-sm text-slate-400">
            <p className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-sky-300" />
              {result.location}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-sky-300" />
              {result.date}
            </p>
          </div>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-slate-300">{result.description}</p>
        <p className="rounded-2xl border border-sky-300/14 bg-sky-400/8 px-3 py-2 text-sm leading-6 text-sky-50">{result.reason}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{result.participantCount} going</span>
          <Link className={primaryActionButtonClass} href={result.href}>
            Open activity
          </Link>
        </div>
      </div>
    </article>
  );
}

function ExploreTile({
  item,
  index,
}: {
  item: ExplorePageData["items"][number];
  index: number;
}) {
  const className = tileClassName(index, item.type);

  return (
    <Link
      className={`group relative overflow-hidden rounded-[1.6rem] border border-white/8 bg-slate-950/70 transition-all duration-300 hover:-translate-y-1 hover:border-white/16 hover:shadow-[0_24px_60px_rgba(2,6,23,0.45)] ${className}`}
      href={item.href}
    >
      <div className="absolute inset-0">
        {item.type === "person" ? (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.18),transparent_32%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(6,10,20,0.98))]">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={item.title}
                className="h-28 w-28 rounded-full border border-white/12 object-cover shadow-[0_18px_40px_rgba(15,23,42,0.5)] transition duration-500 group-hover:scale-105"
                loading="lazy"
                src={item.imageUrl}
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/12 bg-indigo-500/20 text-3xl font-semibold text-white">
                {getInitials(item.title)}
              </div>
            )}
          </div>
        ) : item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            src={item.imageUrl}
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.12),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.95),rgba(5,10,18,0.98))]" />
        )}
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.02),rgba(2,6,23,0.26)_45%,rgba(2,6,23,0.88))]" />

      <div className="relative flex h-full min-h-[12rem] flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/12 bg-black/25 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
              {item.type}
            </span>
            {"isPublic" in item && item.isPublic ? (
              <span className="rounded-full border border-emerald-300/18 bg-emerald-400/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Public
              </span>
            ) : null}
            {"isFree" in item && item.isFree ? (
              <span className="rounded-full border border-sky-300/18 bg-sky-400/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                Free entry
              </span>
            ) : null}
          </div>
          {item.type === "person" ? <MatchBadge score={item.matchScore} compact /> : null}
        </div>

        <div className="space-y-2">
          <p className="line-clamp-2 text-lg font-semibold tracking-tight text-white">{item.title}</p>
          <p className="text-sm text-white/75">{item.subtitle}</p>
          <p className="line-clamp-2 text-sm leading-6 text-slate-200/90">{item.description}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {item.meta.slice(0, 2).map((value) => (
              <span
                key={value}
                className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur-sm"
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ExploreGrid({ data }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(data.searchQuery);
  const [searchMode, setSearchMode] = useState<SearchMode>("explore");
  const [aiResults, setAiResults] = useState<AiSearchResult[]>([]);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [aiError, setAiError] = useState("");
  const isAiResultsView = searchMode === "ai" && aiStatus !== "idle";

  function runExploreSearch() {
    setAiStatus("idle");
    setAiError("");
    setAiResults([]);
    router.push(
      buildHref({
        query: query.trim(),
        tab: data.activeTab,
        theme: data.activeTheme,
      }),
    );
  }

  async function runAiSearch() {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 6) {
      setAiError("");
      setAiStatus("idle");
      setAiResults([]);
      return;
    }

    setAiStatus("loading");
    setAiError("");

    try {
      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: trimmedQuery }),
      });
      const payload = (await response.json()) as { results?: AiSearchResult[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "AI Search is unavailable right now.");
      }

      setAiResults(payload.results ?? []);
      setAiStatus("success");
    } catch (caughtError) {
      setAiResults([]);
      setAiError(caughtError instanceof Error ? caughtError.message : "AI Search is unavailable right now.");
      setAiStatus("error");
    }
  }

  function handleExploreSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (searchMode === "ai") {
      void runAiSearch();
      return;
    }

    runExploreSearch();
  }

  return (
    <div className="space-y-8">
      <section className="surface-card rounded-[1.8rem] border border-white/8 p-5 sm:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Explore</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Discover people, plans, and visual moments around SyncUp</h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Browse public photos, communities, and open events in one image-first discovery surface built for meetup culture.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Results</p>
                <p className="mt-1 text-2xl font-semibold text-white">{data.total}</p>
              </div>
              {aiStatus === "success" ? (
                <div className="rounded-2xl border border-sky-300/12 bg-sky-400/[0.05] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">AI ranked</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{aiResults.length}</p>
                </div>
              ) : null}
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleExploreSubmit}>
            <div className="flex flex-col gap-3 lg:flex-row">
              <label className="flex flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 focus-within:border-indigo-300/20">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full border-0 bg-transparent p-0 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  name="q"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={
                    searchMode === "ai"
                      ? "Describe what you want to discover in a full sentence or phrase."
                      : "Search photos, communities, people, or plans"
                  }
                  type="search"
                  value={query}
                />
              </label>
              <button
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
                  searchMode === "explore"
                    ? "bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)]"
                    : "border border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/18 hover:text-white"
                }`}
                type="submit"
                onClick={() => setSearchMode("explore")}
              >
                Explore
              </button>
              <button
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${
                  searchMode === "ai"
                    ? "bg-[linear-gradient(135deg,#0ea5e9,#2563eb_52%,#8b5cf6)] text-white shadow-[0_16px_38px_rgba(37,99,235,0.34)] hover:shadow-[0_20px_44px_rgba(37,99,235,0.42)]"
                    : "border border-sky-300/22 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(37,99,235,0.18),rgba(139,92,246,0.18))] text-sky-100 shadow-[0_12px_30px_rgba(14,165,233,0.12)] hover:border-sky-200/34 hover:bg-[linear-gradient(135deg,rgba(14,165,233,0.28),rgba(37,99,235,0.24),rgba(139,92,246,0.24))] hover:text-white"
                }`}
                disabled={aiStatus === "loading"}
                onClick={() => {
                  setSearchMode("ai");
                  void runAiSearch();
                }}
                type="button"
              >
                {aiStatus === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI Search
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="-mx-1 overflow-x-auto pb-1">
                <div className="inline-flex min-w-full gap-2 px-1">
                  {tabs.map((tab) => (
                    <Link
                      key={tab.key}
                      className={`whitespace-nowrap rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
                        data.activeTab === tab.key
                          ? "border-indigo-300/24 bg-indigo-400/10 text-white"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/18 hover:text-white"
                      }`}
                      href={buildHref({
                        query: data.searchQuery,
                        tab: tab.key,
                        theme: data.activeTheme,
                      })}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="-mx-1 overflow-x-auto pb-1">
                <div className="inline-flex gap-2 px-1">
                  {themes.map((theme) => (
                    <Link
                      key={theme.key}
                      className={`whitespace-nowrap rounded-full border px-3 py-2 text-sm transition ${
                        data.activeTheme === theme.key
                          ? "border-sky-300/20 bg-sky-400/10 text-sky-100"
                          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/18 hover:text-white"
                      }`}
                      href={buildHref({
                        query: data.searchQuery,
                        tab: data.activeTab,
                        theme: theme.key,
                      })}
                    >
                      {theme.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      <div className={`grid gap-6 ${isAiResultsView ? "" : "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]"}`}>
        <div className={`space-y-6 ${isAiResultsView ? "" : "xl:col-span-2"}`}>
          {aiStatus === "loading" ? (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-sky-300" />
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">AI Results</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2].map((item) => (
                  <div className="rounded-[1.4rem] border border-white/8 bg-slate-950/70 p-4" key={item}>
                    <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
                    <div className="mt-4 space-y-3">
                      <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
                      <div className="h-3 w-full animate-pulse rounded-full bg-white/8" />
                      <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/8" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : aiStatus === "error" && aiError ? (
            <section className="rounded-[1.4rem] border border-rose-300/16 bg-rose-400/8 px-5 py-4 text-sm leading-6 text-rose-100">
              {aiError}
            </section>
          ) : aiStatus === "success" ? (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-sky-300" />
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">AI Results</p>
              </div>
              {aiResults.length === 0 ? (
                <div className="rounded-[1.4rem] border border-white/8 bg-slate-950/70 px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/18 bg-sky-400/10 text-sky-100">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-white">No AI matches yet</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Try broadening the request with interests, activity style, or community topics.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {aiResults.map((result) =>
                    result.type === "user" ? (
                      <UserResultCard key={`${result.type}-${result.id}`} result={result} />
                    ) : result.type === "community" ? (
                      <CommunityResultCard key={`${result.type}-${result.id}`} result={result} />
                    ) : (
                      <ActivityResultCard key={`${result.type}-${result.id}`} result={result} />
                    ),
                  )}
                </div>
              )}
            </section>
          ) : null}
          <SectionRail actionHref="/explore?tab=communities" actionLabel="See all" title="Trending Communities">
            <div className="grid gap-4 sm:grid-cols-2">
              {data.trendingCommunities.map((community) => (
                <Link
                  key={community.id}
                  className="group overflow-hidden rounded-[1.4rem] border border-white/8 bg-slate-950/70 transition hover:-translate-y-1 hover:border-white/16"
                  href={`/communities/${community.slug}`}
                >
                  <div className="relative h-28 overflow-hidden">
                    {community.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={community.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                        src={community.coverUrl}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.82))]" />
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="text-base font-semibold text-white">{community.name}</p>
                    <p className="text-sm text-slate-400">{community.categoryLabel}</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{community.memberCount} members</p>
                  </div>
                </Link>
              ))}
            </div>
          </SectionRail>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Compass className="h-4 w-4 text-indigo-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Discovery Grid</p>
            </div>

            {data.items.length > 0 ? (
              <div className="grid auto-rows-[160px] grid-cols-2 gap-4 md:auto-rows-[180px] lg:grid-cols-3">
                {data.items.map((item, index) => (
                  <ExploreTile index={index} item={item} key={`${item.type}-${item.id}`} />
                ))}
              </div>
            ) : (
              <div className="surface-card rounded-[1.8rem] border border-white/8 px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-300/18 bg-indigo-400/10 text-indigo-100">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="mt-5 text-xl font-semibold text-white">Nothing matched this explore view</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                  Try a broader search or switch filters to bring back communities, people, and public plans.
                </p>
              </div>
            )}

            {data.hasMore ? (
              <div className="flex justify-center pt-2">
                <Link
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/18 hover:bg-white/[0.07]"
                  href={buildHref({
                    query: data.searchQuery,
                    tab: data.activeTab,
                    theme: data.activeTheme,
                    page: data.currentPage + 1,
                  })}
                >
                  Load more
                </Link>
              </div>
            ) : null}
          </section>
        </div>

        {!isAiResultsView ? (
          <aside className="space-y-6">
          <SectionRail actionHref="/explore?tab=events" actionLabel="Browse events" title="Happening Soon">
            <div className="space-y-3">
              {data.happeningSoon.map((event) => (
                <Link
                  key={event.id}
                  className="group overflow-hidden rounded-[1.4rem] border border-white/8 bg-slate-950/70 transition hover:-translate-y-1 hover:border-white/16"
                  href={`/activity/${event.id}`}
                >
                  <div className="relative h-32 overflow-hidden">
                    {event.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={event.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                        src={event.imageUrl}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.86))]" />
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-sm font-semibold text-white">{event.title}</p>
                    <div className="space-y-1 text-xs text-slate-400">
                      <p className="inline-flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-sky-300" />
                        {formatDistanceToNow(event.startsAt)}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-sky-300" />
                        {event.location}
                      </p>
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{event.participantCount} going</p>
                  </div>
                </Link>
              ))}
            </div>
          </SectionRail>

          <SectionRail actionHref="/explore?tab=people" actionLabel="Find people" title="People You May Know">
            <div className="space-y-3">
              {data.peopleYouMayKnow.map((person) => (
                <Link
                  key={person.id}
                  className="flex items-start gap-3 rounded-[1.4rem] border border-white/8 bg-slate-950/70 p-4 transition hover:-translate-y-1 hover:border-white/16"
                  href={`/profile/${person.username}`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-indigo-500/20 text-sm font-semibold text-white">
                    {person.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={person.name} className="h-full w-full object-cover" loading="lazy" src={person.avatarUrl} />
                    ) : (
                      getInitials(person.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{person.name}</p>
                        <p className="truncate text-xs text-slate-400">@{person.username}</p>
                      </div>
                      <MatchBadge score={person.matchScore} compact />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{person.bio}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">{person.context}</p>
                  </div>
                </Link>
              ))}
            </div>
          </SectionRail>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
