import { redirect } from "next/navigation";
import { onboardingAction } from "@/actions/profile";
import { Navbar } from "@/components/navbar";
import { ProfileSetupForm } from "@/components/profile-setup-form";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getOnboardingData } from "@/server/queries";

export default async function OnboardingPage() {
  const currentUser = await getCurrentUserOrRedirect();

  if (currentUser.profile?.full_name) {
    redirect("/home");
  }

  const data = await getOnboardingData();

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <Navbar user={currentUser} />
        <div className="grid gap-8 py-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <div className="surface-card rounded-3xl p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">
                Complete your profile
              </p>
              <h1 className="section-title mt-4 text-3xl text-slate-50">Set the tone for your SyncUp experience.</h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Tell people who you are, what you enjoy, and how you like to connect.
              </p>
            </div>
            <div className="surface-card rounded-3xl p-6">
              <p className="text-sm font-semibold text-emerald-300">Powered by your real data</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Languages, interests, vibe tags, and activity preferences are loaded
                from the database tables that already exist in Supabase.
              </p>
            </div>
          </aside>
          <ProfileSetupForm
            action={onboardingAction}
            activityCategories={data.activityCategories}
            interests={data.interests}
            languages={data.languages}
            user={currentUser}
            vibeTags={data.vibeTags}
          />
        </div>
      </div>
    </div>
  );
}
