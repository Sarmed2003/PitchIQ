"use client";

import { useEffect } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/glass/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <GlassCard className="mx-auto mt-6 max-w-2xl p-6 sm:p-8">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
        Route error
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--color-text-primary)]">
        This page hit an error.
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        The details are below. If you keep seeing this, share the message with
        support and we&apos;ll dig in.
      </p>
      <pre className="mt-4 max-h-72 overflow-auto rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] p-4 text-xs whitespace-pre-wrap break-words text-[var(--color-text-primary)]">
        {error.message || "Unknown error"}
        {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        {error.stack ? `\n\n${error.stack}` : ""}
      </pre>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className={cn(buttonVariants(), "tap-target")}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "tap-target border-[var(--color-glass-border)]",
          )}
        >
          Back to dashboard
        </Link>
      </div>
    </GlassCard>
  );
}
