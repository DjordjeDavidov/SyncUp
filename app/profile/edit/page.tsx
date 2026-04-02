import { editProfileAction } from "@/actions/profile";
import { logoutAction } from "@/actions/feed";
import { MobileNav } from "@/components/mobile-nav";
import { Navbar } from "@/components/navbar";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { getCurrentUserOrRedirect } from "@/server/auth";

export default async function EditProfilePage() {
  const currentUser = await getCurrentUserOrRedirect();

  return (
    <div className="app-shell">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12">
        <Navbar user={currentUser} logoutAction={logoutAction} />
        <div className="py-8">
          <EditProfileForm action={editProfileAction} user={currentUser} />
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
