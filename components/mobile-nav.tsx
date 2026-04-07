"use client";

import Link from "next/link";
import { Home, Sparkles, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

export function MobileNav() {
  const pathname = usePathname();

  const items = [
    {
      href: "/home",
      label: "Home",
      icon: Home,
      active: pathname === "/home",
    },
    {
      href: "/explore",
      label: "Explore",
      icon: Sparkles,
      active: pathname.startsWith("/explore"),
    },
    {
      href: "/profile",
      label: "Profile",
      icon: UserRound,
      active: pathname.startsWith("/profile"),
    },
  ] as const;

  return (
    <nav className="surface-card fixed inset-x-4 bottom-4 z-40 grid grid-cols-3 rounded-[24px] p-2 lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-3 text-center text-xs font-semibold transition-all duration-200 ${
              item.active
                ? "bg-[linear-gradient(135deg,rgba(99,102,241,0.18),rgba(59,130,246,0.08))] text-slate-100 shadow-[0_10px_24px_rgba(99,102,241,0.12)]"
                : "text-slate-300 hover:bg-white/[0.05] hover:text-slate-100"
            }`}
            href={item.href}
            key={item.label}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
