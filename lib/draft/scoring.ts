import type { Json } from "@/types/database.types";

// Defaults follow FPL. Commissioners override any of these via
// leagues.scoring_system.
export const DEFAULT_SCORING_SYSTEM = {
  played_any: 1,
  played_60: 2,

  goal_gk: 10,
  goal_def: 6,
  goal_mid: 5,
  goal_fwd: 4,

  assist: 3,

  clean_sheet_gk: 4,
  clean_sheet_def: 4,
  clean_sheet_mid: 1,
  clean_sheet_fwd: 0,
  goals_conceded_per: 2,
  goals_conceded_value: -1,

  yellow_card: -1,
  red_card: -3,
  own_goal: -2,
  penalty_miss: -2,
  penalty_save: 5,

  save_points_per: 3,
  save_point_value: 1,

  bonus_min: 1,
  bonus_max: 3,
} as const;

export type ScoringSystem = typeof DEFAULT_SCORING_SYSTEM &
  Record<string, number | undefined>;

export type RawStatInput = {
  minutes_played?: number;
  goals?: number;
  assists?: number;
  clean_sheet?: boolean;
  goals_conceded?: number;
  yellow_cards?: number;
  red_cards?: number;
  saves?: number;
  bonus_points?: number;
  own_goals?: number;
  penalties_missed?: number;
  penalties_saved?: number;
};

export type ScoreBreakdown = {
  total: number;
  parts: Array<{ key: string; value: number; reason: string }>;
};

// Returns the total plus a per-rule breakdown, which is stored in
// scoring_audit and surfaced in the player detail popover.
export function calculateFantasyPointsBreakdown(
  raw: RawStatInput | null | undefined,
  position: string,
  scoring: Partial<ScoringSystem> | Json | null | undefined,
): ScoreBreakdown {
  const s: ScoringSystem = {
    ...DEFAULT_SCORING_SYSTEM,
    ...(typeof scoring === "object" && scoring !== null && !Array.isArray(scoring)
      ? (scoring as Record<string, number>)
      : {}),
  };

  const breakdown: ScoreBreakdown = { total: 0, parts: [] };
  if (!raw) return breakdown;

  const pos = position.toUpperCase();
  const add = (key: string, value: number, reason: string) => {
    if (!value) return;
    breakdown.parts.push({ key, value, reason });
    breakdown.total += value;
  };

  const minutes = raw.minutes_played ?? 0;
  if (minutes > 0 && minutes < 60) add("appearance", s.played_any ?? 1, "Played < 60'");
  else if (minutes >= 60) add("played_60", s.played_60 ?? 2, "Played 60+ minutes");

  const goals = raw.goals ?? 0;
  if (goals > 0) {
    const per =
      pos === "GK"
        ? s.goal_gk ?? 10
        : pos === "DEF"
          ? s.goal_def ?? 6
          : pos === "MID"
            ? s.goal_mid ?? 5
            : s.goal_fwd ?? 4;
    add("goals", goals * per, `${goals} goal${goals > 1 ? "s" : ""}`);
  }

  const assists = raw.assists ?? 0;
  if (assists > 0) add("assists", assists * (s.assist ?? 3), `${assists} assist${assists > 1 ? "s" : ""}`);

  // FPL rule: clean sheet only counts with 60+ minutes played.
  if (raw.clean_sheet && minutes >= 60) {
    const csPts =
      pos === "GK"
        ? s.clean_sheet_gk ?? 4
        : pos === "DEF"
          ? s.clean_sheet_def ?? 4
          : pos === "MID"
            ? s.clean_sheet_mid ?? 1
            : s.clean_sheet_fwd ?? 0;
    if (csPts) add("clean_sheet", csPts, "Clean sheet");
  }

  if ((pos === "GK" || pos === "DEF") && (raw.goals_conceded ?? 0) > 0) {
    const per: number = s.goals_conceded_per ?? 2;
    const val: number = s.goals_conceded_value ?? -1;
    if (per > 0 && val !== 0) {
      const groups = Math.floor((raw.goals_conceded ?? 0) / per);
      add("goals_conceded", groups * val, `${raw.goals_conceded} conceded`);
    }
  }

  if ((raw.yellow_cards ?? 0) > 0)
    add("yellow_cards", (raw.yellow_cards ?? 0) * (s.yellow_card ?? -1), "Yellow card(s)");
  if ((raw.red_cards ?? 0) > 0)
    add("red_cards", (raw.red_cards ?? 0) * (s.red_card ?? -3), "Red card(s)");
  if ((raw.own_goals ?? 0) > 0)
    add("own_goals", (raw.own_goals ?? 0) * (s.own_goal ?? -2), "Own goal");
  if ((raw.penalties_missed ?? 0) > 0)
    add("penalty_miss", (raw.penalties_missed ?? 0) * (s.penalty_miss ?? -2), "Penalty miss");
  if ((raw.penalties_saved ?? 0) > 0)
    add("penalty_save", (raw.penalties_saved ?? 0) * (s.penalty_save ?? 5), "Penalty save");

  const saves = raw.saves ?? 0;
  const per = s.save_points_per ?? 3;
  if (per > 0 && pos === "GK" && saves > 0) {
    add("saves", Math.floor(saves / per) * (s.save_point_value ?? 1), `${saves} saves`);
  }

  // FPL bonus is 1/2/3 for the top three players per match.
  const bonus = raw.bonus_points ?? 0;
  if (bonus > 0) {
    const max = s.bonus_max ?? 3;
    add("bonus", Math.min(bonus, max), `${bonus} bonus`);
  }

  return breakdown;
}

export function calculateFantasyPoints(
  raw: RawStatInput | null | undefined,
  position: string,
  scoring: Partial<ScoringSystem> | Json | null | undefined,
): number {
  return calculateFantasyPointsBreakdown(raw, position, scoring).total;
}

export function applyCaptainMultiplier(
  basePoints: number,
  isCaptain: boolean,
  tripleCaptain: boolean,
): number {
  if (!isCaptain) return basePoints;
  return basePoints * (tripleCaptain ? 3 : 2);
}
