import { logoutAction } from "@/actions/feed";
import { Navbar } from "@/components/navbar";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getUnifiedChatsData } from "@/server/queries";
import { ChatsPageContent } from "./chats-page-content";

export default async function ChatsPage() {
  const currentUser = await getCurrentUserOrRedirect();
  const chats = await getUnifiedChatsData(currentUser.id);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar user={currentUser} logoutAction={logoutAction} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatsPageContent chats={chats.filter((chat): chat is NonNullable<typeof chat> => chat !== null)} currentUserId={currentUser.id} />
      </div>
    </div>
  );
}
