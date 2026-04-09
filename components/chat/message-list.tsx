"use client";

import { Heart, MoreHorizontal, Reply, Trash2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getInitials } from "@/lib/utils";

export type Message = {
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
};

type Props = {
  messages: Message[];
  currentUserId: string;
  initialScrollTargetMessageId?: string | null;
  seenMessageId?: string | null;
  onToggleMessageLike?: (messageId: string) => Promise<void>;
  onReplyToMessage?: (message: Message) => void;
  onDeleteMessage?: (messageId: string) => Promise<void>;
};

export function MessageList({
  messages,
  currentUserId,
  initialScrollTargetMessageId,
  seenMessageId,
  onToggleMessageLike,
  onReplyToMessage,
  onDeleteMessage,
}: Props) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const lastTapRef = useRef<{ id: string; timestamp: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef(new Map<string, HTMLDivElement>());
  const appliedInitialScrollKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-message-menu-root='true']")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openMenuId]);

  useEffect(() => {
    if (!highlightedMessageId) {
      return;
    }

    const timeoutId = window.setTimeout(() => setHighlightedMessageId(null), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [highlightedMessageId]);

  const messagesById = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || messages.length === 0) {
      return;
    }

    const newestMessageId = messages.at(-1)?.id ?? "empty";
    const scrollKey = `${newestMessageId}:${initialScrollTargetMessageId ?? "bottom"}`;

    if (appliedInitialScrollKeyRef.current === scrollKey) {
      return;
    }

    let cancelled = false;
    let timeoutId = 0;
    let rafOne = 0;
    let rafTwo = 0;
    const images = Array.from(container.querySelectorAll("img"));

    const applyInitialScroll = () => {
      if (cancelled) {
        return;
      }

      if (initialScrollTargetMessageId) {
        const target = messageRefs.current.get(initialScrollTargetMessageId);

        if (target) {
          target.scrollIntoView({ block: "center" });
          appliedInitialScrollKeyRef.current = scrollKey;
          return;
        }
      }

      container.scrollTop = container.scrollHeight;
      appliedInitialScrollKeyRef.current = scrollKey;
    };

    const handleImageLoad = () => {
      if (appliedInitialScrollKeyRef.current !== scrollKey) {
        applyInitialScroll();
      }
    };

    rafOne = window.requestAnimationFrame(() => {
      rafTwo = window.requestAnimationFrame(applyInitialScroll);
      timeoutId = window.setTimeout(applyInitialScroll, 120);
    });

    images.forEach((image) => image.addEventListener("load", handleImageLoad, { once: true }));

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafOne);
      window.cancelAnimationFrame(rafTwo);
      window.clearTimeout(timeoutId);
      images.forEach((image) => image.removeEventListener("load", handleImageLoad));
    };
  }, [initialScrollTargetMessageId, messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
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

  function handleLike(messageId: string) {
    setOpenMenuId(null);
    if (onToggleMessageLike) {
      void onToggleMessageLike(messageId);
    }
  }

  function handleReply(message: Message) {
    setOpenMenuId(null);
    onReplyToMessage?.(message);
  }

  function handleDelete(messageId: string) {
    setOpenMenuId(null);
    if (onDeleteMessage) {
      void onDeleteMessage(messageId);
    }
  }

  function handleDoubleInteract(messageId: string) {
    if (onToggleMessageLike) {
      void onToggleMessageLike(messageId);
    }
  }

  function handleTouchLike(messageId: string) {
    const now = Date.now();
    const lastTap = lastTapRef.current;

    if (lastTap && lastTap.id === messageId && now - lastTap.timestamp < 280) {
      handleDoubleInteract(messageId);
      lastTapRef.current = null;
      return;
    }

    lastTapRef.current = { id: messageId, timestamp: now };
  }

  function scrollToMessage(messageId: string) {
    const element = messageRefs.current.get(messageId);
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(messageId);
  }

  return (
    <div className="chat-messages flex h-full flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6" ref={containerRef}>
      {messages.map((message, index) => {
        const isOwnMessage = message.senderId === currentUserId;
        const previousMessage = index > 0 ? messages[index - 1] : null;
        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
        const startsGroup =
          !previousMessage ||
          previousMessage.senderId !== message.senderId ||
          new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() > 5 * 60 * 1000;
        const endsGroup =
          !nextMessage ||
          nextMessage.senderId !== message.senderId ||
          new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() > 5 * 60 * 1000;
        const canDelete = isOwnMessage && !message.isDeleted;
        const showMenu = openMenuId === message.id;
        const replyTarget = message.replyTo ? messagesById.get(message.replyTo.id) ?? message.replyTo : null;

        return (
          <div
            className={`group flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            key={message.id}
            ref={(node) => {
              if (node) {
                messageRefs.current.set(message.id, node);
              } else {
                messageRefs.current.delete(message.id);
              }
            }}
          >
            <div className={`flex max-w-[92%] items-end gap-3 sm:max-w-[74%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`h-9 w-9 shrink-0 ${startsGroup || !isOwnMessage ? "" : "invisible"}`}>
                {!isOwnMessage ? (
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-xs font-semibold text-white">
                    {message.senderAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={message.senderName} className="h-full w-full object-cover" src={message.senderAvatar} />
                    ) : (
                      getInitials(message.senderName)
                    )}
                  </div>
                ) : null}
              </div>

              <div className={`relative min-w-0 ${isOwnMessage ? "items-end" : "items-start"} flex flex-col`}>
                {startsGroup ? (
                  <div className={`mb-1 flex items-center gap-2 px-1 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                    {!isOwnMessage ? <p className="text-xs font-semibold text-slate-200">{message.senderName}</p> : null}
                    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{formatMessageMetaTime(message.createdAt)}</p>
                  </div>
                ) : null}

                {!message.isDeleted ? (
                  <div
                    className={`absolute ${isOwnMessage ? "-left-11" : "-right-11"} top-3 z-10 transition-opacity ${
                      showMenu ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    }`}
                    data-message-menu-root="true"
                  >
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-slate-950/90 text-slate-300 shadow-[0_10px_24px_rgba(2,6,23,0.24)] transition hover:border-white/20 hover:text-white"
                      onClick={() => setOpenMenuId((current) => (current === message.id ? null : message.id))}
                      type="button"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open message actions</span>
                    </button>

                    {showMenu ? (
                      <div
                        className={`absolute top-10 w-40 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-1.5 shadow-[0_18px_40px_rgba(2,6,23,0.42)] ${
                          isOwnMessage ? "left-0" : "right-0"
                        }`}
                        role="menu"
                      >
                        <button
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
                          onClick={() => handleLike(message.id)}
                          type="button"
                        >
                          <Heart className={`h-4 w-4 ${message.likedByCurrentUser ? "fill-rose-400 text-rose-400" : "text-slate-400"}`} />
                          {message.likedByCurrentUser ? "Unlike" : "Like"}
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
                          onClick={() => handleReply(message)}
                          type="button"
                        >
                          <Reply className="h-4 w-4 text-slate-400" />
                          Reply
                        </button>
                        {canDelete ? (
                          <button
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-rose-200 transition hover:bg-rose-500/12 hover:text-rose-100"
                            onClick={() => handleDelete(message.id)}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4 text-rose-300" />
                            Delete
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div
                  className={`rounded-[1.35rem] px-4 py-3 text-sm leading-6 shadow-[0_10px_24px_rgba(2,6,23,0.18)] transition ${
                    highlightedMessageId === message.id ? "ring-2 ring-indigo-300/40" : ""
                  } ${
                    message.isDeleted
                      ? "border border-white/8 bg-white/[0.03] text-slate-400 italic"
                      : isOwnMessage
                        ? "rounded-br-md bg-[linear-gradient(135deg,rgba(99,102,241,0.96),rgba(59,130,246,0.92))] text-white"
                        : "rounded-bl-md border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] text-slate-100"
                  } ${!startsGroup ? "mt-1" : ""}`}
                  onDoubleClick={() => handleDoubleInteract(message.id)}
                  onTouchEnd={() => handleTouchLike(message.id)}
                >
                  {replyTarget ? (
                    <button
                      className={`mb-3 block w-full rounded-2xl border px-3 py-2 text-left text-xs transition ${
                        message.isDeleted
                          ? "border-white/8 bg-white/[0.03] text-slate-400"
                          : isOwnMessage
                            ? "border-white/10 bg-black/15 text-indigo-50/90 hover:bg-black/20"
                            : "border-white/10 bg-black/10 text-slate-200 hover:bg-black/15"
                      }`}
                      onClick={() => scrollToMessage(replyTarget.id)}
                      type="button"
                    >
                      <p className="font-semibold">
                        {replyTarget.senderId === currentUserId ? "You" : replyTarget.senderName}
                      </p>
                      <p className="truncate">
                        {replyTarget.isDeleted ? "Deleted message" : replyTarget.text || (replyTarget.imageUrl ? "Image attachment" : "Message")}
                      </p>
                    </button>
                  ) : null}

                  {message.isDeleted ? (
                    <p>Deleted message</p>
                  ) : (
                    <>
                      {message.imageUrl ? (
                        <button
                          className="mb-3 block overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30"
                          onClick={() => setLightboxUrl(message.imageUrl ?? null)}
                          type="button"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img alt="Shared attachment" className="max-h-80 w-full object-cover" src={message.imageUrl} />
                        </button>
                      ) : null}
                      {message.text ? <p className="whitespace-pre-wrap break-words">{message.text}</p> : null}
                    </>
                  )}

                  {endsGroup ? (
                    <p className={`mt-2 text-[11px] uppercase tracking-[0.12em] ${isOwnMessage ? "text-indigo-100/80" : "text-slate-500"}`}>
                      {formatMessageTime(message.createdAt)}
                    </p>
                  ) : null}
                </div>

                <div className={`mt-2 flex items-center gap-2 px-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  {!message.isDeleted && message.likeCount && message.likeCount > 0 ? (
                    <button
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold transition ${
                        message.likedByCurrentUser
                          ? "border-rose-400/25 bg-rose-500/12 text-rose-200"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:text-white"
                      }`}
                      onClick={() => handleLike(message.id)}
                      type="button"
                    >
                      <Heart className={`h-3.5 w-3.5 ${message.likedByCurrentUser ? "fill-rose-400 text-rose-400" : ""}`} />
                      {message.likeCount}
                    </button>
                  ) : null}
                  {isOwnMessage && seenMessageId === message.id ? (
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Seen</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {lightboxUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-4" onClick={() => setLightboxUrl(null)}>
          <button
            className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
            onClick={() => setLightboxUrl(null)}
            type="button"
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Expanded chat attachment"
            className="max-h-[88vh] max-w-[min(92vw,72rem)] rounded-3xl border border-white/10 object-contain shadow-[0_24px_60px_rgba(2,6,23,0.55)]"
            onClick={(event) => event.stopPropagation()}
            src={lightboxUrl}
          />
        </div>
      ) : null}
    </div>
  );
}

function formatMessageTime(value: Date) {
  const date = new Date(value);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

function formatMessageMetaTime(value: Date) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  const hours = `${date.getUTCHours()}`.padStart(2, "0");
  const minutes = `${date.getUTCMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}
