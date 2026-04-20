"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Ban, ExternalLink, ImageIcon, Info, Settings2, Users, X } from "lucide-react";
import { ChatMemberActionMenu } from "./chat-member-action-menu";

export type SharedMediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  createdAt: Date;
};

export type ChatDetailsData = {
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
  sharedMedia?: SharedMediaItem[];
  profileUsername?: string;
  profileBio?: string;
  profileLocation?: string;
  isBlocked?: boolean;
  isBlockedByCurrentUser?: boolean;
  chatId?: string;
  communitySlug?: string;
  canAddMembers?: boolean;
  canLeave?: boolean;
};

type Props = {
  data: ChatDetailsData;
  detailsActionPending?: boolean;
  onClose: () => void;
  onBlockChat?: () => void;
  onDeleteChat?: () => void;
  isOpen: boolean;
};

export function ChatDetailsPanel({
  data,
  detailsActionPending = false,
  onClose,
  onBlockChat,
  onDeleteChat,
  isOpen,
}: Props) {
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-slate-950/50">
      <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-5">
        <h2 className="text-lg font-semibold text-white">Details</h2>
        <button
          className="rounded-lg p-1 transition-colors hover:bg-white/[0.04]"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      <div className="chat-details flex-1 min-h-0 overflow-y-auto">
        {data.sharedMedia && data.sharedMedia.length > 0 ? (
          <div className="border-b border-white/8 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-indigo-500/20">
                <ImageIcon className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Media</h3>
                <p className="text-xs text-slate-500">{data.sharedMedia.length} shared items</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {data.sharedMedia.slice(0, 6).map((media) => (
                <button
                  className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition hover:border-white/20"
                  key={media.id}
                  onClick={() => setLightboxUrl(media.url)}
                  type="button"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Shared media" className="h-full w-full object-cover" src={media.thumbnailUrl || media.url} />
                </button>
              ))}
            </div>

            {data.sharedMedia.length > 6 ? (
              <button
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-300 transition hover:text-indigo-200"
                onClick={() => setShowAllMedia(true)}
                type="button"
              >
                View all media
                <ExternalLink className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="border-b border-white/8 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-500/20">
              <Info className="h-4 w-4 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">About</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-100">{data.title}</p>
              {data.profileUsername ? <p className="mt-1 text-sm text-slate-400">@{data.profileUsername}</p> : null}
              {data.description ? <p className="mt-3 text-sm leading-6 text-slate-400">{data.description}</p> : null}
            </div>

            {data.profileLocation ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-slate-300">
                {data.profileLocation}
              </div>
            ) : null}

            {data.creator ? (
              <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-indigo-500/20 text-xs font-semibold text-white">
                  {data.creator.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Created by</p>
                  <p className="text-sm font-semibold text-white">{data.creator}</p>
                </div>
              </div>
            ) : null}

            {data.createdAt ? <div className="text-xs text-slate-500">Created {formatPanelDate(data.createdAt)}</div> : null}

            {data.type === "dm" && data.profileUsername ? (
              <Link
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-300 transition hover:text-indigo-200"
                href={`/profile/${data.profileUsername}`}
              >
                View full profile
                <ExternalLink className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>

        {data.members && data.members.length > 0 ? (
          <div className="border-b border-white/8 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-emerald-500/20">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Members</h3>
                <p className="text-xs text-slate-500">{data.members.length} members</p>
              </div>
            </div>

            <div className="space-y-2">
              {data.members.slice(0, 10).map((member) => (
                <ChatMemberActionMenu key={member.id} member={member} />
              ))}
              {data.members.length > 10 ? (
                <p className="py-2 text-center text-xs text-slate-500">+{data.members.length - 10} more members</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-3 p-6">
          {data.type === "community" && data.communitySlug ? (
            <Link className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.06]" href={`/communities/${data.communitySlug}`}>
              <Users className="h-5 w-5 text-slate-300" />
              <span className="text-sm text-white">Open community page</span>
            </Link>
          ) : null}

          {data.canAddMembers && data.communitySlug ? (
            <Link className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.06]" href={`/communities/${data.communitySlug}#members-management`}>
              <Settings2 className="h-5 w-5 text-slate-300" />
              <span className="text-sm text-white">Manage members</span>
            </Link>
          ) : null}

          {data.type === "dm" && onBlockChat ? (
            <button
              className="flex w-full items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-left transition hover:bg-amber-500/16 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={detailsActionPending || data.isBlockedByCurrentUser}
              onClick={onBlockChat}
              type="button"
            >
              <Ban className="h-5 w-5 text-amber-300" />
              <div>
                <p className="text-sm font-semibold text-amber-100">
                  {data.isBlockedByCurrentUser ? "Person blocked" : "Block person"}
                </p>
                <p className="mt-1 text-xs text-amber-200/70">
                  {data.isBlockedByCurrentUser ? "This conversation is now read-only for you." : "They will no longer be able to message you."}
                </p>
              </div>
            </button>
          ) : null}

          {data.type === "dm" && onDeleteChat ? (
            <button
              className="flex w-full items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-left transition hover:bg-rose-500/16 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={detailsActionPending}
              onClick={onDeleteChat}
              type="button"
            >
              <AlertTriangle className="h-5 w-5 text-rose-300" />
              <div>
                <p className="text-sm font-semibold text-rose-100">Delete chat</p>
                <p className="mt-1 text-xs text-rose-200/70">This hides the conversation for you without removing the other person’s history.</p>
              </div>
            </button>
          ) : null}

        </div>
      </div>

      {showAllMedia && data.sharedMedia ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 p-4" onClick={() => setShowAllMedia(false)}>
          <div
            className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Media</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Shared images</h3>
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08]"
                onClick={() => setShowAllMedia(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.sharedMedia.map((media) => (
                <button
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                  key={media.id}
                  onClick={() => setLightboxUrl(media.url)}
                  type="button"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Direct message media" className="aspect-square w-full object-cover" src={media.thumbnailUrl || media.url} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {lightboxUrl ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/92 p-4" onClick={() => setLightboxUrl(null)}>
          <button
            className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
            onClick={() => setLightboxUrl(null)}
            type="button"
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Expanded direct message media"
            className="max-h-[88vh] max-w-[min(92vw,72rem)] rounded-3xl border border-white/10 object-contain shadow-[0_24px_60px_rgba(2,6,23,0.55)]"
            onClick={(event) => event.stopPropagation()}
            src={lightboxUrl}
          />
        </div>
      ) : null}
    </div>
  );
}

function formatPanelDate(value: Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}
