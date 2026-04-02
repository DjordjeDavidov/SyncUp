"use client";

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
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        liked
          ? "bg-rose-500/15 text-rose-200 hover:bg-rose-500/20"
          : "bg-white/6 text-slate-100 hover:bg-white/10"
      }`}
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : liked ? "Liked" : "Like post"}
    </button>
  );
}

export function LikeButton({ postId, liked, action }: Props) {
  return (
    <form action={action}>
      <input name="postId" type="hidden" value={postId} />
      <SubmitButton liked={liked} />
    </form>
  );
}
