import { redirect } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { AuthCard } from "@/components/auth-card";
import { Navbar } from "@/components/navbar";
import { getCurrentUser } from "@/server/auth";

export default async function LoginPage() {
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
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-emerald-300">
              Welcome back
            </p>
            <h1 className="section-title mt-4 max-w-xl text-5xl leading-tight text-slate-50">
              Pick up where you left off and see what your people are up to.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
              Check new posts, discover active communities, and find plans that match
              your style.
            </p>
          </section>
          <AuthCard
            action={loginAction}
            fields={["email", "password"]}
            footerHref="/register"
            footerText="Need an account?"
            footerLinkLabel="Sign up"
            submitLabel="Log in"
            title="Log in"
            description="Use your email and password to get back into SyncUp."
          />
        </div>
      </div>
    </div>
  );
}
