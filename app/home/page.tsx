import { redirect } from "next/navigation";
import { CalendarClock, ImageIcon, Sparkles, Users, Vote } from "lucide-react";
import {
  cancelActivityPostAction,
  createCommentAction,
  createPostAction,
  deleteOwnPostAction,
  joinActivityPostAction,
  logoutAction,
  toggleSaveAction,
  toggleLikeAction,
  updateActivityPostAction,
  voteOnPollAction,
} from "@/actions/feed";
import { CreatePostCard } from "@/components/create-post-card";
import { ExploreSidebar } from "@/components/explore-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { PostCard } from "@/components/post-card";
import { mapPostRecordToPost } from "@/lib/post-mappers";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getHomeFeedData } from "@/server/queries";

export default async function HomePage() {
  const currentUser = await getCurrentUserOrRedirect();

  if (!currentUser.profile?.full_name) {
    redirect("/onboarding");
  }

  const data = await getHomeFeedData(currentUser.id);
  const feedPosts = data.posts.map((post) => mapPostRecordToPost(post, currentUser.id));
  const previewCards = [
    {
      type: "post",
      title: "Late-night ramen recs?",
      body: "Just finished work and I’m not ready to go home yet. Best cozy spot open past midnight?",
      meta: ["Photo + text post", "6 likes", "2 comments"],
      icon: ImageIcon,
      accent: "text-slate-100 border-white/10 bg-white/[0.06]",
      cta: "Reply",
    },
    {
      type: "invite",
      title: "Movie night crew?",
      body: "Thinking about a late showing tonight. Anyone up for popcorn and bad takes after?",
      meta: ["Tonight at 8:30 PM", "Belgrade Waterfront", "4/8 joined"],
      icon: Sparkles,
      accent: "text-sky-200 border-sky-300/18 bg-sky-400/10",
      cta: "Join",
    },
    {
      type: "poll",
      title: "Where should the next hangout be?",
      body: "Polls are great for quick decisions when the group vibe is split.",
      meta: ["Cafe district 48%", "Park meetup 32%", "Board game bar 20%"],
      icon: Vote,
      accent: "text-indigo-200 border-indigo-300/18 bg-indigo-400/10",
      cta: "Vote",
    },
    {
      type: "post",
      title: "Best rooftop view in the city",
      body: "Snapped this on the way back from an event. SyncUp should absolutely have more golden-hour meetups.",
      meta: ["Image post", "14 likes", "Saved by 3"],
      icon: ImageIcon,
      accent: "text-sky-100 border-sky-300/18 bg-sky-400/10",
      cta: "Save",
    },
  ] as const;

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />
        <div className="grid gap-8 py-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <ExploreSidebar
            people={data.people}
            communities={data.communities}
            activities={data.activities}
          />
          <main className="space-y-6">
            <section className="surface-card rounded-3xl border border-white/10 p-6 sm:p-8 shadow-[0_20px_60px_rgba(2,6,23,0.3)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Discover</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Your personalized feed</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Connect with people who share your interests and join communities that match your vibe.
                  </p>
                </div>
                  </div>
            </section>

            <div className="animate-feed-in">
              <CreatePostCard action={createPostAction} currentUser={currentUser} />
            </div>
            {feedPosts.length > 0 ? (
              <div className="space-y-5">
                {feedPosts.map((post, index) => (
                  <div
                    className="animate-feed-in"
                    key={post.id}
                    style={{ animationDelay: `${Math.min(index * 70, 280)}ms` }}
                  >
                    <PostCard
                      action={toggleLikeAction}
                      cancelAction={cancelActivityPostAction}
                      commentAction={createCommentAction}
                      deleteAction={deleteOwnPostAction}
                      joinAction={joinActivityPostAction}
                      post={post}
                      saveAction={toggleSaveAction}
                      updateAction={updateActivityPostAction}
                      voteAction={voteOnPollAction}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="surface-card animate-feed-in rounded-3xl border border-white/10 p-6 sm:p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-200">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">Your feed is getting started</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Follow people and join communities to see posts, invites, and activities from your network.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href="#people-discover"
                      className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <Users className="h-4 w-4" />
                      Find people to follow
                    </a>
                    <a
                      href="#community-discover"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08]"
                    >
                      <Sparkles className="h-4 w-4" />
                      Browse communities
                    </a>
                  </div>
                </div>
                <div className="animate-feed-in">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300 mb-4">Preview of what you'll see</p>
                </div>
                {previewCards.map((card, index) => {
                  const Icon = card.icon;

                  return (
                    <article
                      className="animate-feed-in group relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(24,32,52,0.94),rgba(11,16,28,0.96))] p-4 shadow-[0_18px_48px_rgba(2,6,23,0.34),0_0_0_1px_rgba(255,255,255,0.02),0_0_28px_rgba(99,102,241,0.06)] transition-all duration-200 hover:scale-[1.01] hover:border-indigo-300/20 sm:p-6"
                      key={card.title}
                      style={{ animationDelay: `${120 + Math.min(index * 90, 360)}ms` }}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(129,140,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.07),transparent_28%)] opacity-80" />
                      <div className="relative flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.36),rgba(59,130,246,0.18))] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.35)]">
                          SU
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                            <p className="text-[15px] font-bold tracking-tight text-slate-50">SyncUp Preview</p>
                            <p className="text-sm font-medium text-muted-foreground">@syncup</p>
                            <span className="text-[11px] text-slate-600">&bull;</span>
                            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">Just now</p>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${card.accent}`}>
                              <Icon className="h-3.5 w-3.5" />
                              {card.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                        <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                        <p className="mt-3 text-[15px] leading-7 text-slate-200">{card.body}</p>
                        <div className="mt-5 flex flex-wrap gap-3">
                          {card.meta.map((item) => (
                            <span className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-slate-200" key={item}>
                              {item}
                            </span>
                          ))}
                        </div>
                        {card.type === "post" ? (
                          <div className="mt-5 overflow-hidden rounded-2xl border border-white/8 bg-slate-950/40">
                            <div className="h-56 w-full bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(129,140,248,0.2),transparent_32%),linear-gradient(135deg,rgba(28,38,62,0.96),rgba(14,18,30,0.98))]" />
                          </div>
                        ) : null}
                        <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            Multi-format feed preview
                          </div>
                          <button
                            className="rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5"
                            type="button"
                          >
                            {card.cta}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
