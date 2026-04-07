"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { InterestTagSelector } from "@/components/interest-tag-selector";
import { FormState } from "@/lib/validation";
import { profile_visibility, social_mode } from "@/lib/prisma-generated";

type Option = {
  id: string;
  name: string;
  slug?: string;
};

type UserShape = {
  id: string;
  email: string;
  username: string;
  profile: {
    full_name: string | null;
    bio: string | null;
    city: string | null;
    country: string | null;
    social_mode: social_mode;
    profile_visibility: profile_visibility;
    avatar_url: string | null;
    cover_url: string | null;
  } | null;
  user_languages: { language_id: string }[];
  user_interests: { interest_id: string }[];
  user_vibe_tags: { vibe_tag_id: string }[];
  user_activity_preferences: { category_id: string }[];
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  user: UserShape;
  languages: Option[];
  interests: Option[];
  vibeTags: Option[];
  activityCategories: Option[];
};

const initialState: FormState = {
  message: "",
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(99,102,241,0.34)] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving settings..." : "Save Changes"}
    </button>
  );
}

const socialModeOptions: Record<social_mode, string> = {
  JUST_CHAT: "Just chat",
  ONLINE_GAMING: "Online gaming",
  GROUP_HANGOUTS: "Group hangouts",
  REAL_LIFE_MEETUPS: "Real-life meetups",
};

const visibilityOptions: Record<profile_visibility, { label: string; description: string }> = {
  PUBLIC: {
    label: "Public profile",
    description: "Anyone can discover your profile and activity on SyncUp.",
  },
  PRIVATE: {
    label: "Private profile",
    description: "Only people you follow or accept can view your profile details.",
  },
};

