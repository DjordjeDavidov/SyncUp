import { redirect } from "next/navigation";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { ProfileContent } from "@/components/profile/profile-content";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { mapPostRecordToPost } from "@/lib/post-mappers";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getProfilePageData } from "@/server/queries";
import {
  cancelActivityPostAction,
  createCommentAction,
  deleteOwnPostAction,
  joinActivityPostAction,
  logoutAction,
  toggleSaveAction,
  toggleLikeAction,
  updateActivityPostAction,
  voteOnPollAction,
} from "@/actions/feed";
import { followUserAction, removeFollowerAction, unfollowUserAction } from "@/actions/profile";

type Props = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: Props) {
  const currentUser = await getCurrentUserOrRedirect();
  const data = await getProfilePageData(currentUser.id);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedTab = resolvedSearchParams?.tab;
  const initialTab =
    requestedTab === "posts" ||
    requestedTab === "media" ||
    requestedTab === "invites" ||
    requestedTab === "communities" ||
    requestedTab === "activity" ||
    requestedTab === "saved"
      ? requestedTab
      : "all";

  if (!data) {
    redirect("/home");
  }

  const profilePosts = data.posts.map((post) => mapPostRecordToPost(post, currentUser.id));
  const likedPosts = data.likedPosts.map((post) => mapPostRecordToPost(post, currentUser.id));
  const savedPosts = data.savedPosts.map((post) => mapPostRecordToPost(post, currentUser.id));

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />
        <div className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-6">
            <ProfileHeader
              activities={data.activities}
              communities={data.communities}
              followAction={followUserAction}
              followers={data.followers}
              isOwner
              following={data.following}
              removeFollowerAction={removeFollowerAction}
              stats={data.stats}
              unfollowAction={unfollowUserAction}
              user={data.user}
            />
            <ProfileContent
              activities={data.activities}
              cancelAction={cancelActivityPostAction}
              commentAction={createCommentAction}
              communities={data.communities}
              deleteAction={deleteOwnPostAction}
              initialTab={initialTab}
              isOwner
              joinAction={joinActivityPostAction}
              likeAction={toggleLikeAction}
              likedPosts={likedPosts}
              posts={profilePosts}
              saveAction={toggleSaveAction}
              savedPosts={savedPosts}
              updateAction={updateActivityPostAction}
              user={data.user}
              voteAction={voteOnPollAction}
            />
          </main>
          <aside>
            <ProfileSidebar
              activities={data.activities}
              communities={data.communities}
              posts={data.posts}
              profileBasePath="/profile"
              user={data.user}
            />
          </aside>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
