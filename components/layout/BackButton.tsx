"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  // When set, always navigates to this URL. Otherwise the button goes
  // back through history, falling back to `fallbackHref` if there is none.
  href?: string;
  fallbackHref?: string;
  label?: string;
  className?: string;
};

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
