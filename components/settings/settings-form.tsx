"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
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

type PreferenceTab = "languages" | "interests" | "vibe" | "activities";

const initialState: FormState = {
  message: "",
  errors: {},
};

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

const preferenceTabs: {
  id: PreferenceTab;
  label: string;
  helper: string;
  name: string;
  options: keyof Pick<Props, "languages" | "interests" | "vibeTags" | "activityCategories">;
  selected: keyof Pick<UserShape, "user_languages" | "user_interests" | "user_vibe_tags" | "user_activity_preferences">;
  selectedKey: "language_id" | "interest_id" | "vibe_tag_id" | "category_id";
  customPlaceholder: string;
}[] = [
  {
    id: "languages",
    label: "Languages",
    helper: "Choose the languages you are comfortable using.",
    name: "language_ids",
    options: "languages",
    selected: "user_languages",
    selectedKey: "language_id",
    customPlaceholder: "Add a custom language",
  },
  {
    id: "interests",
    label: "Interests",
    helper: "Choose the interests you want SyncUp to prioritize.",
    name: "interest_ids",
    options: "interests",
    selected: "user_interests",
    selectedKey: "interest_id",
    customPlaceholder: "Add a custom interest",
  },
  {
    id: "vibe",
    label: "Vibe",
    helper: "Pick a few vibe tags that match your energy.",
    name: "vibe_tag_ids",
    options: "vibeTags",
    selected: "user_vibe_tags",
    selectedKey: "vibe_tag_id",
    customPlaceholder: "Add a custom vibe tag",
  },
  {
    id: "activities",
    label: "Activities",
    helper: "Tell SyncUp which activity categories you like most.",
    name: "activity_category_ids",
    options: "activityCategories",
    selected: "user_activity_preferences",
    selectedKey: "category_id",
    customPlaceholder: "Add a custom activity",
  },
];

function getSelectedIds(user: UserShape, tab: PreferenceTab) {
  if (tab === "languages") {
    return user.user_languages.map((item) => item.language_id);
  }

  if (tab === "interests") {
    return user.user_interests.map((item) => item.interest_id);
  }

  if (tab === "vibe") {
    return user.user_vibe_tags.map((item) => item.vibe_tag_id);
  }

  return user.user_activity_preferences.map((item) => item.category_id);
}

function splitFullName(fullName: string | null | undefined) {
  const trimmed = fullName?.trim() ?? "";
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function FormCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card rounded-xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_20px_48px_rgba(0,0,0,0.2)]">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">{eyebrow}</p> : null}
        <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(99,102,241,0.34)] disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving settings..." : "Save changes"}
    </button>
  );
}

function inputClassName() {
  return "w-full rounded-xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400";
}

