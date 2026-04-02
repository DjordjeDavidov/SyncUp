"use client";

import { Heart } from "lucide-react";
import { useFormStatus } from "react-dom";

type Props = {
  postId: string;
  liked: boolean;
  action: (formData: FormData) => Promise<void>;
};

function SubmitButton({ liked }: { liked: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
        liked
          ? "border-rose-400/20 bg-rose-500/12 text-rose-200 hover:border-rose-300/30 hover:bg-rose-500/18"
          : "border-white/6 bg-white/[0.03] text-slate-400 hover:border-indigo-400/20 hover:bg-indigo-400/8 hover:text-indigo-200"
      }`}
      disabled={pending}
      type="submit"
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      <span>{pending ? "Saving..." : "Like"}</span>
    </button>
  );
}

export function LikeButton({ postId, liked, action }: Props) {
  return (
    <form action={action} className="w-full">
      <input name="postId" type="hidden" value={postId} />
      <SubmitButton liked={liked} />
    </form>
  );
}
