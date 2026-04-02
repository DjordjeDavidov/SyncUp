import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingHero } from "@/components/hero-section";
import { Navbar } from "@/components/navbar";
import { getCurrentUser } from "@/server/auth";

const steps = [
  {
    icon: "profile",
    title: "Create your profile",
    copy: "Add your vibe, interests, and social style so SyncUp knows what feels natural to you.",
  },
  {
    icon: "match",
    title: "Discover matches",
    copy: "Browse people, communities, and moments that line up with your energy instead of endless random profiles.",
  },
  {
    icon: "activity",
    title: "Join real activities",
    copy: "Move from scrolling to actually showing up, whether that means game night, coffee, or a weekend hike.",
  },
];

const useCases = [
  {
    title: "Find a gaming squad",
    copy: "Late-night sessions, ranked runs, and chill voice chat with people on your wavelength.",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    tags: ["Gaming", "Voice chat", "Squad"],
    joining: "12 people joining",
    time: "Tonight, 9:00 PM",
    location: "Discord + local LAN cafe",
    spotsLeft: "4 spots left",
    avatars: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    ],
  },
  {
    title: "Join a hiking group",
    copy: "Trail plans, sunrise walks, and weekend escapes with outdoorsy people nearby.",
    image:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1200&q=80",
    tags: ["Hiking", "Outdoors", "Weekend"],
    joining: "18 people joining",
    time: "Saturday, 7:30 AM",
    location: "Avala trailhead",
    spotsLeft: "6 spots left",
    avatars: [
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    ],
  },
  {
    title: "Coffee with new people",
    copy: "Low-pressure hangs when you want good conversation without the awkwardness.",
    image:
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80",
    tags: ["Coffee", "Conversation", "New in town"],
    joining: "9 people joining",
    time: "Tomorrow, 5:30 PM",
    location: "Central Roasters",
    spotsLeft: "3 spots left",
    avatars: [
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
    ],
  },
  {
    title: "Movie night crew",
    copy: "From indie picks to comfort rewatches, find people who actually want to make plans happen.",
    image:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
    tags: ["Movies", "Snacks", "Night out"],
    joining: "15 people joining",
    time: "Friday, 8:15 PM",
    location: "Open Air Cinema",
    spotsLeft: "5 spots left",
    avatars: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1506795660185-1b8d7c0f4b54?auto=format&fit=crop&w=200&q=80",
    ],
  },
];

const communities = [
  {
    name: "Night Owls Club",
    tags: ["Coffee", "Deep chats", "Late-night"],
    members: "1.2k members",
    online: "940 members online",
    accent: "from-indigo-500/35 via-violet-500/20 to-transparent",
    avatars: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
    ],
  },
  {
    name: "Pixel Party",
    tags: ["Gaming", "Co-op", "PC + Console"],
    members: "870 members",
    online: "412 members online",
    accent: "from-sky-500/35 via-cyan-500/20 to-transparent",
    avatars: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80",
    ],
  },
  {
    name: "Weekend Wanders",
    tags: ["Hiking", "Nature", "Day trips"],
    members: "940 members",
    online: "286 members online",
    accent: "from-emerald-500/35 via-teal-500/20 to-transparent",
    avatars: [
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1506795660185-1b8d7c0f4b54?auto=format&fit=crop&w=200&q=80",
    ],
  },
  {
    name: "Screening Room",
    tags: ["Movies", "Popcorn", "After-talk"],
    members: "630 members",
    online: "198 members online",
    accent: "from-fuchsia-500/30 via-pink-500/20 to-transparent",
    avatars: [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1506795660185-1b8d7c0f4b54?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
    ],
  },
  {
    name: "City Socials",
    tags: ["Meetups", "Food", "New friends"],
    members: "2.3k members",
    online: "1.1k members online",
    accent: "from-orange-500/30 via-rose-500/20 to-transparent",
    avatars: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    ],
  },
  {
    name: "Creative Corner",
    tags: ["Art", "Music", "Ideas"],
    members: "710 members",
    online: "248 members online",
    accent: "from-violet-500/30 via-indigo-500/20 to-transparent",
    avatars: [
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=200&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    ],
  },
];

