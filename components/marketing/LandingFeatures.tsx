"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/glass/GlassCard";

const ease = [0.16, 1, 0.3, 1] as const;

const cards = [
  {
    title: "Live draft rooms",
    body: "Snake and auction formats with pick clocks, presence, and synced boards across every manager.",
    accent: "from-[var(--color-accent)]/25 to-transparent",
  },
  {
    title: "Deep analytics",
    body: "Form, fixtures, and fantasy returns in a glass-dark UI tuned for matchday focus.",
    accent: "from-[var(--color-accent-2)]/25 to-transparent",
  },
  {
    title: "Realtime scoring",
    body: "A live ticker and gameweek summaries wired to your league data as fixtures roll in.",
    accent: "from-[var(--color-accent-warn)]/20 to-transparent",
  },
];

export function LandingFeatures() {
  const reduce = useReducedMotion();

  return (
    <section className="relative border-t border-[var(--color-glass-border)]/80 px-5 py-20 sm:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent"
        aria-hidden
      />
      <motion.h2
        initial={reduce ? undefined : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45, ease }}
        className="text-center font-display text-[clamp(1.35rem,3vw,1.75rem)] font-semibold tracking-tight text-[var(--color-text-primary)]"
      >
        Built for the modern mini-league
      </motion.h2>
      <p className="mx-auto mt-3 max-w-lg text-center text-sm text-[var(--color-text-muted)]">
        Precision UI, realtime data, and flows that feel as tight as a matchday squad.
      </p>

      <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={reduce ? undefined : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: reduce ? 0 : i * 0.1, duration: 0.5, ease }}
            whileHover={reduce ? undefined : { y: -6, transition: { type: "spring", stiffness: 360, damping: 22 } }}
            className="h-full"
          >
            <GlassCard className="group relative h-full overflow-hidden p-6 text-left">
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                aria-hidden
              />
              <div className="relative z-10">
                <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--color-text-primary)] transition-colors duration-300 group-hover:text-[var(--color-accent)]">
                  {c.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{c.body}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