export function SettingsForm({ action, user, languages, interests, vibeTags, activityCategories }: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.profile?.avatar_url ?? null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(user.profile?.cover_url ?? null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<PreferenceTab>("languages");
  const initialName = useMemo(() => splitFullName(user.profile?.full_name), [user.profile?.full_name]);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
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

  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
  const activeTabConfig = preferenceTabs.find((tab) => tab.id === activeTab) ?? preferenceTabs[0];

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
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }

  function clearBanner() {
    setBannerPreview(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  }

  function renderFieldError(field: string) {
    return state.errors?.[field] ? <p className="mt-2 text-sm text-rose-400">{state.errors[field]?.[0]}</p> : null;
  }

  return (
    <form action={formAction} className="space-y-6">
      <input name="full_name" type="hidden" value={fullName} />

      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-950/70 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Profile editor</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Update your profile details, images, and preferences in a cleaner workspace built for quick edits.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {showSuccess && state.message ? <p className="text-sm text-emerald-300">{state.message}</p> : null}
          <SubmitButton />
        </div>
      </div>

      {!state.success && state.message ? (
        <div className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{state.message}</div>
      ) : null}

      <FormCard eyebrow="Profile" title="Personal information" description="Keep the essentials aligned and easy to scan across your public profile.">
        <div className="grid max-w-4xl gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="first_name">
                First name
              </label>
              <input
                className={inputClassName()}
                id="first_name"
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
                type="text"
                value={firstName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="last_name">
                Last name
              </label>
              <input
                className={inputClassName()}
                id="last_name"
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last name"
                type="text"
                value={lastName}
              />
            </div>
          </div>
          {renderFieldError("full_name")}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,20rem)_minmax(0,24rem)]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="username">
                Username
              </label>
              <input
                className={inputClassName()}
                defaultValue={user.username}
                id="username"
                name="username"
                placeholder="findyourvibe"
                type="text"
              />
              {renderFieldError("username")}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                className={inputClassName()}
                defaultValue={user.email}
                id="email"
                name="email"
                placeholder="you@example.com"
                type="email"
              />
              {renderFieldError("email")}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="bio">
              Bio
            </label>
            <textarea
              className="min-h-[110px] w-full max-w-4xl resize-none rounded-xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm leading-7 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
              defaultValue={user.profile?.bio ?? ""}
              id="bio"
              name="bio"
              placeholder="Write a short overview of what you enjoy and how you connect."
            />
            {renderFieldError("bio")}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,18rem)_minmax(0,18rem)]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="city">
                City
              </label>
              <input
                className={inputClassName()}
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
                className={inputClassName()}
                defaultValue={user.profile?.country ?? ""}
                id="country"
                name="country"
                placeholder="Country"
                type="text"
              />
              {renderFieldError("country")}
            </div>
          </div>
        </div>
      </FormCard>

      <FormCard eyebrow="Images" title="Profile images" description="Update your avatar and banner with aligned previews and quick replacement controls.">
        <div className="grid max-w-4xl gap-6 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-sm text-slate-500">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="Avatar preview" className="h-full w-full object-cover" src={avatarPreview} />
                ) : (
                  "No avatar"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="avatar">
                  Avatar upload
                </label>
                <input
                  accept="image/*"
                  className="w-full rounded-xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-100"
                  id="avatar"
                  name="avatar"
                  onChange={(event) => updatePreview(event, avatarPreview, setAvatarPreview)}
                  ref={avatarInputRef}
                  type="file"
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                    onClick={clearAvatar}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="banner">
              Banner upload
            </label>
            <input
              accept="image/*"
              className="w-full rounded-xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-100"
              id="banner"
              name="banner"
              onChange={(event) => updatePreview(event, bannerPreview, setBannerPreview)}
              ref={bannerInputRef}
              type="file"
            />
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-slate-950">
              {bannerPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Banner preview" className="h-40 w-full object-cover" src={bannerPreview} />
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">No banner selected</div>
              )}
            </div>
            <button
              className="mt-4 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              onClick={clearBanner}
              type="button"
            >
              Remove banner
            </button>
          </div>
        </div>
      </FormCard>

      <FormCard eyebrow="Preferences" title="Personalization" description="Switch between preference groups without forcing the page into one long scrolling checklist.">
        <div className="max-w-4xl space-y-6">
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="inline-flex min-w-full gap-2 rounded-xl border border-white/10 bg-slate-900/50 p-1">
              {preferenceTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    activeTab === tab.id ? "bg-indigo-500/20 text-white shadow-[inset_0_0_0_1px_rgba(129,140,248,0.25)]" : "text-slate-400 hover:text-slate-100"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/45 p-5">
            <InterestTagSelector
              allowCustom
              customPlaceholder={activeTabConfig.customPlaceholder}
              helper={activeTabConfig.helper}
              label={activeTabConfig.label}
              name={activeTabConfig.name}
              options={{ languages, interests, vibeTags, activityCategories }[activeTabConfig.options]}
              selectedIds={getSelectedIds(user, activeTabConfig.id)}
            />
          </div>
        </div>
      </FormCard>

      <FormCard eyebrow="Privacy" title="Profile controls" description="Fine-tune how people discover you and the kind of social activity you want SyncUp to emphasize.">
        <div className="grid max-w-4xl gap-6 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="social_mode">
              Social mode
            </label>
            <select
              className={inputClassName()}
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
            <p className="mb-3 text-sm font-medium text-slate-200">Profile visibility</p>
            <div className="grid gap-3">
              {Object.entries(visibilityOptions).map(([value, item]) => (
                <label
                  key={value}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-indigo-400"
                >
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
      </FormCard>
    </form>
  );
}
