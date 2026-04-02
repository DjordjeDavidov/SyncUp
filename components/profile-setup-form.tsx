"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { social_mode } from "@/lib/prisma-generated";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormState } from "@/lib/validation";
import { InterestTagSelector } from "@/components/interest-tag-selector";

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
    full_name: string;
    bio: string | null;
    city: string | null;
    country: string | null;
    social_mode: social_mode;
    avatar_url: string | null;
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
      className="inline-flex items-center justify-center rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving profile..." : "Complete profile"}
    </button>
  );
}

const socialModeLabels: Record<social_mode, string> = {
  JUST_CHAT: "Just chat",
  ONLINE_GAMING: "Online gaming",
  GROUP_HANGOUTS: "Group hangouts",
  REAL_LIFE_MEETUPS: "Real-life meetups",
};

export function ProfileSetupForm({
  action,
  user,
  languages,
  interests,
  vibeTags,
  activityCategories,
}: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.profile?.avatar_url ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<boolean>(false);
  const [customSocialModes, setCustomSocialModes] = useState<string[]>([]);
  const [socialModeInput, setSocialModeInput] = useState("");
  const [selectedSocialModes, setSelectedSocialModes] = useState<string[]>([
    user.profile?.social_mode ?? social_mode.JUST_CHAT,
  ]);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Avatar file is too large. Use a file smaller than 5MB.");
      setAvatarSuccess(false);
      setAvatarFile(null);
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarFile(file);
    setAvatarError(null);
    setAvatarSuccess(true);
  }

  function handleDeleteAvatar() {
    setAvatarFile(null);
    setAvatarError(null);
    setAvatarSuccess(false);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
    setAvatarPreview(user.profile?.avatar_url ?? null);
  }

  function chooseAnotherAvatar() {
    avatarInputRef.current?.click();
  }

  function toggleSocialMode(value: string) {
    setSelectedSocialModes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function addCustomSocialMode() {
    const trimmed = socialModeInput.trim();
    if (!trimmed) {
      return;
    }
    if (customSocialModes.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setSocialModeInput("");
      return;
    }
    setCustomSocialModes((current) => [...current, trimmed]);
    setSocialModeInput("");
  }

  return (
    <form action={formAction} className="surface-card rounded-[32px] p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
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
          {state.errors?.full_name ? <p className="mt-2 text-sm text-rose-400">{state.errors.full_name[0]}</p> : null}
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
          {state.errors?.username ? <p className="mt-2 text-sm text-rose-400">{state.errors.username[0]}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-slate-200" htmlFor="avatar">
              Avatar
            </label>
            {avatarPreview ? (
              <span className="text-sm text-emerald-300">Avatar preview ready</span>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              accept="image/*"
              ref={avatarInputRef}
              className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-100"
              id="avatar"
              name="avatar"
              type="file"
              onChange={handleAvatarChange}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={chooseAnotherAvatar}
                className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Choose another
              </button>
              <button
                type="button"
                onClick={handleDeleteAvatar}
                className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
              >
                Delete
              </button>
            </div>
          </div>
          {avatarPreview ? (
            <div className="mt-4 inline-flex h-28 w-28 overflow-hidden rounded-3xl border border-white/10 bg-slate-950">
              <img alt="Avatar preview" className="h-full w-full object-cover" src={avatarPreview} />
            </div>
          ) : null}
          {avatarError ? (
            <p className="mt-3 text-sm text-rose-400">{avatarError}</p>
          ) : avatarSuccess ? (
            <p className="mt-3 text-sm text-emerald-300">Avatar is ready to upload.</p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-200">Social mode</label>
          <p className="mb-3 text-sm text-slate-400">Pick one or more social styles that match your vibe.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(socialModeLabels).map(([value, label]) => (
              <label
                key={value}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-indigo-400 hover:bg-indigo-500/10"
              >
                <input
                  className="h-4 w-4 accent-[var(--primary)]"
                  checked={selectedSocialModes.includes(value)}
                  name="social_mode"
                  type="checkbox"
                  value={value}
                  onChange={() => toggleSocialMode(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
              placeholder="Add custom social mode"
              type="text"
              value={socialModeInput}
              onChange={(event) => setSocialModeInput(event.target.value)}
            />
            <button
              type="button"
              onClick={addCustomSocialMode}
              className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Add
            </button>
          </div>
          {customSocialModes.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {customSocialModes.map((mode) => (
                <span key={mode} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100">
                  {mode}
                  <input type="hidden" name="social_mode_custom" value={mode} />
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <InterestTagSelector
            helper="Choose the languages you are comfortable using."
            label="Languages"
            name="language_ids"
            options={languages}
            selectedIds={user.user_languages.map((item) => item.language_id)}
            allowCustom
            customPlaceholder="Add a custom language"
          />
        </div>
        <div className="sm:col-span-2">
          <InterestTagSelector
            helper="These shape the people and communities you see most."
            label="Interests"
            name="interest_ids"
            options={interests}
            selectedIds={user.user_interests.map((item) => item.interest_id)}
            allowCustom
            customPlaceholder="Add a custom interest"
          />
        </div>
        <div className="sm:col-span-2">
          <InterestTagSelector
            helper="Pick a few tags that feel like your energy."
            label="Vibe tags"
            name="vibe_tag_ids"
            options={vibeTags}
            selectedIds={user.user_vibe_tags.map((item) => item.vibe_tag_id)}
            allowCustom
            customPlaceholder="Add a custom vibe tag"
          />
        </div>
        <div className="sm:col-span-2">
          <InterestTagSelector
            helper="Tell SyncUp what kinds of plans you would actually join."
            label="Activity preferences"
            name="activity_category_ids"
            options={activityCategories}
            selectedIds={user.user_activity_preferences.map((item) => item.category_id)}
            allowCustom
            customPlaceholder="Add a custom activity"
          />
        </div>
      </div>
      {state.message ? (
        <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.message}
        </div>
      ) : null}
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="max-w-xl text-sm leading-6 text-slate-400">
          Your profile will be used to personalize discovery, suggestions, and activity recommendations.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
