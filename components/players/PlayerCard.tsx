"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { JerseyToken } from "@/components/players/JerseyToken";
import { formatPoints } from "@/lib/utils/format";
import { getClubPalette } from "@/lib/clubs/palette";
import { cn } from "@/lib/utils";

export type PlayerCardData = {
  id: number;
  name: string;
  club: string;
  club_short?: string | null;
  position?: string | null;
  shirt_number?: number | null;
  form?: string | number | null;
  total_points?: number | null;
  injury_status?: string | null;
};

type PlayerCardProps = {
  player: PlayerCardData;
  href?: string;
  className?: string;
  size?: "sm" | "md";
};

export function PlayerCard({ player, href, className, size = "md" }: PlayerCardProps) {
  const reduce = useReducedMotion();
  const palette = getClubPalette(player.club_short ?? player.club);
  const status = player.injury_status ?? "available";
  const lastName = player.name.split(/\s+/).slice(-1)[0] ?? player.name;
  const firstName = player.name.split(/\s+/).slice(0, -1).join(" ");

  const card = (
    <motion.div
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="h-full"
    >
      <GlassCard
        className={cn(
          "relative h-full overflow-hidden p-4",
          size === "sm" ? "p-3" : "p-4",
          className,
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${palette.primary}aa 50%, transparent 100%)`,
          }}
          aria-hidden
        />
        <div className="flex items-start gap-3">
          <JerseyToken
            club={player.club_short ?? player.club}
            name={lastName}
            number={player.shirt_number}
            isGoalkeeper={player.position === "GK"}
            size={size === "sm" ? "sm" : "md"}
            state={
              status === "injured"
                ? "injured"
                : status === "suspended"
                  ? "suspended"
                  : "default"
            }
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {firstName || "—"}
            </p>
            <p className="truncate font-display text-base font-semibold text-[var(--color-text-primary)]">
              {lastName.toUpperCase()}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ backgroundColor: palette.primary }}
                aria-hidden
              />
              {player.club_short ?? palette.short} · {player.position ?? "—"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {player.position ? (
              <GlassBadge variant="accent">{player.position}</GlassBadge>
            ) : null}
            {status === "doubtful" ? (
              <GlassBadge variant="warn">Doubt</GlassBadge>
            ) : status === "injured" ? (
              <GlassBadge variant="danger">Injury</GlassBadge>
            ) : status === "suspended" ? (
              <GlassBadge variant="danger">Susp.</GlassBadge>
            ) : null}
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Pts
            </p>
            <p className="font-broadcast text-xl leading-none text-[var(--color-text-primary)]">
              {formatPoints(player.total_points ?? 0)}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-[var(--color-text-hint)]">
              Form {player.form ?? "—"}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  return href ? (
    <Link href={href} className="block focus-visible:outline-none">
      {card}
    </Link>
  ) : (
    card
  );
}
