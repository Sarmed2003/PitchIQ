"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

// Per-route mount animation. No AnimatePresence + mode="wait", because that
// combo gets stuck against Next.js App Router: the exit animation drives
// opacity to 0 on the old subtree, the new subtree mounts before Framer sees
// it, and the enter frame never fires — leaving the page blank.
export function RootPageTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className="min-h-dvh">{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-dvh"
    >
      {children}
    </motion.div>
  );
}
