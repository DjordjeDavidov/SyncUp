"use client";

import { useRouter } from "next/navigation";
import {
  blockDirectMessageUserAction,
  deleteDirectMessageThreadAction,
  deleteMessageAction,
  sendCommunityChatMessageAction,
  sendDirectMessageAction,
  toggleMessageLikeAction,
} from "@/actions/messages";
import { ChatLayout, type ChatItem, type ChatHeaderData, type ChatDetailsData } from "@/components/chat";
import { useEffect, useState, useTransition } from "react";

type UnifiedChat = {
  id: string;
  type: "dm" | "community";
  title: string;
  avatar: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount?: number;
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
    imageUrl?: string | null;
    isDeleted?: boolean;
    likeCount?: number;
    likedByCurrentUser?: boolean;
    replyTo?: {
      id: string;
      senderId: string;
      senderName: string;
      text: string;
      imageUrl?: string | null;
      isDeleted?: boolean;
    } | null;
    createdAt: Date;
  }>;
  initialScrollTargetMessageId?: string | null;
  seenMessageId?: string | null;
  canChat: boolean;
  accessNotice?: string;
  details: {
    type: "dm" | "community";
    title: string;
    description?: string;
    memberCount?: number;
    creator?: string;
    createdAt?: Date;
    avatar?: string | null;
    currentUserId?: string;
    members?: Array<{
      id: string;
      username: string;
      name: string;
      avatar?: string | null;
      role?: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";
      isCurrentUser?: boolean;
    }>;
    sharedMedia?: Array<{
      id: string;
      type: "image" | "video";
      url: string;
      thumbnailUrl?: string;
      createdAt: Date;
    }>;
    profileUsername?: string;
    profileBio?: string;
    profileLocation?: string;
    isBlocked?: boolean;
    isBlockedByCurrentUser?: boolean;
    communitySlug?: string;
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

function mapChatsToItems(chats: UnifiedChat[], selectedChatId: string) {
  return chats.map((chat) => ({
    id: chat.id,
    type: chat.type,
    title: chat.title,
    avatar: chat.avatar,
    lastMessage: chat.lastMessage,
    lastMessageAt: chat.lastMessageAt,
    unreadCount: chat.id === selectedChatId ? 0 : chat.unreadCount,
    metadata: chat.metadata,
  }));
}

export function ChatPageContent({ chats, chatDetails, chatId, currentUserId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [chatItemsState, setChatItemsState] = useState<ChatItem[]>(() => mapChatsToItems(chats, chatId));
  const [chatDetailsState, setChatDetailsState] = useState(chatDetails);
  const [replyTarget, setReplyTarget] = useState<ChatDetail["messages"][number] | null>(null);

  useEffect(() => {
    setChatItemsState(mapChatsToItems(chats, chatId));
  }, [chatId, chats]);

  useEffect(() => {
    setChatDetailsState(chatDetails);
    setReplyTarget(null);
  }, [chatDetails]);

  // Map raw chats to ChatItem type
  const chatItems: ChatItem[] = chatItemsState;

  // Prepare header data
  const headerData: ChatHeaderData = {
    title: chatDetailsState.title,
    description: chatDetailsState.description,
    avatar: chatDetailsState.avatar ?? undefined,
    type: chatDetailsState.type,
    memberCount: chatDetailsState.type === "community" ? chatDetailsState.details.memberCount : undefined,
  };

  // Prepare details panel data
  const detailsData: ChatDetailsData | undefined = {
    type: chatDetailsState.type,
    title: chatDetailsState.details.title,
    description: chatDetailsState.details.description,
    memberCount: chatDetailsState.details.memberCount,
    creator: chatDetailsState.details.creator,
    createdAt: chatDetailsState.details.createdAt,
    avatar: chatDetailsState.details.avatar,
    members: chatDetailsState.details.members,
    sharedMedia: chatDetailsState.details.sharedMedia,
    profileUsername: chatDetailsState.details.profileUsername,
    profileBio: chatDetailsState.details.profileBio,
    profileLocation: chatDetailsState.details.profileLocation,
    isBlocked: chatDetailsState.details.isBlocked,
    isBlockedByCurrentUser: chatDetailsState.details.isBlockedByCurrentUser,
    chatId,
    canAddMembers: chatDetailsState.details.canAddMembers,
    canLeave: chatDetailsState.details.canLeave,
  };

  useEffect(() => {
    const controller = new AbortController();

    async function markAsRead() {
      setChatItemsState((currentChats) =>
        currentChats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                unreadCount: 0,
              }
            : chat,
        ),
      );

      try {
        await fetch("/api/chats/read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId,
            chatType: chatDetailsState.type,
          }),
          signal: controller.signal,
          keepalive: true,
        });

        setChatItemsState((currentChats) =>
          currentChats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  unreadCount: 0,
                }
              : chat,
          ),
        );
        window.dispatchEvent(new CustomEvent("syncup:counts-refresh"));
      } catch {
        // Quietly ignore read sync failures; the next refresh can retry.
      }
    }

    void markAsRead();

    return () => controller.abort();
  }, [chatDetailsState.type, chatId]);

  async function handleSendMessage(formData: FormData) {
    await new Promise<void>((resolve, reject) => {
      startTransition(() => {
        void (async () => {
          try {
            if (replyTarget) {
              formData.append("replyToMessageId", replyTarget.id);
            }

            if (chatDetailsState.type === "community") {
              formData.append("communityId", chatId);
              await sendCommunityChatMessageAction(formData);
            } else {
              formData.append("threadId", chatId);
              await sendDirectMessageAction(formData);
            }

            setChatItemsState((currentChats) =>
              currentChats.map((chat) =>
                chat.id === chatId
                  ? {
                      ...chat,
                      unreadCount: 0,
                    }
                  : chat,
              ),
            );
            setReplyTarget(null);
            window.dispatchEvent(new CustomEvent("syncup:counts-refresh"));
            router.refresh();
            resolve();
          } catch (error) {
            console.error("Failed to send message:", error);
            reject(error);
          }
        })();
      });
    });
  }

  async function handleToggleLike(messageId: string) {
    startTransition(() => {
      void (async () => {
        try {
          await toggleMessageLikeAction(chatDetailsState.type, chatId, messageId);
          router.refresh();
        } catch (error) {
          console.error("Failed to toggle message like:", error);
        }
      })();
    });
  }

  async function handleDeleteMessage(messageId: string) {
    startTransition(() => {
      void (async () => {
        try {
          await deleteMessageAction(chatDetailsState.type, chatId, messageId);
          if (replyTarget?.id === messageId) {
            setReplyTarget(null);
          }
          router.refresh();
        } catch (error) {
          console.error("Failed to delete message:", error);
        }
      })();
    });
  }

  async function handleBlockChat() {
    startTransition(async () => {
      try {
        await blockDirectMessageUserAction(chatId);
        window.dispatchEvent(new CustomEvent("syncup:counts-refresh"));
        router.refresh();
      } catch (error) {
        console.error("Failed to block user:", error);
      }
    });
  }

  async function handleDeleteChat() {
    startTransition(async () => {
      try {
        await deleteDirectMessageThreadAction(chatId);
        window.dispatchEvent(new CustomEvent("syncup:counts-refresh"));
        router.push("/chats");
        router.refresh();
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    });
  }

  const handleSelectChat = (id: string) => {
    router.push(`/chats/${id}`);
  };

  const handleReplyToMessage = (message: ChatDetail["messages"][number]) => {
    setReplyTarget({
      ...message,
      senderName: message.senderId === currentUserId ? "You" : message.senderName,
    });
  };

  return (
    <ChatLayout
      chats={chatItems}
      selectedChatId={chatId}
      onSelectChat={handleSelectChat}
      currentUserId={currentUserId}
      currentChatHeader={headerData}
      messages={chatDetailsState.messages}
      initialScrollTargetMessageId={chatDetailsState.initialScrollTargetMessageId}
      seenMessageId={chatDetailsState.seenMessageId}
      onSendMessage={handleSendMessage}
      onDeleteMessage={handleDeleteMessage}
      onReplyToMessage={handleReplyToMessage}
      onToggleMessageLike={handleToggleLike}
      replyTarget={replyTarget}
      onCancelReply={() => setReplyTarget(null)}
      canChat={chatDetailsState.canChat}
      composerDisabled={isPending}
      composerPlaceholder={chatDetailsState.accessNotice ?? undefined}
      allowAttachments={chatDetailsState.type === "dm" && chatDetailsState.canChat}
      chatDetailsData={detailsData}
      onBlockChat={chatDetailsState.type === "dm" ? handleBlockChat : undefined}
      onDeleteChat={chatDetailsState.type === "dm" ? handleDeleteChat : undefined}
      detailsActionPending={isPending}
    />
  );
}
