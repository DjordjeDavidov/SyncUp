import { AuthCard } from "@/components/auth-card";
import { Navbar } from "@/components/navbar";
import { registerAction } from "@/actions/auth";
import { getCurrentUser } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/home");
  }

  return (
    <div className="app-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <Navbar />
        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1fr_440px]">
          <section className="hidden lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-indigo-300">
              Join SyncUp
            </p>
            <h1 className="section-title mt-4 max-w-xl text-5xl leading-tight text-slate-50">
              Create your account and start discovering people, communities, and plans.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
              This is a friendship-first space. Build your profile, share your vibe,
              and find communities that feel like home.
            </p>
          </section>
          <AuthCard
            action={registerAction}
            fields={["email", "username", "password"]}
            footerHref="/login"
            footerText="Already have an account?"
            footerLinkLabel="Log in"
            submitLabel="Create account"
            title="Create your account"
            description="Use your email, choose a username, and pick a secure password."
            showConfirmPassword
          />
        </div>
      </div>
    </div>
  );
}
