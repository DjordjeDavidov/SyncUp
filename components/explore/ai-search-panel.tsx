"use client";

import Link from "next/link";
import { CalendarDays, Loader2, MapPin, Search, Sparkles, Users } from "lucide-react";
import { FormEvent, useState } from "react";
import { MatchBadge } from "@/components/match-badge";
import { getInitials } from "@/lib/utils";

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
  const className =
    variant === "avatar"
      ? "h-16 w-16 rounded-full"
      : "h-36 w-full rounded-t-[1.3rem]";

  return (
    <div className={`${className} flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(168,85,247,0.16))] text-lg font-semibold text-white`}>
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
        <Link className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200" href={result.href}>
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
          <Link className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200" href={result.href}>
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
          <Link className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200" href={result.href}>
            Open activity
          </Link>
        </div>
      </div>
    </article>
  );
}

export function AiSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AiSearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 6) {
      setError("Describe what you want to discover in a full sentence or phrase.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: trimmedQuery }),
      });
      const data = (await response.json()) as { results?: AiSearchResult[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "AI Search is unavailable right now.");
      }

      setResults(data.results ?? []);
      setStatus("success");
    } catch (caughtError) {
      setResults([]);
      setError(caughtError instanceof Error ? caughtError.message : "AI Search is unavailable right now.");
      setStatus("error");
    }
  }

  return (
    <section className="surface-card rounded-[1.8rem] border border-white/8 p-5 sm:p-6" id="ai-search">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">AI Search</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Ask SyncUp to discover people, communities, and plans</h2>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">AI ranked</p>
            <p className="mt-1 text-2xl font-semibold text-white">{results.length}</p>
          </div>
        </div>

        <form className="flex flex-col gap-3 lg:flex-row" onSubmit={handleSubmit}>
          <label className="flex flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 focus-within:border-sky-300/20">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full border-0 bg-transparent p-0 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find active users who enjoy hiking, road trips, and outdoor activities"
              type="search"
              value={query}
            />
          </label>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(14,165,233,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={status === "loading"}
            type="submit"
          >
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI Search
          </button>
        </form>

        {status === "loading" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        ) : status === "error" ? (
          <div className="rounded-[1.4rem] border border-rose-300/16 bg-rose-400/8 px-5 py-4 text-sm leading-6 text-rose-100">
            {error}
          </div>
        ) : status === "success" && results.length === 0 ? (
          <div className="rounded-[1.4rem] border border-white/8 bg-slate-950/70 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/18 bg-sky-400/10 text-sky-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-4 text-lg font-semibold text-white">No AI matches yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Try broadening the request with interests, activity style, or community topics.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((result) =>
              result.type === "user" ? (
                <UserResultCard key={`${result.type}-${result.id}`} result={result} />
              ) : result.type === "community" ? (
                <CommunityResultCard key={`${result.type}-${result.id}`} result={result} />
              ) : (
                <ActivityResultCard key={`${result.type}-${result.id}`} result={result} />
              ),
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
