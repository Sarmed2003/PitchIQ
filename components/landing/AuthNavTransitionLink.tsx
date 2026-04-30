"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

// Animated nav into the auth pages — drops a frosted veil over the page,
// flashes the wordmark, then pushes. Looks intentional instead of a hard cut.
export function AuthNavTransitionLink({ href, className, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const navigate = useCallback(() => {
    if (reduce) {
      router.push(href);
      return;
    }
    setOpen(true);
    window.setTimeout(() => {
      router.push(href);
      window.setTimeout(() => setOpen(false), 200);
    }, 450);
  }, [href, reduce, router]);

  return (
    <>
      <motion.button
        type="button"
        className={cn(className)}
        onClick={navigate}
        whileHover={reduce ? undefined : { scale: 1.03, y: -1 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 440, damping: 26 }}
      >
        {children}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="auth-veil"
            role="presentation"
            className="fixed inset-0 z-[100] flex cursor-wait items-center justify-center bg-[var(--color-pitch)]/88 backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, letterSpacing: "0.5em" }}
              animate={{ scale: 1, opacity: 1, letterSpacing: "0.22em" }}
              exit={{ scale: 1.08, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-xs font-semibold uppercase text-[var(--color-accent)] sm:text-sm"
            >
              PitchIQ
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
