import { cn } from "@/lib/utils";
import { getMatchScoreTone } from "@/lib/user-match";

type MatchBadgeProps = {
  score: number;
  compact?: boolean;
  className?: string;
};

export function MatchBadge({ score, compact = false, className }: MatchBadgeProps) {
  const tone = getMatchScoreTone(score);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold uppercase tracking-[0.18em]",
        compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]",
        tone.badgeClassName,
        className,
      )}
    >
      {score}% match
    </span>
  );
}
