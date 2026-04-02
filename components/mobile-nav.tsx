import Link from "next/link";

export function MobileNav() {
  return (
    <nav className="surface-card fixed inset-x-4 bottom-4 z-40 grid grid-cols-3 rounded-[24px] p-2 lg:hidden">
      <Link className="rounded-2xl px-4 py-3 text-center text-sm font-semibold text-slate-100" href="/home">
        Home
      </Link>
      <Link className="rounded-2xl px-4 py-3 text-center text-sm font-semibold text-slate-300" href="/onboarding">
        Profile
      </Link>
      <Link className="rounded-2xl px-4 py-3 text-center text-sm font-semibold text-slate-300" href="/">
        Explore
      </Link>
    </nav>
  );
}
