// Until we ingest the full fixture list, the active gameweek and lock deadline
// live in `leagues.settings` (commissioner-managed). Single source of truth so
// the rest of the app doesn't reach into that JSON directly.

import type { Json } from "@/types/database.types";

export const SEASON = process.env.NEXT_PUBLIC_FOOTBALL_SEASON ?? "2025-26";

export type LeagueGameweekState = {
  gameweek: number;
  deadline: Date | null;
  /** True when the deadline has passed → lineups can no longer be edited. */
  locked: boolean;
  season: string;
};

function asRecord(value: Json | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function readGameweekFromSettings(
  settings: Json | null | undefined,
  now: Date = new Date(),
): LeagueGameweekState {
  const obj = asRecord(settings);
  const gw = Number(obj.current_gameweek);
  const deadlineRaw = obj.lineup_deadline;
  const deadline =
    typeof deadlineRaw === "string" && deadlineRaw.length > 0
      ? new Date(deadlineRaw)
      : null;
  return {
    gameweek: Number.isFinite(gw) && gw > 0 ? gw : 1,
    deadline,
    // No deadline set → editing stays open. Commissioners are expected to set
    // one before kickoff.
    locked: deadline ? deadline.getTime() <= now.getTime() : false,
    season: typeof obj.season === "string" ? obj.season : SEASON,
  };
}

export function isDeadlinePast(deadline: Date | null, now = new Date()): boolean {
  if (!deadline) return false;
  return deadline.getTime() <= now.getTime();
}

export function formatDeadlineLabel(deadline: Date | null): string {
  if (!deadline) return "No deadline set";
  const now = Date.now();
  const ms = deadline.getTime() - now;
  if (ms <= 0) return "Deadline passed";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `Locks in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Locks in ${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `Locks in ${days}d ${hours % 24}h`;
}
