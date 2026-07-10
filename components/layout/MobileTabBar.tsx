"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Trophy,
  ArrowLeftRight,
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/players", label: "Players", icon: Users },
  { href: "/trades", label: "Trades", icon: ArrowLeftRight },
  { href: "/leaderboard", label: "Standings", icon: Medal },
  { href: "/league/create", label: "Leagues", icon: Trophy },
] as const;

// Mobile-only bottom nav. Sidebar takes over at lg+.
export function MobileTabBar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-glass-border)]/80 bg-[color-mix(in_oklab,var(--color-pitch)_88%,transparent)] backdrop-blur-2xl lg:hidden"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.25rem)",
      }}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "tap-target relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[10px] font-medium tracking-wide uppercase transition-colors",
                  active
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-x-3 inset-y-1 -z-0 rounded-xl bg-[var(--color-accent)]/12"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 32 }
                    }
                    aria-hidden
                  />
                ) : null}
                <Icon className="relative size-5" strokeWidth={2.2} />
                <span className="relative">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
