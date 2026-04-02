import { createCommunityAction } from "@/actions/communities";
import { logoutAction } from "@/actions/feed";
import { CreateCommunityForm } from "@/components/communities/create-community-form";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { getCurrentUserOrRedirect } from "@/server/auth";

export default async function CreateCommunityPage() {
  const currentUser = await getCurrentUserOrRedirect();

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />
        <div className="py-8">
          <CreateCommunityForm action={createCommunityAction} />
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
