"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormState } from "@/lib/validation";
import { getInitials } from "@/lib/utils";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  currentUser: {
    id: string;
    username: string;
    profile: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  };
};

const initialState: FormState = {
  message: "",
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-70" disabled={pending} type="submit">
      {pending ? "Posting..." : "Post"}
    </button>
  );
}

export function CreatePostCard({ action, currentUser }: Props) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="surface-card rounded-[28px] p-5 sm:p-6">
      <div className="flex gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-500/30 text-sm font-semibold text-white">
          {currentUser.profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={currentUser.profile.full_name ?? currentUser.username} className="h-full w-full object-cover" src={currentUser.profile.avatar_url} />
          ) : (
            getInitials(currentUser.profile?.full_name ?? currentUser.username)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <textarea className="min-h-[120px] w-full rounded-3xl border border-[var(--border)] bg-[#0d1528] px-4 py-4 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400" name="content" placeholder="What’s on your mind?" />
          {state.errors?.content ? <p className="mt-2 text-sm text-rose-400">{state.errors.content[0]}</p> : null}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input accept="image/*" className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-100 sm:max-w-sm" name="image" type="file" />
        <SubmitButton />
      </div>
      {state.message ? (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
