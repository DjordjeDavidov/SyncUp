"use client";

import { Search, MessageCircle, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { cn, getInitials } from "@/lib/utils";
import { NewChatButton } from "./new-chat-button";

export type ChatItem = {
  id: string;
  type: "dm" | "community";
  title: string;
  avatar: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount?: number;
  metadata?: {
    username?: string;
    memberCount?: number;
  };
};

type Props = {
  chats: ChatItem[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUserId: string;
};

export function ChatSidebar({ chats, selectedChatId, onSelectChat, currentUserId }: Props) {
  const [searchValue, setSearchValue] = useState("");

  const grouped = useMemo(() => {
    const dms = chats.filter((chat) => chat.type === "dm");
    const communities = chats.filter((chat) => chat.type === "community");

    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return { dms, communities };
    }

    return {
      dms: dms.filter((chat) => chat.title.toLowerCase().includes(query) || chat.lastMessage?.toLowerCase().includes(query)),
      communities: communities.filter((chat) => chat.title.toLowerCase().includes(query) || chat.lastMessage?.toLowerCase().includes(query)),
    };
  }, [chats, searchValue]);

  const showDMs = grouped.dms.length > 0;
  const showCommunities = grouped.communities.length > 0;
  const isEmpty = !showDMs && !showCommunities && searchValue !== "";

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-white/8 bg-slate-950/50">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/8 p-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white font-semibold">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Messages</p>
              <p className="text-sm font-semibold text-white">Chats</p>
            </div>
          </div>
          <NewChatButton className="h-10 w-10 rounded-xl px-0 py-0" label="" />
        </div>

        {/* Search */}
        <label className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.04] px-3 py-2 transition-all duration-200 focus-within:border-indigo-300/20 focus-within:bg-white/[0.06]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            className="w-full border-0 bg-transparent p-0 text-sm text-slate-100 outline-none placeholder:text-slate-500"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search chats"
            type="text"
            value={searchValue}
          />
        </label>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto chat-sidebar">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No chats found</p>
            <p className="text-xs text-slate-500">Try a different search</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {/* Direct Messages */}
            {showDMs && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Direct Messages
                </div>
                <div className="space-y-1">
                  {grouped.dms.map((chat) => (
                    <ChatConversationListItem
                      key={chat.id}
                      chat={chat}
                      isSelected={chat.id === selectedChatId}
                      onSelect={() => onSelectChat(chat.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Communities */}
            {showCommunities && (
              <div className={showDMs ? "mt-4" : ""}>
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Communities
                </div>
                <div className="space-y-1">
                  {grouped.communities.map((chat) => (
                    <ChatConversationListItem
                      key={chat.id}
                      chat={chat}
                      isSelected={chat.id === selectedChatId}
                      onSelect={() => onSelectChat(chat.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatConversationListItem({
  chat,
  isSelected,
  onSelect,
}: {
  chat: ChatItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={cn(
        "w-full rounded-lg px-3 py-3 text-left transition-all duration-200 flex items-start gap-3",
        isSelected
          ? "bg-indigo-500/20 border border-indigo-400/30"
          : "border border-transparent hover:bg-white/[0.05]",
      )}
      onClick={onSelect}
      type="button"
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-xs font-semibold text-white flex-shrink-0">
        {chat.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={chat.title} className="h-full w-full object-cover" src={chat.avatar} />
        ) : (
          getInitials(chat.title)
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white">{chat.title}</p>
          {chat.lastMessageAt && (
            <p className="shrink-0 text-xs text-slate-500">{formatChatListTime(chat.lastMessageAt)}</p>
          )}
        </div>
        {chat.lastMessage && (
          <p className="truncate text-xs text-slate-400 mt-1">{chat.lastMessage}</p>
        )}
        {chat.metadata?.memberCount && (
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
            <Users className="h-3 w-3" />
            {chat.metadata.memberCount} members
          </div>
        )}
      </div>

      {/* Unread Indicator */}
      {chat.unreadCount && chat.unreadCount > 0 && (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
        </div>
      )}
    </button>
  );
}

function formatChatListTime(value: Date) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  const hours = `${date.getUTCHours()}`.padStart(2, "0");
  const minutes = `${date.getUTCMinutes()}`.padStart(2, "0");

  return `${month}/${day} ${hours}:${minutes} UTC`;
}
