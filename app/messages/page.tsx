import { logoutAction } from "@/actions/feed";
import { MessagesShell } from "@/components/messages/messages-shell";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getMessagesPageData } from "@/server/queries";

export default async function MessagesPage() {
  const currentUser = await getCurrentUserOrRedirect();
  const data = await getMessagesPageData(currentUser.id);

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />
        <div className="py-8">
          <MessagesShell contacts={data.contacts} communityChats={data.communityChats} currentUser={currentUser} />
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
