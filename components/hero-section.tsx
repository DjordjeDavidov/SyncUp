import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative mt-6 overflow-hidden rounded-[48px] border border-white/10 bg-slate-950/80 px-6 py-12 shadow-[0_40px_120px_rgba(6,11,31,0.55)] sm:mt-8 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.24),transparent_28%),radial-gradient(circle_at_80%_40%,rgba(59,130,246,0.16),transparent_22%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(15,23,42,0.72))]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"160\\" height=\\"160\\"><circle cx=\\"80\\" cy=\\"80\\" r=\\"1\\" fill=\\"rgba(255,255,255,0.04)\\"/><circle cx=\\"20\\" cy=\\"20\\" r=\\"1\\" fill=\\"rgba(255,255,255,0.03)\\"/></svg>")',
          backgroundRepeat: "repeat",
        }}
      />

      <div className="relative z-10 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300/80">
            Social energy that feels alive
          </p>

          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Find your people.
            <span className="block bg-gradient-to-r from-violet-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
              Not just profiles.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
            Move past endless scrolling and join real groups, events, and shared moments.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-violet-500/30"
            >
              Get started
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:bg-white/10"
            >
              Explore the flow
            </Link>
          </div>

          <div className="mt-8 inline-flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="rounded-full bg-white/5 px-3 py-2">940 members online now</span>
            <span className="rounded-full bg-white/5 px-3 py-2">18 events live tonight</span>
          </div>
        </div>

        <div className="relative w-full h-full flex items-center justify-end">
          <div className="absolute right-0 w-[600px] h-[600px] bg-purple-500/20 blur-[120px] rounded-full" />

          <span className="hero-particle hero-particle-1" />
          <span className="hero-particle hero-particle-2" />
          <span className="hero-particle hero-particle-3" />
          <span className="hero-particle hero-particle-4" />

          <img
            src="/hero-social.png"
            alt="Social network"
            className="relative w-[700px] max-w-none object-contain pointer-events-none select-none animate-[float_6s_ease-in-out_infinite]"
          />
        </div>
      </div>
    </section>
  );
}