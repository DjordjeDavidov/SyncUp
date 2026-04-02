import { logoutAction } from "@/actions/feed";
import { CommunitiesOverview } from "@/components/communities/communities-overview";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getCommunitiesPageData } from "@/server/queries";

export default async function CommunitiesPage() {
  const currentUser = await getCurrentUserOrRedirect();
  const data = await getCommunitiesPageData(currentUser.id);

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />
        <div className="py-8">
          <CommunitiesOverview
            discoverCommunities={data.discoverCommunities}
            joinedCommunities={data.joinedCommunities}
            ownedCommunities={data.ownedCommunities}
          />
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
