import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCommunityCategoryLabel } from "@/lib/community-categories";

type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category?: string | null;
  custom_category?: string | null;
  cover_url?: string | null;
  city: string | null;
  country: string | null;
  _count: {
    community_members: number;
  };
};

export function SuggestedCommunityCard({ communities }: { communities: Community[] }) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-emerald-300/10 bg-[linear-gradient(180deg,rgba(22,28,46,0.96),rgba(11,16,28,0.98))] p-6 shadow-[0_18px_44px_rgba(2,6,23,0.32),0_0_24px_rgba(16,185,129,0.06)] transition-all duration-200"
      id="community-discover"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_34%)]" />
      <div className="relative flex items-center gap-2 text-emerald-200">
        <Sparkles className="h-4 w-4" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300">
          Communities
        </h2>
      </div>
      <div className="relative mt-4 space-y-4">
        {communities.length > 0 ? (
          communities.map((community) => {
            const categoryLabel = getCommunityCategoryLabel(
              community.category,
              community.custom_category,
            );

            return (
              <Link
              className="block overflow-hidden rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] shadow-[0_8px_24px_rgba(15,23,42,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10"
              href="/communities"
              key={community.id}
            >
              <div className="relative h-28 overflow-hidden border-b border-white/6">
                {community.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={community.name} className="h-full w-full object-cover" src={community.cover_url} />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(129,140,248,0.18),transparent_34%),linear-gradient(135deg,rgba(24,34,56,0.96),rgba(10,14,28,0.98))]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(9,13,24,0.72))]" />
                {categoryLabel ? (
                  <span className="absolute left-3 top-3 rounded-xl border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                    {categoryLabel}
                  </span>
                ) : null}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-50">{community.name}</p>
                  <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs text-slate-300">
                    {community._count.community_members} members
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {community.description || "A new space for people with shared interests to connect."}
                </p>
              </div>
            </Link>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-emerald-300/14 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.02))] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/16 bg-emerald-400/12 text-emerald-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-100">No communities have landed yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The first active groups created in the app will appear here with their member counts and details.
            </p>
            <div className="mt-4 space-y-2">
              <div className="h-11 rounded-2xl border border-white/6 bg-white/[0.03]" />
              <div className="h-11 rounded-2xl border border-white/6 bg-white/[0.02]" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
