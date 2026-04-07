"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Home, MessageCircleMore, Sparkles, Users2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GlobalSearch } from "@/components/global-search";
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
  const [isVisible, setIsVisible] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstProfileMenuItemRef = useRef<HTMLAnchorElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        profileMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isProfileMenuOpen) {
      firstProfileMenuItemRef.current?.focus();
    }
  }, [isProfileMenuOpen]);

  const signedInNavItems = [
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
      href: "/communities",
      label: "Communities",
      icon: Users2,
      active: pathname.startsWith("/communities"),
    },
  ] as const;

  const profileMenuItems = [
    { href: "/profile", label: "View Profile" },
    { href: "/settings", label: "Settings" },
    { href: "/communities", label: "My Communities" },
  ] as const;

  return (
    <header
      className={`sticky top-4 z-30 mb-2 flex items-center justify-between rounded-[28px] border border-white/10 bg-[rgba(10,14,28,0.72)] px-4 py-3 shadow-[0_18px_50px_rgba(2,6,23,0.34)] backdrop-blur-xl transition-transform duration-300 sm:px-5 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-[140%] opacity-0"
      }`}
    >
      <Link className="flex items-center" href={user ? "/home" : "/"}>
        <div className="flex h-12 w-[210px] items-center justify-start overflow-hidden">
          <Image
            src="/SyncUpLogo.png"
            alt="SyncUp logo"
            width={200}
            height={60}
            priority
            className="h-12 w-[210px] max-w-none object-contain object-left"
          />
        </div>
      </Link>

      <nav className="hidden items-center gap-2 text-sm text-slate-300 lg:flex">
        {user ? (
          <>
            {signedInNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 font-semibold transition-all duration-200 ${
                    item.active
                      ? "border-indigo-300/20 bg-[linear-gradient(135deg,rgba(99,102,241,0.16),rgba(59,130,246,0.08))] text-white shadow-[0_12px_28px_rgba(30,41,59,0.22),0_0_20px_rgba(99,102,241,0.08)]"
                      : "border-transparent text-slate-300 hover:border-white/8 hover:bg-white/[0.05] hover:text-white active:scale-[0.99]"
                  }`}
                  href={item.href}
                  key={item.label}
                >
                  <Icon className={`h-4 w-4 ${item.active ? "text-indigo-200" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
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
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden xl:block">
            <GlobalSearch />
          </div>
          <div className="xl:hidden">
            <GlobalSearch compact />
          </div>
          <Link
            aria-label="Messages"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-slate-300 transition-all duration-200 ${
              pathname === "/messages"
                ? "border-sky-300/20 bg-sky-400/10 text-sky-100 shadow-[0_10px_24px_rgba(56,189,248,0.12)]"
                : "border-white/8 bg-white/[0.04] hover:border-sky-300/20 hover:bg-sky-400/10 hover:text-sky-100 active:scale-[0.99]"
            }`}
            href="/messages"
          >
            <MessageCircleMore className="h-4.5 w-4.5" />
          </Link>
          <Link
            aria-label="Activity"
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-slate-300 transition-all duration-200 ${
              pathname === "/activity"
                ? "border-rose-300/20 bg-rose-400/10 text-rose-100 shadow-[0_10px_24px_rgba(251,113,133,0.12)]"
                : "border-white/8 bg-white/[0.04] hover:border-rose-300/20 hover:bg-rose-400/10 hover:text-rose-100 active:scale-[0.99]"
            }`}
            href="/activity"
          >
            <Heart className="h-4.5 w-4.5" />
          </Link>
          <div className="relative" ref={profileMenuRef}>
            <button
              aria-controls="profile-menu"
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
              aria-label="Open profile menu"
              className={`flex items-center gap-3 rounded-2xl border px-2.5 py-2 transition-all duration-200 ${
                isProfileMenuOpen
                  ? "border-indigo-300/20 bg-[linear-gradient(135deg,rgba(99,102,241,0.14),rgba(59,130,246,0.08))] shadow-[0_12px_28px_rgba(30,41,59,0.22),0_0_20px_rgba(99,102,241,0.08)]"
                  : "border-white/8 bg-white/[0.04] hover:border-white/12 hover:bg-white/[0.06]"
              }`}
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setIsProfileMenuOpen(true);
                }
              }}
              ref={profileMenuButtonRef}
              type="button"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-indigo-500/30 text-sm font-semibold text-white ring-1 ring-white/10">
                {user.profile?.avatar_url ? (
                  <img
                    alt={user.profile.full_name ?? user.username}
                    className="h-full w-full object-cover"
                    src={user.profile.avatar_url}
                  />
                ) : (
                  getInitials(user.profile?.full_name ?? user.username)
                )}
              </div>
              <div className="hidden max-w-[160px] min-w-0 text-left sm:block">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {user.profile?.full_name ?? user.username}
                </p>
                <p className="truncate text-xs text-slate-400">@{user.username}</p>
              </div>
            </button>

            <div
              className={`absolute right-0 top-[calc(100%+0.75rem)] z-40 w-60 origin-top-right rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(14,20,36,0.98),rgba(9,14,26,0.98))] p-2 shadow-[0_22px_50px_rgba(2,6,23,0.48),0_0_24px_rgba(99,102,241,0.1)] transition-all duration-200 ${
                isProfileMenuOpen
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0"
              }`}
              id="profile-menu"
              role="menu"
            >
              <div className="mb-2 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-3">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {user.profile?.full_name ?? user.username}
                </p>
                <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
              </div>
              {profileMenuItems.map((item) => (
                <Link
                  className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200 outline-none transition-all duration-200 hover:bg-white/[0.05] hover:text-white focus:bg-white/[0.05] focus:text-white"
                  href={item.href}
                  key={item.label}
                  onClick={() => setIsProfileMenuOpen(false)}
                  ref={item.label === "View Profile" ? firstProfileMenuItemRef : undefined}
                  role="menuitem"
                  tabIndex={isProfileMenuOpen ? 0 : -1}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-white/8 pt-2">
                {logoutAction ? (
                  <LogoutButton
                    action={logoutAction}
                    className="w-full justify-start rounded-xl border-transparent bg-transparent px-3 py-2.5 text-left text-sm font-medium text-slate-200 hover:border-white/0 hover:bg-white/[0.05] hover:text-white focus:bg-white/[0.05] focus:text-white"
                    label="Logout"
                  />
                ) : null}
              </div>
            </div>
          </div>
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
