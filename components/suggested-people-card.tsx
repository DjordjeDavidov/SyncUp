import { getInitials } from "@/lib/utils";

type Person = {
  id: string;
  username: string;
  profiles: {
    full_name: string;
    bio: string | null;
    avatar_url: string | null;
    city: string | null;
    country: string | null;
  } | null;
};

export function SuggestedPeopleCard({ people }: { people: Person[] }) {
  return (
    <section className="surface-card rounded-[28px] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">
        People to discover
      </h2>
      <div className="mt-4 space-y-4">
        {people.length > 0 ? (
          people.map((person) => (
            <article className="rounded-3xl border border-white/6 bg-white/3 p-4" key={person.id}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-indigo-500/30 text-sm font-semibold text-white">
                  {person.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={person.profiles.full_name ?? person.username} className="h-full w-full object-cover" src={person.profiles.avatar_url} />
                  ) : (
                    getInitials(person.profiles?.full_name ?? person.username)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-50">
                    {person.profiles?.full_name ?? person.username}
                  </p>
                  <p className="truncate text-xs text-slate-400">@{person.username}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {person.profiles?.bio || "This person is new here and still shaping their profile."}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-white/8 px-4 py-4 text-sm leading-6 text-slate-400">
            No suggestions yet. As more people complete their profiles, they will show up here.
          </p>
        )}
      </div>
    </section>
  );
}
