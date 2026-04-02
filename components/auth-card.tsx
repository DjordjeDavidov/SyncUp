"use client";

import Link from "next/link";
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
};

const initialState: FormState = {
  message: "",
  errors: {},
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Working..." : label}
    </button>
  );
}

export function AuthCard({
  title,
  description,
  submitLabel,
  fields,
  footerText,
  footerHref,
  footerLinkLabel,
  action,
}: AuthCardProps) {
  const [state, formAction] = useActionState(action, initialState);

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
            <input className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400" id="email" name="email" placeholder="you@example.com" type="email" />
            {state.errors?.email ? <p className="mt-2 text-sm text-rose-400">{state.errors.email[0]}</p> : null}
          </div>
        ) : null}
        {fields.includes("username") ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="username">
              Username
            </label>
            <input className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400" id="username" name="username" placeholder="findyourvibe" type="text" />
            {state.errors?.username ? <p className="mt-2 text-sm text-rose-400">{state.errors.username[0]}</p> : null}
          </div>
        ) : null}
        {fields.includes("password") ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
              Password
            </label>
            <input className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400" id="password" name="password" placeholder="At least 8 characters" type="password" />
            {state.errors?.password ? <p className="mt-2 text-sm text-rose-400">{state.errors.password[0]}</p> : null}
          </div>
        ) : null}
        {state.message ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {state.message}
          </div>
        ) : null}
        <SubmitButton label={submitLabel} />
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