const particles = [
  { left: "6%", top: "14%", size: 5, duration: 22, delay: 0, opacity: 0.16 },
  { left: "14%", top: "72%", size: 4, duration: 26, delay: 4, opacity: 0.12 },
  { left: "20%", top: "38%", size: 6, duration: 24, delay: 2, opacity: 0.14 },
  { left: "28%", top: "82%", size: 3, duration: 20, delay: 7, opacity: 0.12 },
  { left: "34%", top: "18%", size: 4, duration: 28, delay: 1, opacity: 0.1 },
  { left: "41%", top: "58%", size: 5, duration: 25, delay: 3, opacity: 0.14 },
  { left: "48%", top: "28%", size: 3, duration: 23, delay: 5, opacity: 0.11 },
  { left: "54%", top: "76%", size: 6, duration: 27, delay: 2, opacity: 0.13 },
  { left: "61%", top: "12%", size: 4, duration: 24, delay: 6, opacity: 0.15 },
  { left: "68%", top: "46%", size: 5, duration: 29, delay: 0, opacity: 0.11 },
  { left: "74%", top: "84%", size: 3, duration: 21, delay: 8, opacity: 0.1 },
  { left: "81%", top: "24%", size: 6, duration: 26, delay: 2, opacity: 0.13 },
  { left: "88%", top: "64%", size: 4, duration: 25, delay: 5, opacity: 0.12 },
  { left: "92%", top: "10%", size: 3, duration: 22, delay: 1, opacity: 0.1 },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/home");
  }

  return (
    <div className="app-shell">
      <div className="particle-field" aria-hidden="true">
        {particles.map((particle, index) => (
          <span
            className="particle-dot"
            key={`${particle.left}-${particle.top}-${index}`}
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <Navbar />
        <LandingHero />
        <section className="soft-section relative mt-24 sm:mt-28" id="how-it-works">
          <div className="section-glow left-12 top-12 h-48 w-48 bg-indigo-500/15" />
          <div className="flex items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow">How it works</p>
              <h2 className="section-title mt-4 text-3xl text-slate-50 sm:text-4xl">
                Three easy moves from profile to plans.
              </h2>
            </div>
            <p className="hidden max-w-md text-sm leading-6 text-slate-400 lg:block">
              The flow is built to feel social, not transactional. Short setup, smart
              discovery, real-world momentum.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {steps.map((step) => (
              <article className="glass-panel surface-clickable rounded-[32px] p-7 sm:p-8" key={step.title}>
                <StepPreview type={step.icon} />
                <h3 className="mt-6 text-xl font-semibold text-slate-50">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{step.copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="soft-section relative mt-24 sm:mt-28" id="use-cases">
          <div className="section-glow right-0 top-16 h-56 w-56 bg-violet-500/15" />
          <div className="max-w-2xl">
            <p className="eyebrow">Real use cases</p>
            <h2 className="section-title mt-4 text-3xl text-slate-50 sm:text-4xl">
              Built for the kinds of plans people actually want to say yes to.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {useCases.map((useCase) => (
              <article
                className="premium-card group min-h-[360px] rounded-[32px]"
                key={useCase.title}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${useCase.image})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,14,28,0.22),rgba(10,14,28,0.7)_40%,rgba(10,14,28,0.92))]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(79,70,229,0.24),rgba(59,130,246,0.14),rgba(10,14,28,0.12))]" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-black/30 px-3 py-1 text-[11px] font-medium text-emerald-300 backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]" />
                    {useCase.joining}
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                    {useCase.spotsLeft}
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="text-lg font-semibold text-white">{useCase.title}</p>
                  <p className="mt-2 max-w-[24ch] text-sm leading-6 text-slate-200/90">{useCase.copy}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {useCase.tags.map((tag) => (
                      <span
                        className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] text-slate-100 backdrop-blur-md"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex -space-x-3">
                      {useCase.avatars.map((avatar, index) => (
                        <div
                          className="h-9 w-9 overflow-hidden rounded-full border-2 border-[#0b1020] transition duration-300 group-hover:-translate-y-0.5"
                          key={`${useCase.title}-${index}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt="" className="h-full w-full object-cover" src={avatar} />
                        </div>
                      ))}
                    </div>
                    <div className="text-right text-[11px] text-slate-200/90">
                      <p>{useCase.time}</p>
                      <p className="mt-1 text-slate-300">{useCase.location}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="soft-section relative mt-24 sm:mt-28" id="communities">
          <div className="section-glow left-1/3 top-6 h-52 w-52 bg-sky-500/15" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">Communities preview</p>
              <h2 className="section-title mt-4 text-3xl text-slate-50 sm:text-4xl">
                Drop into spaces that already feel like your crowd.
              </h2>
            </div>
            <Link
              className="inline-flex self-start rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10 lg:self-auto"
              href="/register"
            >
              Explore more
            </Link>
          </div>

          <div className="mt-12 grid gap-7 lg:grid-cols-3">
            {communities.map((community) => (
              <article
                className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-[#172036] p-7 shadow-[0_24px_70px_rgba(2,6,23,0.34)] transition duration-300 hover:-translate-y-1.5 hover:border-indigo-300/20 hover:shadow-[0_32px_90px_rgba(2,6,23,0.42),0_0_0_1px_rgba(129,140,248,0.08)] sm:p-8"
                key={community.name}
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${community.accent} opacity-70`}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_26%,transparent)]" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
                        {community.name}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">{community.members}</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-slate-100">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]" />
                      Active
                    </span>
                  </div>

                  <div className="mt-6 h-px bg-white/8" />

                  <div className="mt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Live users
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-black/15 px-4 py-3.5 transition duration-300 group-hover:border-white/16 group-hover:bg-black/20">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-100">{community.online}</p>
                      <p className="mt-1 text-xs text-slate-400">People chatting right now</p>
                    </div>
                    <div className="flex -space-x-3">
                      {community.avatars.map((avatar, index) => (
                        <div
                          className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#0b1020] transition duration-300 group-hover:-translate-y-0.5"
                          key={`${community.name}-${index}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt="" className="h-full w-full object-cover" src={avatar} />
                          {index === 0 ? (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0b1020] bg-emerald-400" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                  </div>

                  <div className="mt-6 h-px bg-white/8" />

                  <div className="mt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Tags
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                    {community.tags.map((tag) => (
                      <span
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-200"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  </div>

                  <div className="mt-6 h-px bg-white/8" />

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <p className="min-w-0 text-sm text-slate-400">Jump into the conversation</p>
                    <p className="shrink-0 text-sm font-medium text-slate-100 transition duration-300 group-hover:translate-x-1">
                      Join the room
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="soft-section relative mt-24 sm:mt-28">
          <div className="section-glow left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 bg-violet-500/20" />
          <div className="premium-card relative rounded-[40px] bg-[linear-gradient(135deg,rgba(79,70,229,0.28),rgba(59,130,246,0.18)_45%,rgba(9,12,24,0.96)_100%)] px-6 py-16 text-center sm:px-10">
            <div className="mx-auto max-w-2xl">
              <p className="eyebrow justify-center">Start here</p>
              <h2 className="section-title mt-4 text-4xl text-white sm:text-5xl">
                Start building your circle today
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-200">
                Make your profile, find your vibe, and step into communities that feel
                like they were waiting for you.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  className="cta-primary"
                  href="/register"
                >
                  Create your profile
                </Link>
              </div>
            </div>
          </div>
        </section>
        <footer className="mt-24 flex flex-col gap-4 border-t border-white/8 py-10 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>SyncUp helps people discover communities, activities, and friendships that actually click.</p>
          <div className="flex items-center gap-4">
            <Link href="/register">Sign up</Link>
            <Link href="/login">Log in</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StepPreview({ type }: { type: (typeof steps)[number]["icon"] }) {
  if (type === "profile") {
    return (
      <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Profile preview"
              className="h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Mila</p>
            <p className="text-xs text-slate-400">Cafe hopping, indie films, tennis</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Creative", "Outgoing", "Belgrade"].map((tag) => (
            <span
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (type === "match") {
    return (
      <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Suggested for you</p>
          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-300">
            98%
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {["Gaming squad", "Coffee meetup", "Hiking circle"].map((item) => (
            <div className="flex items-center gap-3" key={item}>
              <div className="h-2.5 w-2.5 rounded-full bg-indigo-400 shadow-[0_0_18px_rgba(129,140,248,0.7)]" />
              <p className="text-sm text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">This week</p>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200">
          3 plans
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {[
          "Rooftop movie night",
          "Saturday forest trail",
          "Sunday board game cafe",
        ].map((item) => (
          <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-slate-200" key={item}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
