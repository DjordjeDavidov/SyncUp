"use client";

import { X, Users, Info, UserPlus, LogOut, ImageIcon } from "lucide-react";

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
  members?: Array<{
    id: string;
    name: string;
    avatar?: string | null;
    role?: "OWNER" | "MODERATOR" | "MEMBER";
  }>;
  sharedMedia?: SharedMediaItem[];
  canAddMembers?: boolean;
  canLeave?: boolean;
};

type Props = {
  data: ChatDetailsData;
  onClose: () => void;
  isOpen: boolean;
};

export function ChatDetailsPanel({ data, onClose, isOpen }: Props) {
  if (!isOpen) return null;

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-slate-950/50">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex items-center justify-between border-b border-white/8 px-6 py-5">
        <h2 className="text-lg font-semibold text-white">Details</h2>
        <button
          className="p-1 rounded-lg hover:bg-white/[0.04] transition-colors"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto chat-details">
        {/* Shared Media Section - FIRST */}
        {data.sharedMedia && data.sharedMedia.length > 0 && (
          <div className="border-b border-white/8 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-indigo-500/20">
                <ImageIcon className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Shared Media</h3>
                <p className="text-xs text-slate-500">{data.sharedMedia.length} items</p>
              </div>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-3 gap-2">
              {data.sharedMedia.slice(0, 9).map((media) => (
                <div
                  key={media.id}
                  className="aspect-square rounded-lg border border-white/10 bg-white/[0.04] overflow-hidden cursor-pointer hover:border-white/20 transition-colors"
                >
                  {media.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="Shared media"
                      className="h-full w-full object-cover"
                      src={media.thumbnailUrl || media.url}
                    />
                  ) : (
                    <div className="h-full w-full bg-slate-800 flex items-center justify-center">
                      <div className="text-slate-400">
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {data.sharedMedia.length > 9 && (
              <button className="w-full mt-3 px-3 py-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                View all media
              </button>
            )}
          </div>
        )}

        {/* Members Section */}
        {data.members && data.members.length > 0 && (
          <div className="border-b border-white/8 p-6">
            <div className="flex items-center gap-3 mb-4">
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
                <div key={member.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-xs font-semibold text-white">
                    {member.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={member.name} className="h-full w-full object-cover" src={member.avatar} />
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{member.name}</p>
                    {member.role && member.role !== "MEMBER" && (
                      <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                    )}
                  </div>
                </div>
              ))}
              {data.members.length > 10 && (
                <p className="text-xs text-slate-500 text-center py-2">
                  +{data.members.length - 10} more members
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions Section */}
        <div className="p-6 space-y-3">
          {data.canAddMembers && (
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] transition-colors">
              <UserPlus className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-white">Add members</span>
            </button>
          )}

          {data.canLeave && (
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-colors">
              <LogOut className="h-5 w-5 text-red-400" />
              <span className="text-sm text-red-300">
                {data.type === "community" ? "Leave community" : "Leave chat"}
              </span>
            </button>
          )}
        </div>

        {/* About Section - LAST */}
        <div className="border-t border-white/8 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-500/20">
              <Info className="h-4 w-4 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">About</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400">{data.title}</p>
              {data.description && (
                <p className="text-sm text-slate-400 mt-2">{data.description}</p>
              )}
            </div>

            {data.creator && (
              <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-indigo-500/20 text-xs font-semibold text-white">
                  {data.creator.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Created by</p>
                  <p className="text-sm font-semibold text-white">{data.creator}</p>
                </div>
              </div>
            )}

            {data.createdAt && (
              <div className="text-xs text-slate-500">
                Created {data.createdAt.toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
