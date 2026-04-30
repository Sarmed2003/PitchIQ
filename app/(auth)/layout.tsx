"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/glass/GlassCard";
import { BackButton } from "@/components/layout/BackButton";

const ease = [0.16, 1, 0.3, 1] as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--color-pitch)] p-6">
      <div
        className="pointer-events-none absolute inset-0 hero-mesh opacity-70"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 size-[min(90vw,480px)] -translate-x-1/2 rounded-full bg-[var(--color-accent)]/10 blur-[100px] motion-safe:animate-orb-drift"
        aria-hidden
      />

      <div
        className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 0px)" }}
      >
        <BackButton href="/" label="Home" />
      </div>

      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 24, scale: 0.97, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          whileHover={reduce ? undefined : { y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
        >
          <GlassCard className="hover-surface w-full p-8">{children}</GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
