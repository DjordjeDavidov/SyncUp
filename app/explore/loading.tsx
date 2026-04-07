function SkeletonTile({ className }: { className: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[1.6rem] border border-white/8 bg-[linear-gradient(180deg,rgba(22,30,48,0.94),rgba(10,14,26,0.98))] ${className}`}
    >
      <div className="h-full w-full animate-pulse bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]" />
    </div>
  );
}

export default function ExploreLoading() {
  return (
    <div className="space-y-8 py-8">
      <div className="surface-card rounded-[1.8rem] border border-white/8 p-6">
        <div className="space-y-4">
          <div className="h-3 w-20 animate-pulse rounded-full bg-indigo-400/30" />
          <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-white/6" />
          <div className="h-5 w-full animate-pulse rounded-2xl bg-white/5" />
          <div className="h-5 w-4/5 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-12 w-full animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonTile className="h-44" />
            <SkeletonTile className="h-44" />
          </div>
          <div className="grid auto-rows-[160px] grid-cols-2 gap-4 md:auto-rows-[180px] lg:grid-cols-3">
            <SkeletonTile className="sm:col-span-2 sm:row-span-3" />
            <SkeletonTile className="row-span-2" />
            <SkeletonTile className="row-span-1" />
            <SkeletonTile className="sm:col-span-2 sm:row-span-2" />
            <SkeletonTile className="row-span-2" />
            <SkeletonTile className="row-span-1" />
          </div>
        </div>
        <div className="space-y-6">
          <SkeletonTile className="h-72" />
          <SkeletonTile className="h-80" />
        </div>
      </div>
    </div>
  );
}
