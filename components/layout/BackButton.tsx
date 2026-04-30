"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  // If set, behaves like a hard link. Otherwise we fall back to history.back()
  // and only push to `fallbackHref` when there's no history (e.g. someone
  // landed here directly from a share link).
  href?: string;
  fallbackHref?: string;
  label?: string;
  className?: string;
};

// Small, unobtrusive back affordance. Sits in a corner with a chevron + label,
// big enough to thumb-press on phones but never the focal point of the screen.
export function BackButton({
  href,
  fallbackHref = "/dashboard",
  label = "Back",
  className,
}: Props) {
  const router = useRouter();

  const baseCls = cn(
    "tap-target inline-flex items-center gap-1 rounded-full border border-[var(--color-glass-border)]",
    "bg-[var(--color-glass)]/60 px-3 py-1.5 text-sm text-[var(--color-text-muted)] backdrop-blur",
    "transition hover:text-[var(--color-text)] hover:border-[var(--color-glass-border-strong,rgba(255,255,255,0.18))]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40",
    className,
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={baseCls}>
        <ChevronLeft className="size-4" strokeWidth={2.4} />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      className={baseCls}
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
    >
      <ChevronLeft className="size-4" strokeWidth={2.4} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
