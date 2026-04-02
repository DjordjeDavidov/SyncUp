"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ImagePlus } from "lucide-react";
import { useFormStatus } from "react-dom";
import { FormState } from "@/lib/validation";
import { getInitials } from "@/lib/utils";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  user: {
    username: string;
    profile: {
      full_name: string;
      bio: string | null;
      avatar_url: string | null;
      cover_url: string | null;
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
    <button
      className="rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(99,102,241,0.34)] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : "Save Changes"}
    </button>
  );
}

export function EditProfileForm({ action, user }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.profile?.avatar_url ?? null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(user.profile?.cover_url ?? null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (bannerPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [avatarPreview, bannerPreview]);

  function updatePreview(
    event: React.ChangeEvent<HTMLInputElement>,
    currentPreview: string | null,
    setPreview: (value: string | null) => void,
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (currentPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(currentPreview);
    }

    setPreview(URL.createObjectURL(file));
  }

  const displayName = user.profile?.full_name ?? user.username;

  return (
    <form
      action={formAction}
      className="surface-card overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,43,0.94),rgba(10,14,28,0.98))] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.34),0_0_24px_rgba(99,102,241,0.08)] sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Edit Profile</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Refresh how your profile looks</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Update your core identity, avatar, and banner without leaving the profile flow.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/16 hover:bg-white/8"
          href="/profile"
        >
          Back to Profile
        </Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(13,18,34,0.96),rgba(9,13,24,0.98))]">
        <div className="relative h-44 border-b border-white/8 sm:h-56">
          {bannerPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={`${displayName} banner preview`} className="h-full w-full object-cover" src={bannerPreview} />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_26%),radial-gradient(circle_at_top_right,rgba(129,140,248,0.28),transparent_30%),linear-gradient(135deg,rgba(30,41,59,0.92),rgba(10,14,26,0.98))]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(9,13,24,0.35)_78%,rgba(9,13,24,0.9))]" />
          <button
            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/30"
            onClick={() => bannerInputRef.current?.click()}
            type="button"
          >
            <ImagePlus className="h-4 w-4" />
            Change Banner
          </button>
          <input
            accept="image/*"
            className="sr-only"
            name="banner"
            onChange={(event) => updatePreview(event, bannerPreview, setBannerPreview)}
            ref={bannerInputRef}
            type="file"
          />
        </div>

        <div className="relative px-6 pb-6">
          <div className="-mt-14 flex flex-col gap-6 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-[#0c1323] bg-[linear-gradient(135deg,rgba(99,102,241,0.4),rgba(59,130,246,0.22))] text-2xl font-semibold text-white shadow-[0_18px_42px_rgba(2,6,23,0.44)] sm:h-32 sm:w-32">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={`${displayName} avatar preview`} className="h-full w-full object-cover" src={avatarPreview} />
                ) : (
                  getInitials(displayName)
                )}
                <button
                  className="absolute bottom-2 right-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/40"
                  onClick={() => avatarInputRef.current?.click()}
                  type="button"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  accept="image/*"
                  className="sr-only"
                  name="avatar"
                  onChange={(event) => updatePreview(event, avatarPreview, setAvatarPreview)}
                  ref={avatarInputRef}
                  type="file"
                />
              </div>
              <div className="pb-2">
                <p className="text-xl font-semibold text-white sm:text-2xl">{displayName}</p>
                <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="full_name">
                  Full name
                </label>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-indigo-400"
                  defaultValue={user.profile?.full_name ?? ""}
                  id="full_name"
                  name="full_name"
                  placeholder="Your full name"
                  type="text"
                />
                {state.errors?.full_name ? <p className="mt-2 text-sm text-rose-400">{state.errors.full_name[0]}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="username">
                  Username
                </label>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-indigo-400"
                  defaultValue={user.username}
                  id="username"
                  name="username"
                  placeholder="findyourvibe"
                  type="text"
                />
                {state.errors?.username ? <p className="mt-2 text-sm text-rose-400">{state.errors.username[0]}</p> : null}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="bio">
                Bio
              </label>
              <textarea
                className="min-h-[140px] w-full resize-none rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm leading-7 text-slate-50 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-indigo-400"
                defaultValue={user.profile?.bio ?? ""}
                id="bio"
                name="bio"
                placeholder="Tell people what you're into, what kind of plans you like, and the vibe you bring."
              />
              {state.errors?.bio ? <p className="mt-2 text-sm text-rose-400">{state.errors.bio[0]}</p> : null}
            </div>
          </div>
        </div>
      </div>

      {state.message ? (
        <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.message}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
