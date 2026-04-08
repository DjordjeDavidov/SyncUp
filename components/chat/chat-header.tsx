"use client";

import { ChevronRight, Info, Users } from "lucide-react";

export type ChatHeaderData = {
  title: string;
  description?: string;
  avatar?: string | null;
  memberCount?: number;
  type: "dm" | "community";
};

type Props = {
  data: ChatHeaderData;
  onToggleDetails: () => void;
  detailsOpen: boolean;
};

export function ChatHeader({ data, onToggleDetails, detailsOpen }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
      <div className="flex items-center gap-4">
        {data.avatar && (
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={data.title} className="h-full w-full object-cover" src={data.avatar} />
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-white">{data.title}</h1>
          {data.description && (
            <p className="text-sm text-slate-400">{data.description}</p>
          )}
          {data.type === "community" && data.memberCount && (
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
              <Users className="h-3 w-3" />
              {data.memberCount} members
            </div>
          )}
        </div>
      </div>

      {/* Toggle Details Button */}
      <button
        className={`p-2 rounded-lg border transition-all duration-200 ${
          detailsOpen
            ? "bg-indigo-500/20 border-indigo-400/30"
            : "border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
        }`}
        onClick={onToggleDetails}
        type="button"
        title={detailsOpen ? "Hide details" : "Show details"}
      >
        <Info className="h-5 w-5 text-slate-300" />
      </button>
    </div>
  );
}
