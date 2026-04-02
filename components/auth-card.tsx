"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormState } from "@/lib/validation";

type AuthField = "email" | "username" | "password";

type AuthCardProps = {
  title: string;
  description: string;
  submitLabel: string;
  fields: AuthField[];
  footerText: string;
  footerLinkLabel: string;
  footerHref: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  showConfirmPassword?: boolean;
};

const initialState: FormState = {
  message: "",
  errors: {},
};

function SubmitButton({ label, disabled }: { label: string; disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? "Working..." : label}
    </button>
  );
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthCard({
  title,
  description,
  submitLabel,
  fields,
  footerText,
  footerHref,
  footerLinkLabel,
  action,
  showConfirmPassword = false,
}: AuthCardProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const emailValid = useMemo(() => emailRegex.test(email), [email]);
  const hasUppercase = useMemo(() => /[A-Z]/.test(password), [password]);
  const hasNumber = useMemo(() => /[0-9]/.test(password), [password]);
  const hasSpecial = useMemo(() => /[^A-Za-z0-9]/.test(password), [password]);
  const hasLength = useMemo(() => password.length >= 8, [password]);
  const passwordMatch = useMemo(() => !showConfirmPassword || password === confirmPassword, [confirmPassword, password, showConfirmPassword]);
  const passwordValid = useMemo(
    () => hasUppercase && hasNumber && hasSpecial && hasLength,
    [hasUppercase, hasNumber, hasSpecial, hasLength],
  );
  const isSubmitDisabled = showConfirmPassword && (!emailValid || !passwordValid || !passwordMatch);

  return (
    <div className="frosted-card rounded-[32px] p-6 sm:p-8">
      <h1 className="section-title text-3xl text-slate-50">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
      <form action={formAction} className="mt-7 space-y-4">
        {fields.includes("email") ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
              id="email"
              name="email"
              placeholder="you@example.com"
              type="email"
              onChange={(event) => setEmail(event.target.value)}
            />
            {showConfirmPassword ? (
              <p className={`mt-2 text-sm ${emailValid ? "text-emerald-300" : "text-slate-400"}`}>
                {email ? (emailValid ? "Email looks good." : "Enter a valid email address.") : "We will send confirmation to this email."}
              </p>
            ) : null}
            {state.errors?.email ? <p className="mt-2 text-sm text-rose-400">{state.errors.email[0]}</p> : null}
          </div>
        ) : null}
        {fields.includes("username") ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="username">
              Username
            </label>
            <input
              className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
              id="username"
              name="username"
              placeholder="findyourvibe"
              type="text"
            />
            {state.errors?.username ? <p className="mt-2 text-sm text-rose-400">{state.errors.username[0]}</p> : null}
          </div>
        ) : null}
        {fields.includes("password") ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
              Password
            </label>
            <input
              className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
              id="password"
              name="password"
              placeholder="At least 8 characters"
              type="password"
              onChange={(event) => setPassword(event.target.value)}
            />
            {showConfirmPassword ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300">
                <p className="text-slate-200">Your password should include:</p>
                <ul className="mt-2 space-y-2">
                  <li className={hasLength ? "text-emerald-300" : "text-slate-500"}>8+ characters</li>
                  <li className={hasUppercase ? "text-emerald-300" : "text-slate-500"}>At least one uppercase letter</li>
                  <li className={hasNumber ? "text-emerald-300" : "text-slate-500"}>At least one number</li>
                  <li className={hasSpecial ? "text-emerald-300" : "text-slate-500"}>At least one special symbol</li>
                </ul>
              </div>
            ) : null}
            {state.errors?.password ? <p className="mt-2 text-sm text-rose-400">{state.errors.password[0]}</p> : null}
          </div>
        ) : null}
        {showConfirmPassword ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="confirm_password">
              Confirm password
            </label>
            <input
              className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
              id="confirm_password"
              name="confirm_password"
              placeholder="Repeat your password"
              type="password"
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <p className={`mt-2 text-sm ${passwordMatch ? "text-emerald-300" : "text-rose-400"}`}>
              {confirmPassword
                ? passwordMatch
                  ? "Passwords match."
                  : "Passwords do not match."
                : "Re-enter your password to confirm."}
            </p>
          </div>
        ) : null}
        {state.message ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {state.message}
          </div>
        ) : null}
        <SubmitButton label={submitLabel} disabled={isSubmitDisabled} />
      </form>
      <p className="mt-6 text-sm text-slate-400">
        {footerText}{" "}
        <Link className="font-semibold text-indigo-300 hover:text-indigo-200" href={footerHref}>
          {footerLinkLabel}
        </Link>
      </p>
    </div>
  );
}
