"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

type Props = {
  liked: boolean;
  onLike: () => void;
};

export function LikeButton({ liked, onLike }: Props) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    onLike();
    setTimeout(() => setAnimating(false), 250);
  };

  return (
    <button
      className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
        liked
          ? "border-rose-400/20 bg-rose-500/12 text-rose-200 hover:border-rose-300/30 hover:bg-rose-500/18"
          : "border-white/6 bg-white/[0.03] text-slate-400 hover:border-indigo-400/20 hover:bg-indigo-400/8 hover:text-indigo-200"
      }`}
      onClick={handleClick}
      type="button"
    >
      <Heart
        className={`h-4 w-4 transition-all duration-200 ${
          liked ? "fill-current text-rose-400" : ""
        } ${animating ? "scale-110" : ""}`}
      />
      <span>Like</span>
    </button>
  );
}
