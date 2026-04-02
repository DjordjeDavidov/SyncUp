type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  country: string | null;
  _count: {
    community_members: number;
  };
};

export function SuggestedCommunityCard({ communities }: { communities: Community[] }) {
  return (
    <section className="surface-card rounded-[28px] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
        Communities
      </h2>
      <div className="mt-4 space-y-4">
        {communities.length > 0 ? (
          communities.map((community) => (
            <article className="rounded-3xl border border-white/6 bg-white/3 p-4" key={community.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-50">{community.name}</p>
                <span className="rounded-full bg-white/6 px-2.5 py-1 text-xs text-slate-300">
                  {community._count.community_members} members
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {community.description || "A new space for people with shared interests to connect."}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-white/8 px-4 py-4 text-sm leading-6 text-slate-400">
            No communities yet. The first public groups created in the database will show up here.
          </p>
        )}
      </div>
    </section>
  );
}
