"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormState } from "@/lib/validation";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

const initialState: FormState = {
  message: "",
  errors: {},
};

export function PasswordChangeForm({ action }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsMatch = newPassword === confirmPassword;

  const confirmMessage = useMemo(() => {
    if (!confirmPassword) {
      return "Re-enter your new password to confirm.";
    }
    return passwordsMatch ? "Passwords match." : "Passwords do not match.";
  }, [confirmPassword, passwordsMatch]);

  useEffect(() => {
    if (state.success) {
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_20px_48px_rgba(0,0,0,0.2)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Security</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Change password</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Keep your account secure with a strong password. We will verify your current password before applying the update.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="current_password">
            Current password
          </label>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
            id="current_password"
            name="current_password"
            placeholder="Enter your current password"
            type="password"
          />
          {state.errors?.current_password ? <p className="mt-2 text-sm text-rose-400">{state.errors.current_password[0]}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="new_password">
            New password
          </label>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
            id="new_password"
            name="new_password"
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Choose a strong password"
            type="password"
            value={newPassword}
          />
          {state.errors?.new_password ? <p className="mt-2 text-sm text-rose-400">{state.errors.new_password[0]}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="confirm_password">
            Confirm password
          </label>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
            id="confirm_password"
            name="confirm_password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat new password"
            type="password"
            value={confirmPassword}
          />
          <p className={`mt-2 text-sm ${passwordsMatch ? "text-emerald-300" : "text-rose-400"}`}>{confirmMessage}</p>
        </div>
      </div>

      {state.message ? (
        <div className={`rounded-xl px-4 py-3 text-sm ${state.success ? "border border-emerald-300/20 bg-emerald-500/10 text-emerald-200" : "border border-rose-300/20 bg-rose-500/10 text-rose-200"}`}>
          {state.message}
        </div>
      ) : null}

      <PasswordSubmitButton disabled={!passwordsMatch || !newPassword || !confirmPassword} />
    </form>
  );
}

function PasswordSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(99,102,241,0.34)] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? "Updating password..." : "Update password"}
    </button>
  );
}
