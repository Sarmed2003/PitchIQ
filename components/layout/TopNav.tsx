"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { BackButton } from "@/components/layout/BackButton";

// Sticky header. On mobile we show the wordmark plus notifications and the
// account menu; on desktop the sidebar already brands the page so we strip
// it back to just the right-side actions.
export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  // Dashboard is the "home" of the authed app, so a back button there is
  // confusing. Everywhere else gets one.
  const showBack = pathname !== "/dashboard" && pathname !== "/";

  const { data: notifData } = useQuery({
    queryKey: ["notifications-header"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.error) return [];
      return (json.data ?? []) as Array<{ read: boolean }>;
    },
    staleTime: 30_000,
  });
  const unreadCount = (notifData ?? []).filter((n) => !n.read).length;

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[var(--color-glass-border)]/80 bg-[color-mix(in_oklab,var(--color-pitch)_82%,transparent)] px-3 backdrop-blur-2xl sm:px-4"
      style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0px)" }}
    >
      <div className="flex items-center gap-2">
        {showBack ? <BackButton fallbackHref="/dashboard" /> : null}
        <Link
          href="/dashboard"
          className="font-display text-base font-semibold tracking-tight lg:hidden"
        >
          <span className="gold-shine">PitchIQ</span>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-end gap-1">
        <Link
          href="/dashboard#notifications"
          aria-label="Notifications"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "tap-target relative text-[var(--color-text-muted)]",
          )}
        >
          <Bell className="size-5" strokeWidth={2.2} />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[var(--color-accent-danger)] ring-2 ring-[var(--color-pitch)]" />
          ) : null}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "tap-target border-[var(--color-glass-border)] bg-[var(--color-glass)]/60",
            )}
          >
            Account
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/players")}>
              Players
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
