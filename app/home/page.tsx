import { redirect } from "next/navigation";
import { createPostAction, logoutAction, toggleLikeAction } from "@/actions/feed";
import { CreatePostCard } from "@/components/create-post-card";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { PostCard } from "@/components/post-card";
import { SuggestedActivityCard } from "@/components/suggested-activity-card";
import { SuggestedCommunityCard } from "@/components/suggested-community-card";
import { SuggestedPeopleCard } from "@/components/suggested-people-card";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getHomeFeedData } from "@/server/queries";

export default async function HomePage() {
  const currentUser = await getCurrentUserOrRedirect();

  if (!currentUser.profile?.full_name) {
    redirect("/onboarding");
  }

  const data = await getHomeFeedData(currentUser.id);

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />
        <div className="grid gap-6 py-8 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
          <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
            <div className="surface-card rounded-3xl p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">
                Explore
              </p>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                  <p className="font-semibold text-slate-100">People</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Meet people who share your vibe and interests.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                  <p className="font-semibold text-slate-100">Communities</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Jump into active groups around hobbies and local scenes.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                  <p className="font-semibold text-slate-100">Activities</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    See what is happening soon and who is joining.
                  </p>
                </div>
              </div>
            </div>
          </aside>
          <main className="space-y-5">
            <CreatePostCard action={createPostAction} currentUser={currentUser} />
            {data.posts.length > 0 ? (
              data.posts.map((post: (typeof data.posts)[number]) => (
                <PostCard
                  action={toggleLikeAction}
                  currentUserId={currentUser.id}
                  key={post.id}
                  post={post}
                />
              ))
            ) : (
              <div className="surface-card rounded-3xl p-8">
                <p className="text-sm font-semibold text-slate-100">Your feed is waiting for its first post.</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Share what is on your mind, post a meetup snapshot, or start the
                  conversation for your community.
                </p>
              </div>
            )}
          </main>
          <aside className="space-y-5">
            <SuggestedPeopleCard people={data.people} />
            <SuggestedCommunityCard communities={data.communities} />
            <SuggestedActivityCard activities={data.activities} />
          </aside>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
