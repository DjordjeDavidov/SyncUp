import { logoutAction } from "@/actions/feed";
import { changePasswordAction } from "@/actions/auth";
import { getCurrentUserOrRedirect } from "@/server/auth";
import { getOnboardingData } from "@/server/queries";
import { Navbar } from "@/components/navbar";
import { MobileNav } from "@/components/mobile-nav";
import { SettingsForm } from "../../components/settings/settings-form";
import { PasswordChangeForm } from "../../components/settings/password-change-form";
import { updateSettingsAction } from "@/actions/profile";

export default async function SettingsPage() {
  const currentUser = await getCurrentUserOrRedirect();
  const data = await getOnboardingData();

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />

        <div className="mx-auto max-w-6xl py-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:items-start">
            <SettingsForm
              action={updateSettingsAction}
              user={currentUser}
              languages={data.languages}
              interests={data.interests}
              vibeTags={data.vibeTags}
              activityCategories={data.activityCategories}
            />
            <aside className="lg:sticky lg:top-6">
              <PasswordChangeForm action={changePasswordAction} />
            </aside>
          </div>
        </div>

        <MobileNav />
      </div>
    </div>
  );
}
