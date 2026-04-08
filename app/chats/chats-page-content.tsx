"use client";

import { useRouter } from "next/navigation";
import { ChatLayout, type ChatItem } from "@/components/chat";

type UnifiedChat = {
  id: string;
  type: "dm" | "community";
  title: string;
  avatar: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  metadata?: {
    username?: string;
    slug?: string;
    memberCount?: number;
    description?: string | null;
    creator?: string;
    creatorId?: string;
  };
};

type Props = {
  chats: UnifiedChat[];
  currentUserId: string;
};

export function ChatsPageContent({ chats, currentUserId }: Props) {
  const router = useRouter();

  // Map raw chats to ChatItem type
  const chatItems: ChatItem[] = chats.map((chat) => ({
    id: chat.id,
    type: chat.type,
    title: chat.title,
    avatar: chat.avatar,
    lastMessage: chat.lastMessage,
    lastMessageAt: chat.lastMessageAt,
    metadata: chat.metadata,
  }));

  const handleSelectChat = (id: string) => {
    router.push(`/chats/${id}`);
  };

  return (
    <ChatLayout
      chats={chatItems}
      selectedChatId={null}
      onSelectChat={handleSelectChat}
      currentUserId={currentUserId}
      messages={[]}
      onSendMessage={() => {}}
    />
  );
}
