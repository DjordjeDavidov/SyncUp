import { logoutAction } from "@/actions/feed";
import { Navbar } from "@/components/navbar";
import { notFound } from "next/navigation";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getUnifiedChatsData, getUnifiedChatDetails } from "@/server/queries";
import { ChatPageContent } from "./chat-page-content";

type PageProps = {
  params: Promise<{ chatId: string }>;
};

export default async function ChatPage({ params }: PageProps) {
  const { chatId } = await params;

  if (!chatId) {
    notFound();
  }

  const currentUser = await getCurrentUserOrRedirect();
  const [allChats, chatDetails] = await Promise.all([
    getUnifiedChatsData(currentUser.id),
    getUnifiedChatDetails(currentUser.id, chatId),
  ]);

  if (!chatDetails) {
    notFound();
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar user={currentUser} logoutAction={logoutAction} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatPageContent 
          chats={allChats.filter((chat): chat is NonNullable<typeof chat> => chat !== null)}
          chatDetails={chatDetails as any}
          chatId={chatId}
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  );
}
