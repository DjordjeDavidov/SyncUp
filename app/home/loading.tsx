function FeedSkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(24,32,52,0.94),rgba(11,16,28,0.96))] p-4 shadow-[0_18px_48px_rgba(2,6,23,0.26)] sm:p-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-16 animate-pulse rounded-full bg-white/8" />
          </div>
          <div className="mt-3 h-3 w-24 animate-pulse rounded-full bg-white/8" />
          <div className="mt-4 flex gap-2">
            <div className="h-7 w-16 animate-pulse rounded-xl bg-white/8" />
            <div className="h-7 w-20 animate-pulse rounded-xl bg-white/8" />
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-4 w-full animate-pulse rounded-full bg-white/8" />
        <div className="h-4 w-5/6 animate-pulse rounded-full bg-white/8" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/8" />
      </div>
      <div className={`mt-5 animate-pulse rounded-2xl bg-white/8 ${tall ? "h-64" : "h-32"}`} />
      <div className="mt-5 grid grid-cols-4 gap-2 border-t border-white/6 pt-4">
        {[0, 1, 2, 3].map((item) => (
          <div className="h-11 animate-pulse rounded-2xl bg-white/8" key={item} />
        ))}
      </div>
    </article>
  );
}

export default function HomeLoading() {
  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <div className="sticky top-4 mb-2 h-[74px] rounded-[28px] border border-white/10 bg-[rgba(10,14,28,0.72)] shadow-[0_18px_50px_rgba(2,6,23,0.34)] backdrop-blur-xl" />
        <div className="grid gap-6 py-8 lg:grid-cols-[240px_minmax(0,1.12fr)_300px]">
          <aside className="hidden lg:block">
            <div className="surface-card rounded-2xl p-6">
              <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
              <div className="mt-6 space-y-4">
                {[0, 1, 2].map((item) => (
                  <div className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" key={item} />
                ))}
              </div>
            </div>
          </aside>
          <main className="space-y-8">
            <div className="overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(24,32,52,0.94),rgba(11,16,28,0.96))] p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="h-12 animate-pulse rounded-2xl bg-white/[0.05]" />
                  <div className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
                  <div className="flex justify-end">
                    <div className="h-11 w-36 animate-pulse rounded-2xl bg-white/[0.08]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <FeedSkeletonCard tall />
              <FeedSkeletonCard />
              <FeedSkeletonCard tall />
            </div>
          </main>
          <aside className="hidden space-y-6 lg:block">
            {[0, 1, 2].map((item) => (
              <div className="surface-card rounded-2xl p-6" key={item}>
                <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
                <div className="mt-4 space-y-3">
                  {[0, 1].map((inner) => (
                    <div className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" key={inner} />
                  ))}
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
