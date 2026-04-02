import Link from "next/link";
import { Users } from "lucide-react";
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
    <section
      className="relative overflow-hidden rounded-2xl border border-indigo-300/10 bg-[linear-gradient(180deg,rgba(22,28,46,0.96),rgba(11,16,28,0.98))] p-6 shadow-[0_18px_44px_rgba(2,6,23,0.32),0_0_24px_rgba(99,102,241,0.06)] transition-all duration-200"
      id="people-discover"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.12),transparent_34%)]" />
      <div className="relative flex items-center gap-2 text-indigo-200">
        <Users className="h-4 w-4" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-300">
          People to discover
        </h2>
      </div>
      <div className="relative mt-4 space-y-4">
        {people.length > 0 ? (
          people.map((person) => (
            <Link
              className="block rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))]"
              href={`/profile/${person.username}`}
              key={person.id}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-indigo-500/30 text-sm font-semibold text-white">
                  {person.profiles?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={person.profiles.full_name ?? person.username}
                      className="h-full w-full object-cover"
                      src={person.profiles.avatar_url}
                    />
                  ) : (
                    getInitials(person.profiles?.full_name ?? person.username)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-50">
                    {person.profiles?.full_name ?? person.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {person.profiles?.bio || "This person is new here and still shaping their profile."}
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-indigo-300/14 bg-[linear-gradient(180deg,rgba(99,102,241,0.08),rgba(255,255,255,0.02))] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-300/16 bg-indigo-400/12 text-indigo-100">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-100">Your people queue is warming up</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              No suggestions yet. As more profiles get completed, fresh people will show up here.
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
