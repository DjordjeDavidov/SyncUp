"use client";

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

  return (
    <form action={formAction} className="surface-card rounded-[32px] p-6 sm:p-8" encType="multipart/form-data">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="full_name">Full name</label>
          <input className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400" defaultValue={user.profile?.full_name ?? ""} id="full_name" name="full_name" placeholder="Your full name" type="text" />
          {state.errors?.full_name ? <p className="mt-2 text-sm text-rose-400">{state.errors.full_name[0]}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="username">Username</label>
          <input className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400" defaultValue={user.username} id="username" name="username" placeholder="findyourvibe" type="text" />
          {state.errors?.username ? <p className="mt-2 text-sm text-rose-400">{state.errors.username[0]}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="avatar">Avatar</label>
          <input accept="image/*" className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-100" id="avatar" name="avatar" type="file" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="bio">Bio</label>
          <textarea className="min-h-[120px] w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400" defaultValue={user.profile?.bio ?? ""} id="bio" name="bio" placeholder="What kind of people, communities, and plans are you into?" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="city">City</label>
          <input className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400" defaultValue={user.profile?.city ?? ""} id="city" name="city" placeholder="Belgrade" type="text" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="country">Country</label>
          <input className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400" defaultValue={user.profile?.country ?? ""} id="country" name="country" placeholder="Serbia" type="text" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="social_mode">Social mode</label>
          <select className="w-full rounded-2xl border border-[var(--border)] bg-[#0d1528] px-4 py-3 text-sm text-slate-50 outline-none transition focus:border-indigo-400" defaultValue={user.profile?.social_mode ?? social_mode.JUST_CHAT} id="social_mode" name="social_mode">
            {Object.entries(socialModeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <InterestTagSelector helper="Choose the languages you are comfortable using." label="Languages" name="language_ids" options={languages} selectedIds={user.user_languages.map((item) => item.language_id)} />
        </div>
        <div className="sm:col-span-2">
          <InterestTagSelector helper="These shape the people and communities you see most." label="Interests" name="interest_ids" options={interests} selectedIds={user.user_interests.map((item) => item.interest_id)} />
        </div>
        <div className="sm:col-span-2">
          <InterestTagSelector helper="Pick a few tags that feel like your energy." label="Vibe tags" name="vibe_tag_ids" options={vibeTags} selectedIds={user.user_vibe_tags.map((item) => item.vibe_tag_id)} />
        </div>
        <div className="sm:col-span-2">
          <InterestTagSelector helper="Tell SyncUp what kinds of plans you would actually join." label="Activity preferences" name="activity_category_ids" options={activityCategories} selectedIds={user.user_activity_preferences.map((item) => item.category_id)} />
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
