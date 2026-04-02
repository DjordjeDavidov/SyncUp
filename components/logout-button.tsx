"use client";

import { useFormStatus } from "react-dom";

type LogoutButtonProps = {
  action: () => Promise<void>;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-full border border-white/8 bg-white/4 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Logging out..." : "Log out"}
    </button>
  );
}

export function LogoutButton({ action }: LogoutButtonProps) {
  return (
    <form action={action}>
      <SubmitButton />
    </form>
  );
}
