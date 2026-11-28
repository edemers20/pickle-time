"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { CalendarClock, GitBranch, Home, Lock, Table2, Users } from "lucide-react";
import { PlayerAvatar } from "@/components/bits";
import { HowItWorksButton } from "@/components/how-it-works";
import { ProfileSheet } from "@/components/welcome";
import { cn } from "@/lib/utils";
import { usePlayerSession } from "@/components/player-session";
import { useTourney } from "@/components/tourney-provider";

const NAV = [
  { href: "/", label: "Now", icon: Home },
  { href: "/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/pools", label: "Standings", icon: Table2 },
  { href: "/bracket", label: "Bracket", icon: GitBranch },
  { href: "/teams", label: "Players", icon: Users },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/teams") return pathname.startsWith("/teams") || pathname.startsWith("/players");
  return pathname.startsWith(href);
}

function WithPathname({ render }: { render: (pathname: string) => React.ReactNode }) {
  return <>{render(usePathname())}</>;
}

function PathAware({ render }: { render: (pathname: string) => React.ReactNode }) {
  return (
    <Suspense fallback={render("")}>
      <WithPathname render={render} />
    </Suspense>
  );
}

function navItems(isAdmin: boolean) {
  return isAdmin ? [...NAV, { href: "/admin", label: "Desk", icon: Lock }] : NAV;
}

function DesktopNav({ pathname }: { pathname: string }) {
  const { isAdmin } = usePlayerSession();
  return (
    <nav className="ml-4 hidden items-center gap-1 md:flex">
      {navItems(isAdmin).map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
            isActive(pathname, n.href) && "bg-secondary text-foreground",
          )}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

function AccountControl({ onProfile }: { onProfile: () => void }) {
  const { playerId, ready, logout } = usePlayerSession();
  const { state } = useTourney();
  const player = playerId ? state?.players.find((p) => p.id === playerId) : undefined;
  if (!ready) return <span className="inline-block h-8 w-16 rounded-md bg-muted/50" aria-hidden />;
  if (player) {
    return (
      <>
        <button
          type="button"
          data-testid="logout"
          onClick={() => void logout()}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Log out
        </button>
        <button type="button" onClick={onProfile} aria-label="Your profile" data-testid="header-profile" className="rounded-full transition-transform hover:scale-105">
          <PlayerAvatar player={player} size={32} />
        </button>
      </>
    );
  }
  return (
    <Link href="/login" data-testid="login-link" className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
      Login
    </Link>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  const { isAdmin } = usePlayerSession();
  const items = navItems(isAdmin);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <div className={cn("mx-auto grid max-w-md", items.length > 5 ? "grid-cols-6" : "grid-cols-5")}>
        {items.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors",
              isActive(pathname, n.href) && "text-primary",
            )}
          >
            <n.icon className="size-5" />
            {n.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state } = useTourney();
  const { profileToken } = usePlayerSession();
  const name = state?.settings.eventName || "Pickle Time";
  const [profileOpen, setProfileOpen] = useState(false);
  const [seenToken, setSeenToken] = useState(profileToken);
  if (profileToken !== seenToken) {
    setSeenToken(profileToken);
    if (profileToken > 0) setProfileOpen(true);
  }

  return (
    <div className="court-texture flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/" className="min-w-0 truncate font-display text-xl font-bold uppercase tracking-tight">
            {name}
          </Link>
          <PathAware render={(pathname) => <DesktopNav pathname={pathname} />} />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <HowItWorksButton />
            <AccountControl onProfile={() => setProfileOpen(true)} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 md:pb-12">
        <PathAware
          render={(pathname) => (
            <div key={pathname || "boot"} className={pathname ? "fade-in" : undefined}>
              {children}
            </div>
          )}
        />
      </main>
      <PathAware render={(pathname) => <MobileNav pathname={pathname} />} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
