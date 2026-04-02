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
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xl font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {communities.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {communities.map((community) => {
            const categoryLabel = getCommunityCategoryLabel(
              community.category,
              community.custom_category,
            );

            return (
              <article
              className="overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(20,28,46,0.94),rgba(10,14,28,0.98))] shadow-[0_18px_40px_rgba(2,6,23,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/12"
              key={community.id}
            >
              <div className="relative h-36 overflow-hidden border-b border-white/8">
                {community.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={community.name} className="h-full w-full object-cover" src={community.cover_url} />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(129,140,248,0.22),transparent_34%),linear-gradient(135deg,rgba(24,34,56,0.96),rgba(10,14,28,0.98))]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(9,13,24,0.78))]" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {categoryLabel ? (
                    <span className="rounded-xl border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                      {categoryLabel}
                    </span>
                  ) : null}
                  <span className="rounded-xl border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                    {community.visibility === "PRIVATE" ? "Private" : "Public"}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{community.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{community._count.community_members} members</p>
                  </div>
                  {community.visibility === "PRIVATE" ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-slate-300">
                      <Lock className="h-4 w-4" />
                    </div>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {community.description || "A new SyncUp community ready for conversation, invites, and discovery."}
                </p>
              </div>
            </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-indigo-200">
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-4 text-base font-semibold text-white">Nothing here yet</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      )}
    </section>
  );
}

export function CommunitiesOverview({ ownedCommunities, joinedCommunities, discoverCommunities }: Props) {
  return (
    <div className="space-y-8">
      <section className="surface-card rounded-2xl border border-white/8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Communities</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Your community spaces</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create new spaces, manage the ones you own, and keep track of the groups you’ve joined.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(99,102,241,0.34)]"
            href="/communities/new"
          >
            <Plus className="h-4 w-4" />
            Create Community
          </Link>
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
