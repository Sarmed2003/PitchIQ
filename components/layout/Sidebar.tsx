"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Shirt,
  ArrowLeftRight,
  Medal,
  Hand,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/glass/GlassPanel";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/league/create", label: "Leagues", icon: Trophy },
  { href: "/players", label: "Players", icon: Users },
  { href: "/trades", label: "Trades", icon: ArrowLeftRight },
  { href: "/waivers", label: "Waivers", icon: Hand },
  { href: "/leaderboard", label: "Leaderboard", icon: Medal },
] as const;

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <GlassPanel
      className={cn(
        "hidden h-full w-60 shrink-0 flex-col gap-1 p-3 lg:flex",
        className,
      )}
    >
      <Link
        href="/dashboard"
        className="mb-5 px-2 py-1 text-lg font-semibold tracking-tight"
      >
        <span className="gold-shine font-display">PitchIQ</span>
      </Link>
      <div className="luxury-divider mx-2 mb-3" aria-hidden />
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "tap-target flex items-center gap-3 rounded-xl px-3 text-sm transition-colors",
              active
                ? "bg-[var(--color-accent)]/14 text-[var(--color-accent)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-glass)] hover:text-[var(--color-text-primary)]",
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={2.2} />
            {label}
          </Link>
        );
      })}
      <div className="flex-1" />
      <Link
        href="/dashboard"
        className="tap-target flex items-center gap-3 rounded-xl px-3 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-glass)] hover:text-[var(--color-text-primary)]"
      >
        <Shirt className="size-4" strokeWidth={2.2} />
        My teams
      </Link>
    </GlassPanel>
  );
}
