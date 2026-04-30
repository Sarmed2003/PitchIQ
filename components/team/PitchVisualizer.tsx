"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { JerseyToken } from "@/components/players/JerseyToken";

type Slot = { id: string; label: "GK" | "DEF" | "MID" | "FWD"; x: number; y: number };

const FORMATIONS: Record<string, Slot[]> = {
  "4-4-2": [
    { id: "gk", label: "GK", x: 50, y: 90 },
    { id: "d1", label: "DEF", x: 18, y: 70 },
    { id: "d2", label: "DEF", x: 38, y: 72 },
    { id: "d3", label: "DEF", x: 62, y: 72 },
    { id: "d4", label: "DEF", x: 82, y: 70 },
    { id: "m1", label: "MID", x: 22, y: 48 },
    { id: "m2", label: "MID", x: 42, y: 44 },
    { id: "m3", label: "MID", x: 58, y: 44 },
    { id: "m4", label: "MID", x: 78, y: 48 },
    { id: "f1", label: "FWD", x: 38, y: 22 },
    { id: "f2", label: "FWD", x: 62, y: 22 },
  ],
  "4-3-3": [
    { id: "gk", label: "GK", x: 50, y: 90 },
    { id: "d1", label: "DEF", x: 18, y: 70 },
    { id: "d2", label: "DEF", x: 38, y: 72 },
    { id: "d3", label: "DEF", x: 62, y: 72 },
    { id: "d4", label: "DEF", x: 82, y: 70 },
    { id: "m1", label: "MID", x: 30, y: 48 },
    { id: "m2", label: "MID", x: 50, y: 44 },
    { id: "m3", label: "MID", x: 70, y: 48 },
    { id: "f1", label: "FWD", x: 22, y: 22 },
    { id: "f2", label: "FWD", x: 50, y: 18 },
    { id: "f3", label: "FWD", x: 78, y: 22 },
  ],
  "3-5-2": [
    { id: "gk", label: "GK", x: 50, y: 90 },
    { id: "d1", label: "DEF", x: 28, y: 72 },
    { id: "d2", label: "DEF", x: 50, y: 75 },
    { id: "d3", label: "DEF", x: 72, y: 72 },
    { id: "m1", label: "MID", x: 14, y: 50 },
    { id: "m2", label: "MID", x: 34, y: 46 },
    { id: "m3", label: "MID", x: 50, y: 44 },
    { id: "m4", label: "MID", x: 66, y: 46 },
    { id: "m5", label: "MID", x: 86, y: 50 },
    { id: "f1", label: "FWD", x: 38, y: 22 },
    { id: "f2", label: "FWD", x: 62, y: 22 },
  ],
};

export type PitchPlayer = {
  name: string;
  position: string | null;
  club?: string | null;
  shirtNumber?: number | null;
  points?: number | null;
  isCaptain?: boolean;
  isVice?: boolean;
  isInjured?: boolean;
};

type PitchProps = {
  starters: Partial<Record<string, PitchPlayer | undefined>>;
  formation?: keyof typeof FORMATIONS;
  className?: string;
  onSlotTap?: (slotId: string) => void;
};

// Top-down pitch SVG with painted lines and a jersey at every slot. The
// tokens are absolutely positioned over the SVG so the formation can change
// without re-rendering the grass.
export function PitchVisualizer({
  starters,
  formation = "4-4-2",
  className,
  onSlotTap,
}: PitchProps) {
  const reduce = useReducedMotion();
  const slots = FORMATIONS[formation] ?? FORMATIONS["4-4-2"];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-[var(--color-glass-border)] shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="block aspect-[3/4] w-full sm:aspect-[4/3]"
        role="img"
        aria-label={`${formation} starting lineup`}
      >
        <defs>
          <pattern id="grass-stripes" patternUnits="userSpaceOnUse" width="100" height="10">
            <rect width="100" height="10" fill="#0a3a22" />
            <rect width="100" height="5" y="0" fill="#0c4329" />
          </pattern>
          <radialGradient id="pitch-glow" cx="50%" cy="40%" r="80%">
            <stop offset="0%" stopColor="rgba(212,182,118,0.18)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        <rect width="100" height="100" fill="url(#grass-stripes)" />
        <rect width="100" height="100" fill="url(#pitch-glow)" />

        <g
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="0.35"
        >
          <rect x="3" y="3" width="94" height="94" rx="0.5" />
          <line x1="3" y1="50" x2="97" y2="50" />
          <circle cx="50" cy="50" r="9" />
          <circle cx="50" cy="50" r="0.7" fill="rgba(255,255,255,0.85)" />
          <rect x="22" y="3" width="56" height="14" />
          <rect x="36" y="3" width="28" height="6" />
          <circle cx="50" cy="11" r="0.7" fill="rgba(255,255,255,0.85)" />
          <rect x="22" y="83" width="56" height="14" />
          <rect x="36" y="91" width="28" height="6" />
          <circle cx="50" cy="89" r="0.7" fill="rgba(255,255,255,0.85)" />
          <path d="M3 6 A3 3 0 0 1 6 3" />
          <path d="M97 6 A3 3 0 0 0 94 3" />
          <path d="M3 94 A3 3 0 0 0 6 97" />
          <path d="M97 94 A3 3 0 0 1 94 97" />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0">
        {slots.map((slot, i) => {
          const p = starters[slot.id];
          const lastName = p?.name ? p.name.split(/\s+/).slice(-1)[0] : undefined;
          return (
            <motion.button
              type="button"
              key={slot.id}
              disabled={!onSlotTap}
              onClick={() => onSlotTap?.(slot.id)}
              initial={reduce ? undefined : { opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: reduce ? 0 : 0.05 * i,
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={onSlotTap && !reduce ? { y: -3, scale: 1.04 } : undefined}
              whileTap={onSlotTap && !reduce ? { scale: 0.95 } : undefined}
              className={cn(
                "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-transform",
                onSlotTap ? "cursor-pointer" : "cursor-default",
              )}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              aria-label={
                p?.name ? `${slot.label} — ${p.name}` : `${slot.label} slot empty`
              }
            >
              <div className="relative flex flex-col items-center gap-1">
                {p ? (
                  <JerseyToken
                    club={p.club}
                    name={lastName}
                    number={p.shirtNumber}
                    isGoalkeeper={slot.label === "GK"}
                    state={
                      p.isCaptain
                        ? "captain"
                        : p.isVice
                          ? "vice"
                          : p.isInjured
                            ? "injured"
                            : "default"
                    }
                    size="sm"
                  />
                ) : (
                  <span
                    className="grid size-10 place-items-center rounded-full border border-dashed border-white/35 bg-black/30 font-broadcast text-[10px] uppercase tracking-wide text-white/70 backdrop-blur-sm"
                    aria-hidden
                  >
                    {slot.label}
                  </span>
                )}
                <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white shadow-sm">
                  {p?.name
                    ? (lastName ?? p.name).slice(0, 10)
                    : slot.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export const FORMATION_KEYS = Object.keys(FORMATIONS) as Array<keyof typeof FORMATIONS>;