export function SettingsForm({ action, user, languages, interests, vibeTags, activityCategories }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.profile?.avatar_url ?? null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(user.profile?.cover_url ?? null);
  const [showSuccess, setShowSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
    }
  }, [state.success]);

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

  function clearAvatar() {
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  function clearBanner() {
    setBannerPreview(null);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }

  function renderFieldError(field: string) {
    return state.errors?.[field] ? <p className="mt-2 text-sm text-rose-400">{state.errors[field]?.[0]}</p> : null;
  }

  return (
    <form action={formAction} className="space-y-6">
      <section className="surface-card rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_28px_60px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">Profile</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Personal details</h2>
          </div>
          <div className="text-sm text-slate-400">
            Update the information shown across your profile and public activity.
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="full_name">
                  Full name
                </label>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
                  defaultValue={user.profile?.full_name ?? ""}
                  id="full_name"
                  name="full_name"
                  placeholder="Your full name"
                  type="text"
                />
                {renderFieldError("full_name")}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="username">
                  Username
                </label>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
                  defaultValue={user.username}
                  id="username"
                  name="username"
                  placeholder="findyourvibe"
                  type="text"
                />
                {renderFieldError("username")}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
                Email address
              </label>
              <input
                className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
                defaultValue={user.email}
                id="email"
                name="email"
                placeholder="you@example.com"
                type="email"
              />
              {renderFieldError("email")}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="bio">
                Bio
              </label>
              <textarea
                className="min-h-[120px] w-full resize-none rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm leading-7 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
                defaultValue={user.profile?.bio ?? ""}
                id="bio"
                name="bio"
                placeholder="Write a short overview of what you enjoy and how you connect."
              />
              {renderFieldError("bio")}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="city">
                  City
                </label>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
                  defaultValue={user.profile?.city ?? ""}
                  id="city"
                  name="city"
                  placeholder="City"
                  type="text"
                />
                {renderFieldError("city")}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="country">
                  Country
                </label>
                <input
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
                  defaultValue={user.profile?.country ?? ""}
                  id="country"
                  name="country"
                  placeholder="Country"
                  type="text"
                />
                {renderFieldError("country")}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="social_mode">
                  Social mode
                </label>
                <select
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition focus:border-indigo-400"
                  defaultValue={user.profile?.social_mode ?? social_mode.JUST_CHAT}
                  id="social_mode"
                  name="social_mode"
                >
                  {Object.entries(socialModeOptions).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {renderFieldError("social_mode")}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-slate-200">Profile visibility</p>
                <div className="grid gap-3">
                  {Object.entries(visibilityOptions).map(([value, item]) => (
                    <label key={value} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-indigo-400">
                      <input
                        className="mr-3 h-4 w-4 accent-[var(--primary)]"
                        defaultChecked={(user.profile?.profile_visibility ?? profile_visibility.PUBLIC) === value}
                        name="profile_visibility"
                        type="radio"
                        value={value}
                      />
                      <span className="font-semibold text-white">{item.label}</span>
                      <span className="mt-1 block text-sm text-slate-400">{item.description}</span>
                    </label>
                  ))}
                </div>
                {renderFieldError("profile_visibility")}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Images</p>
                  <p className="mt-2 text-sm text-slate-400">Your avatar and banner appear across the app.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="avatar">
                    Avatar
                  </label>
                  <input
                    accept="image/*"
                    ref={avatarInputRef}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-100"
                    id="avatar"
                    name="avatar"
                    type="file"
                    onChange={(event) => updatePreview(event, avatarPreview, setAvatarPreview)}
                  />
                  <div className="mt-3 flex items-center gap-3">
                    {avatarPreview ? (
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-slate-950">
                        <img alt="Avatar preview" className="h-full w-full object-cover" src={avatarPreview} />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-slate-950 text-slate-500">
                        No avatar
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={clearAvatar}
                      className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="banner">
                    Banner
                  </label>
                  <input
                    accept="image/*"
                    ref={bannerInputRef}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-100"
                    id="banner"
                    name="banner"
                    type="file"
                    onChange={(event) => updatePreview(event, bannerPreview, setBannerPreview)}
                  />
                  <div className="mt-3">
                    {bannerPreview ? (
                      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950">
                        <img alt="Banner preview" className="h-32 w-full object-cover" src={bannerPreview} />
                      </div>
                    ) : (
                      <div className="h-32 rounded-3xl border border-white/10 bg-slate-950 text-center leading-[8rem] text-slate-500">
                        No banner selected
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearBanner}
                    className="mt-3 rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                  >
                    Remove banner
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Preferences</p>
              <div className="mt-5 space-y-5">
                <InterestTagSelector
                  helper="Choose the languages you are comfortable using."
                  label="Languages"
                  name="language_ids"
                  options={languages}
                  selectedIds={user.user_languages.map((item) => item.language_id)}
                  allowCustom
                  customPlaceholder="Add a custom language"
                />
                <InterestTagSelector
                  helper="Choose the interests you want SyncUp to prioritize."
                  label="Interests"
                  name="interest_ids"
                  options={interests}
                  selectedIds={user.user_interests.map((item) => item.interest_id)}
                  allowCustom
                  customPlaceholder="Add a custom interest"
                />
                <InterestTagSelector
                  helper="Pick a few vibe tags that match your energy."
                  label="Vibe tags"
                  name="vibe_tag_ids"
                  options={vibeTags}
                  selectedIds={user.user_vibe_tags.map((item) => item.vibe_tag_id)}
                  allowCustom
                  customPlaceholder="Add a custom vibe tag"
                />
                <InterestTagSelector
                  helper="Tell SyncUp which activity categories you like most."
                  label="Activity preferences"
                  name="activity_category_ids"
                  options={activityCategories}
                  selectedIds={user.user_activity_preferences.map((item) => item.category_id)}
                  allowCustom
                  customPlaceholder="Add a custom activity"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {state.message ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${state.success ? "bg-emerald-500/10 text-emerald-200 border border-emerald-300/20" : "bg-rose-500/10 text-rose-200 border border-rose-300/20"}`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-4">
        <SubmitButton />
      </div>
    </form>
  );
}
