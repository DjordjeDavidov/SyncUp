"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { getOrCreateDirectConversationAction } from "@/actions/messages";

type Props = {
  creatorId: string;
};

export function MessageCreatorButton({ creatorId }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        onClick={() => {
          setError("");
          startTransition(async () => {
            try {
              const result = await getOrCreateDirectConversationAction(creatorId);
              router.push(`/chats/${result.threadId}`);
              router.refresh();
            } catch (caughtError) {
              setError(caughtError instanceof Error ? caughtError.message : "Unable to message this creator right now.");
            }
          });
        }}
        type="button"
      >
        <MessageCircle className="h-4 w-4" />
        {isPending ? "Opening chat..." : "Message creator"}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
