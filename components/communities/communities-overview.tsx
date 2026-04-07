import Link from "next/link";
import { Lock, Plus, Sparkles, Users } from "lucide-react";
import { getCommunityCategoryLabel } from "@/lib/community-categories";

type CommunityCard = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  custom_category: string | null;
  cover_url: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  _count: {
    community_members: number;
  };
};

type Props = {
  ownedCommunities: CommunityCard[];
  joinedCommunities: CommunityCard[];
  discoverCommunities: CommunityCard[];
};

function CommunityList({
  title,
  description,
  communities,
}: {
  title: string;
  description: string;
  communities: CommunityCard[];
}) {
  if (communities.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {title === "Discover more" && (
          <Link
            className="text-sm font-semibold text-slate-300 transition-all duration-200 hover:text-white"
            href="/communities"
          >
            View all →
          </Link>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => {
          const categoryLabel = getCommunityCategoryLabel(
            community.category,
            community.custom_category,
          );

          return (
            <Link href={`/communities/${community.slug}`} key={community.id}>
              <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(20,28,46,0.94),rgba(10,14,28,0.98))] shadow-[0_12px_32px_rgba(2,6,23,0.25)] transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_20px_48px_rgba(2,6,23,0.35)] h-full">
                <div className="relative h-32 overflow-hidden border-b border-white/8">
                  {community.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={community.name}
                      className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
                      src={community.cover_url}
                    />
                  ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(129,140,248,0.22),transparent_34%),linear-gradient(135deg,rgba(24,34,56,0.96),rgba(10,14,28,0.98))] transition-all duration-300 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(9,13,24,0.6))]" />
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    {categoryLabel ? (
                      <span className="rounded-xl border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                        {categoryLabel}
                      </span>
                    ) : null}
                    {community.visibility === "PRIVATE" ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-slate-200 backdrop-blur-sm">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-white truncate">
                        {community.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {community._count.community_members} members
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">
                    {community.description || "A new SyncUp community."}
                  </p>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function CommunitiesOverview({
  ownedCommunities,
  joinedCommunities,
  discoverCommunities,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="surface-card rounded-3xl border border-white/10 p-6 sm:p-8 shadow-[0_20px_60px_rgba(2,6,23,0.3)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Communities
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Your community spaces
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create new spaces, manage the ones you own, and keep track of the groups you've joined.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08]"
              href="/communities"
            >
              <Users className="h-4 w-4" />
              Browse all
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(99,102,241,0.34)]"
              href="/communities/new"
            >
              <Plus className="h-4 w-4" />
              Create Community
            </Link>
          </div>
        </div>
      </section>

      <CommunityList
        communities={ownedCommunities}
        description="Communities you created appear here first."
        title="Owned by you"
      />
      <CommunityList
        communities={joinedCommunities}
        description="Groups you joined and can keep an eye on."
        title="Joined communities"
      />
      <CommunityList
        communities={discoverCommunities}
        description="Public spaces from around SyncUp that are active right now."
        title="Discover more"
      />
    </div>
  );
}
