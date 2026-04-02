type AppShellProps = {
  envState: {
    hasDatabaseUrl: boolean;
    hasSupabaseUrl: boolean;
    hasSupabaseAnonKey: boolean;
    hasServiceRoleKey: boolean;
  };
};

const statusItems = [
  {
    label: "Database URL",
    key: "hasDatabaseUrl",
    detail: "Prisma introspection target",
  },
  {
    label: "Supabase URL",
    key: "hasSupabaseUrl",
    detail: "Storage and API host",
  },
  {
    label: "Anon key",
    key: "hasSupabaseAnonKey",
    detail: "Browser upload access",
  },
  {
    label: "Service role",
    key: "hasServiceRoleKey",
    detail: "Server-side admin operations",
  },
] as const;

export function AppShell({ envState }: AppShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="glass-card overflow-hidden rounded-[28px]">
        <div className="border-b border-black/5 px-5 py-4 sm:px-8 sm:py-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-teal-700">
            SyncUp
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            A real-data social MVP wired for Supabase from the first commit.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">
            The app scaffold is ready. Prisma introspection is the remaining gateway
            to mapping your existing tables into auth, profiles, posts, communities,
            activities, and admin views without inventing schema by hand.
          </p>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-8 sm:py-8 lg:grid-cols-4">
          {statusItems.map((item) => {
            const ready = envState[item.key];

            return (
              <div
                className="rounded-3xl border border-black/5 bg-white/80 p-4 shadow-sm"
                key={item.label}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-800">{item.label}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      ready
                        ? "bg-teal-100 text-teal-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {ready ? "Ready" : "Missing"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-stone-500">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-card rounded-[28px] p-5 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-stone-500">
            Build Sequence
          </p>
          <ol className="mt-5 space-y-4 text-sm leading-6 text-stone-700 sm:text-base">
            <li>1. Introspect the existing Supabase Postgres schema with Prisma.</li>
            <li>2. Generate the Prisma client from live models instead of guessing tables.</li>
            <li>3. Map auth, profiles, posts, communities, activities, likes, and joins to those models.</li>
            <li>4. Connect image uploads to Supabase Storage and persist only file paths in the database.</li>
            <li>5. Verify the app with typechecks and `npm run dev`.</li>
          </ol>
        </article>

        <article className="glass-card rounded-[28px] p-5 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-stone-500">
            Current Blocker
          </p>
          <p className="mt-5 text-sm leading-6 text-stone-700 sm:text-base">
            The configured database host resolves to IPv6 on this machine, and Prisma
            cannot reach it on port 5432. Once we switch to an IPv4-compatible Supabase
            connection string or pooler URL, the rest of the implementation can proceed
            against your real tables.
          </p>
        </article>
      </section>
    </main>
  );
}
