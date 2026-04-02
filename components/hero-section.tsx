import Link from "next/link";

const previewUsers = [
  {
    name: "Maya, 24",
    vibe: "Film nights, city walks, spontaneous plans",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    match: "98% vibe match",
  },
  {
    name: "Luka, 27",
    vibe: "Coffee runs, rooftop hangs, pickup basketball",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    match: "94% nearby",
  },
];

const communities = [
  { name: "Weekend Wanders", count: "940 online", tone: "Hiking + brunch" },
  { name: "Pixel Party", count: "412 online", tone: "Gaming squad" },
  { name: "Night Owls Club", count: "188 joining tonight", tone: "Late coffee" },
];

const activityAvatars = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
];

export function LandingHero() {
  return (
    <section className="hero-shell hero-surface relative rounded-[44px] px-6 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20">
      <div className="section-glow left-10 top-10 h-72 w-72 bg-indigo-500/20" />
      <div className="section-glow right-8 top-8 h-96 w-96 bg-violet-500/22" />
      <div className="section-glow right-1/4 top-1/2 h-72 w-72 -translate-y-1/2 bg-sky-500/12" />
      <div className="hero-noise absolute inset-0 opacity-40" />

      <div className="relative z-10 grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(460px,560px)]">
        <div className="max-w-2xl lg:max-w-3xl">
          <p className="eyebrow">Social discovery, reimagined</p>

          <h1 className="section-title mt-6 text-6xl font-semibold leading-[0.86] text-white sm:text-7xl lg:text-[6.35rem]">
            Find your people.
            <span className="mt-3 block bg-[linear-gradient(135deg,#ddd6fe_0%,#8b5cf6_38%,#38bdf8_100%)] bg-clip-text text-transparent">
              Not just profiles.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-200 sm:text-[1.35rem] sm:leading-9">
            Discover people, communities, and plans that match your vibe.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link className="cta-primary" href="/register">
              Get started
            </Link>
            <Link className="cta-secondary" href="#use-cases">
              Explore
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {[
              "940 members online",
              "12 people joining tonight",
              "Gaming, hiking, coffee",
            ].map((item) => (
              <div
                className="glass-panel rounded-full px-4 py-2 text-sm font-medium text-slate-100"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.42),transparent_58%)] blur-3xl" />
          <div className="relative h-[560px]">
            <div className="premium-card absolute inset-x-6 top-10 z-10 rounded-[36px] p-5 shadow-[0_36px_110px_rgba(2,6,23,0.5)]">
              <div className="absolute inset-x-0 top-0 h-32 rounded-t-[36px] bg-[linear-gradient(135deg,rgba(99,102,241,0.28),rgba(168,85,247,0.16),transparent)]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Discover now
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      Tonight feels social
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
                    24 live nearby
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-3 backdrop-blur-md">
                  <div className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/5 px-4 py-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.7)]" />
                    <p className="text-sm text-slate-200">Try “movie night + coffee after”</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {communities.map((community) => (
                    <div
                      className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 py-4 backdrop-blur-md"
                      key={community.name}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-white">
                            {community.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">{community.tone}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-200">
                          {community.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,35,0.78),rgba(8,11,24,0.96))] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Friday rooftop hang</p>
                      <p className="mt-1 text-xs text-slate-400">8:30 PM • Dorcol • 5 spots left</p>
                    </div>
                    <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-200">
                      12 joining
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-3">
                      {activityAvatars.map((avatar, index) => (
                        <div
                          className="h-10 w-10 overflow-hidden rounded-full border-2 border-[#0b1020]"
                          key={`${avatar}-${index}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt="" className="h-full w-full object-cover" src={avatar} />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">People already in</p>
                  </div>
                </div>
              </div>
            </div>

            <article className="premium-card absolute right-0 top-0 z-20 w-[52%] rotate-[8deg] rounded-[30px] p-3 shadow-[0_26px_80px_rgba(2,6,23,0.45)]">
              <div className="relative overflow-hidden rounded-[22px]">
                <div
                  className="h-48 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${previewUsers[0].image})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,12,24,0.1),rgba(9,12,24,0.68)_58%,rgba(9,12,24,0.92))]" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                    User
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {previewUsers[0].name}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-200/90">
                    {previewUsers[0].vibe}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white">
                  {previewUsers[0].match}
                </span>
                <span className="text-xs text-slate-400">People</span>
              </div>
            </article>

            <article className="premium-card absolute bottom-6 left-0 z-0 w-[48%] -rotate-[7deg] rounded-[30px] p-3 shadow-[0_26px_80px_rgba(2,6,23,0.42)]">
              <div className="relative overflow-hidden rounded-[22px]">
                <div
                  className="h-40 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${previewUsers[1].image})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,12,24,0.08),rgba(9,12,24,0.65)_58%,rgba(9,12,24,0.92))]" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                    Activity match
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {previewUsers[1].name}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-200/90">
                    {previewUsers[1].vibe}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white">
                  {previewUsers[1].match}
                </span>
                <span className="text-xs text-slate-400">Nearby</span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
