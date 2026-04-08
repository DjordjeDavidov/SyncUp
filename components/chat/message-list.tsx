"use client";

import { formatDistanceToNow } from "@/lib/utils";

export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  text: string;
  createdAt: Date;
};

type Props = {
  messages: Message[];
  currentUserId: string;
};

export function MessageList({ messages, currentUserId }: Props) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-300">No messages yet</p>
        <p className="text-xs text-slate-500">Start the conversation by sending a message</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 chat-messages">
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const isSameUser = prevMessage?.senderId === message.senderId;
        const showTimestamp = index === 0 || !isSameUser || new Date(message.createdAt).getTime() - new Date(prevMessage!.createdAt).getTime() > 5 * 60 * 1000;

        return (
          <div key={message.id}>
            {showTimestamp && !isSameUser && index > 0 && (
              <div className="h-px bg-white/5 my-2" />
            )}
            <div className="group px-6 py-3 hover:bg-white/[0.02] transition-colors duration-150">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-xs font-semibold text-white">
                  {message.senderAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={message.senderName} className="h-full w-full object-cover" src={message.senderAvatar} />
                  ) : (
                    message.senderName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-semibold text-white">{message.senderName}</p>
                    <p className="text-xs text-slate-500">{formatDistanceToNow(message.createdAt)}</p>
                  </div>
                  <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap break-words leading-relaxed">
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
