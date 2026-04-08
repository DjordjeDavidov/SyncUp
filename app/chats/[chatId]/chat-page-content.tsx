"use client";

import { useRouter } from "next/navigation";
import { sendCommunityChatMessageAction } from "@/actions/messages";
import { ChatLayout, type ChatItem, type ChatHeaderData, type ChatDetailsData } from "@/components/chat";
import { useTransition } from "react";

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

type ChatDetail = {
  type: "dm" | "community";
  id: string;
  title: string;
  description?: string;
  avatar: string | null;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string | null;
    text: string;
    createdAt: Date;
  }>;
  canChat: boolean;
  details: {
    type: "dm" | "community";
    title: string;
    description?: string;
    memberCount?: number;
    creator?: string;
    createdAt?: Date;
    avatar?: string | null;
    members?: Array<{
      id: string;
      name: string;
      avatar?: string | null;
      role?: "OWNER" | "MODERATOR" | "MEMBER";
    }>;
    sharedMedia?: Array<{
      id: string;
      type: "image" | "video";
      url: string;
      thumbnailUrl?: string;
      createdAt: Date;
    }>;
    canAddMembers?: boolean;
    canLeave?: boolean;
  };
};

type Props = {
  chats: UnifiedChat[];
  chatDetails: ChatDetail;
  chatId: string;
  currentUserId: string;
};

export function ChatPageContent({ chats, chatDetails, chatId, currentUserId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  // Prepare header data
  const headerData: ChatHeaderData = {
    title: chatDetails.title,
    description: chatDetails.description,
    avatar: chatDetails.avatar ?? undefined,
    type: chatDetails.type,
    memberCount: chatDetails.type === "community" ? chatDetails.details.memberCount : undefined,
  };

  // Prepare details panel data
  const detailsData: ChatDetailsData | undefined = {
    type: chatDetails.type,
    title: chatDetails.details.title,
    description: chatDetails.details.description,
    memberCount: chatDetails.details.memberCount,
    creator: chatDetails.details.creator,
    createdAt: chatDetails.details.createdAt,
    avatar: chatDetails.details.avatar,
    members: chatDetails.details.members,
    sharedMedia: chatDetails.details.sharedMedia,
    canAddMembers: chatDetails.details.canAddMembers,
    canLeave: chatDetails.details.canLeave,
  };

  async function handleSendMessage(message: string) {
    startTransition(async () => {
      try {
        if (chatDetails.type === "community") {
          // Create form data for server action
          const formData = new FormData();
          formData.append("communityId", chatId);
          formData.append("message", message);
          
          await sendCommunityChatMessageAction(formData);
          // Refresh the page to show the new message
          router.refresh();
        }
        // TODO: Handle DM message sending when action is available
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    });
  }

  const handleSelectChat = (id: string) => {
    router.push(`/chats/${id}`);
  };

  return (
    <ChatLayout
      chats={chatItems}
      selectedChatId={chatId}
      onSelectChat={handleSelectChat}
      currentUserId={currentUserId}
      currentChatHeader={headerData}
      messages={chatDetails.messages}
      onSendMessage={handleSendMessage}
      canChat={chatDetails.canChat && !isPending}
      chatDetailsData={detailsData}
    />
  );
}
