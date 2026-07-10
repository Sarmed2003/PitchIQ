"use client";

import { MotionConfig } from "framer-motion";

// One place to honor prefers-reduced-motion for every Framer Motion
// component in the app. reducedMotion="user" respects the OS setting.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
