"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  action: () => Promise<void>;
  className?: string;
  label?: string;
};

function SubmitButton({ className, label }: { className?: string; label?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-white/8 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-100 outline-none transition-all duration-200 hover:bg-white/8 focus:bg-white/8 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      disabled={pending}
      type="submit"
    >
      {pending ? "Logging out..." : label ?? "Log out"}
    </button>
  );
}

export function LogoutButton({ action, className, label }: LogoutButtonProps) {
  return (
    <form action={action}>
      <SubmitButton className={className} label={label} />
    </form>
  );
}
