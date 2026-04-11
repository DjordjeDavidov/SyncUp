import { notFound } from "next/navigation";
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
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { ProfileContent } from "@/components/profile/profile-content";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { mapPostRecordToPost } from "@/lib/post-mappers";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getProfilePageDataByUsername } from "@/server/queries";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const currentUser = await getCurrentUserOrRedirect();
  const { username } = await params;
  const data = await getProfilePageDataByUsername(currentUser.id, username);

  if (!data) {
    notFound();
  }

  const isOwner = data.user.id === currentUser.id;
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
              followAction={followUserAction}
              followers={data.followers}
              isOwner={isOwner}
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
              isOwner={isOwner}
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
              user={data.user}
            />
          </aside>
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
