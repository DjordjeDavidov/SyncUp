"use client";

import Link from "next/link";
import { MessageCircleMore, Search, SendHorizonal, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { cn, formatDistanceToNow, getInitials } from "@/lib/utils";

type MessageContact = {
  id: string;
  username: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
    bio?: string | null;
  } | null;
};

type MessageUser = {
  id: string;
  username: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
};

type CommunityChat = {
  id: string;
  slug: string;
  name: string;
  iconUrl?: string | null;
  coverUrl: string | null;
  memberCount: number;
};

type Props = {
  conversations: Conversation[];
  communityChats: CommunityChat[];
  currentUser: MessageUser;
};

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
};

type Conversation = {
  id: string;
  participant: MessageContact;
  messages: ChatMessage[];
};

function getParticipantName(contact: MessageContact) {
  return contact.profile?.full_name ?? contact.username;
}

function getParticipantStatus(index: number) {
  const statuses = [
    "Usually replies fast",
    "Planning something this weekend",
    "Looking for new people nearby",
    "Active in communities",
    "Open to casual chats",
  ];

  return statuses[index % statuses.length];
}

export function MessagesShell({ conversations: initialConversations, communityChats, currentUser }: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const [draft, setDraft] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const filteredConversations = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const name = getParticipantName(conversation.participant).toLowerCase();
      const username = conversation.participant.username.toLowerCase();
      const lastMessage = conversation.messages.at(-1)?.text.toLowerCase() ?? "";

      return name.includes(query) || username.includes(query) || lastMessage.includes(query);
    });
  }, [conversations, searchValue]);

  const selectedConversation =
    filteredConversations.find((conversation) => conversation.id === selectedConversationId) ??
    conversations.find((conversation) => conversation.id === selectedConversationId) ??
    filteredConversations[0] ??
    null;

  function handleSendMessage() {
    const value = draft.trim();

    if (!value || !selectedConversation) {
      return;
    }

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                {
                  id: `${selectedConversation.id}-${Date.now()}`,
                  senderId: currentUser.id,
                  text: value,
                  createdAt: new Date(),
                },
              ],
            }
          : conversation,
      ),
    );
    setDraft("");
  }

  return (
    <section className="grid min-h-[calc(100vh-11rem)] gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="surface-card overflow-hidden rounded-2xl border border-white/8">
        <div className="border-b border-white/8 px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Messages</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Conversations</h1>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-300/18 bg-indigo-400/10 text-indigo-100">
              <MessageCircleMore className="h-5 w-5" />
            </div>
          </div>
          <label className="mt-5 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 transition-all duration-200 focus-within:border-indigo-300/20 focus-within:bg-white/[0.06]">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full border-0 bg-transparent p-0 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search conversations"
              type="text"
              value={searchValue}
            />
          </label>
          <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Community chats</p>
                <p className="text-sm text-slate-400">Group chats for your joined communities.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {communityChats.length > 0 ? (
                communityChats.map((community) => (
                  <Link
                    key={community.id}
                    href={`/chats/${community.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-900 text-sm font-semibold text-white">
                      {community.iconUrl || community.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt={community.name} className="h-full w-full object-cover" src={community.iconUrl || community.coverUrl || ""} />
                      ) : (
                        community.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{community.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{community.memberCount} members</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400">No community chats yet. Join a community to start group conversations.</p>
              )}
            </div>
          </div>
        </div>

        <div className="max-h-[calc(100vh-18rem)] space-y-2 overflow-y-auto p-3">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation, index) => {
              const participantName = getParticipantName(conversation.participant);
              const lastMessage = conversation.messages.at(-1);
              const active = conversation.id === selectedConversation?.id;

              return (
                <button
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition-all duration-200",
                    active
                      ? "border-indigo-300/20 bg-[linear-gradient(135deg,rgba(99,102,241,0.16),rgba(59,130,246,0.08))] shadow-[0_12px_28px_rgba(30,41,59,0.22),0_0_20px_rgba(99,102,241,0.08)]"
                      : "border-white/6 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.06]",
                  )}
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  type="button"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.32),rgba(59,130,246,0.16))] text-sm font-semibold text-white">
                      {conversation.participant.profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={participantName}
                          className="h-full w-full object-cover"
                          src={conversation.participant.profile.avatar_url}
                        />
                      ) : (
                        getInitials(participantName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-100">{participantName}</p>
                          <p className="truncate text-xs text-muted-foreground">@{conversation.participant.username}</p>
                        </div>
                        <p className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                          {lastMessage ? formatDistanceToNow(lastMessage.createdAt) : "Now"}
                        </p>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">
                        {lastMessage?.text ?? "No messages yet"}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                        {getParticipantStatus(index)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-300/18 bg-indigo-400/10 text-indigo-100">
                <Search className="h-5 w-5" />
              </div>
              <p className="mt-4 text-base font-semibold text-white">No matching chats</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Try a different name or username to find the conversation you want.
              </p>
            </div>
          )}
        </div>
      </aside>

      <div className="surface-card flex min-h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-2xl border border-white/8">
        {selectedConversation ? (
          <>
            <div className="border-b border-white/8 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.32),rgba(59,130,246,0.16))] text-sm font-semibold text-white">
                  {selectedConversation.participant.profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={getParticipantName(selectedConversation.participant)}
                      className="h-full w-full object-cover"
                      src={selectedConversation.participant.profile.avatar_url}
                    />
                  ) : (
                    getInitials(getParticipantName(selectedConversation.participant))
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold tracking-tight text-white">
                    {getParticipantName(selectedConversation.participant)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{selectedConversation.participant.username} • {selectedConversation.messages.length} messages
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.08),transparent_24%),linear-gradient(180deg,rgba(7,11,24,0.28),rgba(7,11,24,0.16))] px-4 py-5 sm:px-6">
              {selectedConversation.messages.map((message, index) => {
                const isOwn = message.senderId === currentUser.id;
                const showTimestamp =
                  index === 0 ||
                  selectedConversation.messages[index - 1].createdAt.toDateString() !== message.createdAt.toDateString();

                return (
                  <div key={message.id}>
                    {showTimestamp ? (
                      <div className="mb-4 flex justify-center">
                        <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          {message.createdAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    ) : null}
                    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-[1.4rem] px-4 py-3 text-sm leading-6 shadow-[0_10px_24px_rgba(2,6,23,0.22)] transition-all duration-200 sm:max-w-[72%]",
                          isOwn
                            ? "rounded-br-md bg-[linear-gradient(135deg,rgba(99,102,241,0.96),rgba(59,130,246,0.9))] text-white"
                            : "rounded-bl-md border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] text-slate-100",
                        )}
                      >
                        <p>{message.text}</p>
                        <p className={cn("mt-2 text-[11px] uppercase tracking-[0.14em]", isOwn ? "text-indigo-100/75" : "text-slate-500")}>
                          {message.createdAt.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/8 px-4 py-4 sm:px-6">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-2 transition-all duration-200 focus-within:border-indigo-300/20 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_1px_rgba(129,140,248,0.08),0_0_24px_rgba(99,102,241,0.08)]">
                <div className="flex items-end gap-3">
                  <textarea
                    className="min-h-[56px] flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500"
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Message ${getParticipantName(selectedConversation.participant)}...`}
                    value={draft}
                  />
                  <button
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(99,102,241,1),rgba(59,130,246,0.92))] text-white shadow-[0_16px_36px_rgba(99,102,241,0.28),0_0_18px_rgba(99,102,241,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(99,102,241,0.34),0_0_24px_rgba(99,102,241,0.18)] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!draft.trim()}
                    onClick={handleSendMessage}
                    type="button"
                  >
                    <SendHorizonal className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 py-16">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-300/18 bg-indigo-400/10 text-indigo-100">
                <MessageCircleMore className="h-6 w-6" />
              </div>
              <p className="mt-5 text-xl font-semibold text-white">No conversations yet</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Once people start showing up here, you'll be able to open a one-on-one thread and keep the conversation going.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
