"use client";

import { motion, useReducedMotion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/glass/GlassCard";
import { LandingFeatures } from "@/components/marketing/LandingFeatures";
import { AuthNavTransitionLink } from "@/components/landing/AuthNavTransitionLink";

const easeApple = [0.16, 1, 0.3, 1] as const;

const heroContainerMotion = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.12 },
  },
};

const heroItemMotion = {
  hidden: { opacity: 0, y: 28, filter: "blur(14px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: easeApple },
  },
};

const heroInstant = {
  hidden: { opacity: 1, y: 0, filter: "blur(0px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function LandingPageView() {
  const reduce = useReducedMotion();
  const heroContainer = reduce ? { hidden: {}, show: {} } : heroContainerMotion;
  const heroItem = reduce ? heroInstant : heroItemMotion;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--color-pitch)]">
      {/* Ambient mesh — subtle motion (respects reduced motion via CSS) */}
      <div className="pointer-events-none absolute inset-0 hero-mesh opacity-90" aria-hidden />
      <div className="pointer-events-none absolute -left-1/4 top-1/4 size-[min(80vw,520px)] rounded-full bg-[var(--color-accent)]/8 blur-[100px] motion-safe:animate-orb-drift" aria-hidden />
      <div className="pointer-events-none absolute -right-1/4 bottom-0 size-[min(70vw,440px)] rounded-full bg-[var(--color-accent-2)]/10 blur-[90px] motion-safe:animate-orb-drift-reverse" aria-hidden />

      <motion.header
        initial={reduce ? undefined : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeApple }}
        className="landing-nav sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-glass-border)]/60 px-5 py-3 backdrop-blur-2xl sm:px-8"
      >
        <motion.span
          className="font-display text-lg font-semibold tracking-tight text-[var(--color-text-primary)]"
          whileHover={reduce ? undefined : { scale: 1.02 }}
        >
          <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] bg-clip-text text-transparent">
            PitchIQ
          </span>
        </motion.span>
        <div className="flex items-center gap-2 sm:gap-3">
          <AuthNavTransitionLink
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "border border-transparent hover:border-[var(--color-glass-border)]/80",
            )}
          >
            Sign in
          </AuthNavTransitionLink>
          <AuthNavTransitionLink href="/signup" className={buttonVariants({ size: "sm" })}>
            Start for free
          </AuthNavTransitionLink>
        </div>
      </motion.header>

      <main className="relative z-10 flex flex-1 flex-col">
        <section className="relative flex flex-1 flex-col items-center justify-center px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            aria-hidden
            style={{
              backgroundImage: `radial-gradient(circle at 50% 120%, var(--color-accent) 0%, transparent 55%)`,
            }}
          />

          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="show"
            className="relative z-10 w-full max-w-3xl"
          >
            <GlassCard className="relative overflow-hidden p-8 text-center sm:p-12">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/50 to-transparent" />

              <motion.h1
                variants={heroItem}
                className="font-display text-[clamp(2rem,6vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--color-text-primary)]"
              >
                Draft smarter.
                <br />
                <span className="bg-gradient-to-br from-[var(--color-text-primary)] via-[var(--color-text-primary)] to-[var(--color-text-muted)] bg-clip-text text-transparent">
                  Score harder.
                </span>
              </motion.h1>

              <motion.p
                variants={heroItem}
                className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg"
              >
                The fantasy Premier League workspace for serious managers — live draft
                rooms, synced boards, and analytics-first tooling. Assistant features ship
                next.
              </motion.p>

              <motion.div
                variants={heroItem}
                className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
              >
                <AuthNavTransitionLink href="/signup" className={buttonVariants({ size: "lg" })}>
                  Start for free
                </AuthNavTransitionLink>
                <AuthNavTransitionLink
                  href="/login"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "border-[var(--color-glass-border)] bg-[var(--color-glass)]/30 backdrop-blur-sm",
                  )}
                >
                  Sign in
                </AuthNavTransitionLink>
              </motion.div>

              <motion.p
                variants={heroItem}
                className="mt-8 font-mono text-xs text-[var(--color-text-hint)]"
              >
                No credit card · Built for mini-leagues
              </motion.p>
            </GlassCard>
          </motion.div>
        </section>

        <LandingFeatures />

        <footer className="border-t border-[var(--color-glass-border)]/70 px-6 py-10 text-center text-xs leading-relaxed text-[var(--color-text-muted)]">
          PitchIQ · Fantasy Premier League · Next.js & Supabase
        </footer>
      </main>
    </div>
  );
}
