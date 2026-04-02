import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { getInitials } from "@/lib/utils";

type NavbarProps = {
  user?: {
    id: string;
    username: string;
    profile: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
  logoutAction?: () => Promise<void>;
};

export function Navbar({ user, logoutAction }: NavbarProps) {
  return (
    <header className="sticky top-4 z-30 flex items-center justify-between rounded-[28px] border border-white/10 bg-[rgba(10,14,28,0.72)] px-4 py-3 shadow-[0_18px_50px_rgba(2,6,23,0.34)] backdrop-blur-xl sm:px-5">
      <Link className="flex items-center gap-3" href={user ? "/home" : "/"}>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] text-base font-bold text-white shadow-[0_12px_30px_rgba(99,102,241,0.35)]">
          S
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-50">SyncUp</p>
          <p className="text-xs text-slate-400">Discover your people</p>
        </div>
      </Link>

      <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
        {user ? (
          <>
            <Link className="transition hover:text-white" href="/home">
              Home
            </Link>
            <Link className="transition hover:text-white" href="/onboarding">
              Profile
            </Link>
          </>
        ) : (
          <>
            <Link className="transition hover:text-white" href="/#how-it-works">
              How it works
            </Link>
            <Link className="transition hover:text-white" href="/#use-cases">
              Use cases
            </Link>
            <Link className="transition hover:text-white" href="/#communities">
              Communities
            </Link>
            <Link className="transition hover:text-white" href="/login">
              Log in
            </Link>
          </>
        )}
      </nav>

      {user ? (
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-full border border-white/8 bg-white/5 px-3 py-2 sm:flex">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-indigo-500/30 text-sm font-semibold text-white">
              {user.profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={user.profile.full_name ?? user.username}
                  className="h-full w-full object-cover"
                  src={user.profile.avatar_url}
                />
              ) : (
                getInitials(user.profile?.full_name ?? user.username)
              )}
            </div>
            <div className="max-w-[160px]">
              <p className="truncate text-sm font-semibold text-slate-100">
                {user.profile?.full_name ?? user.username}
              </p>
              <p className="truncate text-xs text-slate-400">@{user.username}</p>
            </div>
          </div>
          {logoutAction ? <LogoutButton action={logoutAction} /> : null}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/8 sm:inline-flex"
            href="/login"
          >
            Log in
          </Link>
          <Link
            className="rounded-full bg-[linear-gradient(135deg,#6366f1,#8b5cf6)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(99,102,241,0.32)] transition duration-200 hover:scale-[1.02] hover:shadow-[0_18px_42px_rgba(99,102,241,0.4)]"
            href="/register"
          >
            Sign up
          </Link>
        </div>
      )}
    </header>
  );
}
