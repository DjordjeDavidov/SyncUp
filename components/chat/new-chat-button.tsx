"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NewChatModal } from "./new-chat-modal";

type Props = {
  className?: string;
  iconClassName?: string;
  label?: string;
};

export function NewChatButton({ className, iconClassName, label = "New chat" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-2xl border border-indigo-300/18 bg-indigo-400/10 text-indigo-100 transition hover:-translate-y-0.5 hover:border-indigo-200/28 hover:bg-indigo-400/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/40",
          label ? "gap-2 px-4 py-2.5 text-sm font-semibold" : "h-10 w-10",
          className,
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Plus className={cn("h-4.5 w-4.5", iconClassName)} />
        {label ? <span>{label}</span> : <span className="sr-only">Start a new chat</span>}
      </button>
      <NewChatModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
