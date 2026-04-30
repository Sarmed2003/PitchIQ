import type { Json } from "@/types/database.types";

// Defaults follow FPL almost exactly. Commissioners can override any of these
// via leagues.scoring_system without a deploy.
export const DEFAULT_SCORING_SYSTEM = {
  // Appearance
  played_any: 1,
  played_60: 2,

  // Goals (per position)
  goal_gk: 10,
  goal_def: 6,
  goal_mid: 5,
  goal_fwd: 4,

  // Assists / contributions
  assist: 3,

  // Defensive returns
  clean_sheet_gk: 4,
  clean_sheet_def: 4,
  clean_sheet_mid: 1,
  clean_sheet_fwd: 0,
  goals_conceded_per: 2,
  goals_conceded_value: -1, // -1 per N goals conceded for GK + DEF

  // Discipline
  yellow_card: -1,
  red_card: -3,
  own_goal: -2,
  penalty_miss: -2,
  penalty_save: 5,

  // Goalkeeper specific
  save_points_per: 3,
  save_point_value: 1,

  // Bonus
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

// Returns the total + a per-rule breakdown. The breakdown is what we show in
// the player popover ("3 pts goal · 1 pt clean sheet · -1 yellow") and what
// goes into scoring_audit so disputes have a paper trail.
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

  // Goals are worth different points depending on position.
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

  // FPL rule: clean sheet only counts if they actually played 60'.
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

  // GK and defenders lose a point per pair of goals conceded.
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

  // Cap bonus at 3 (FPL gives 1/2/3 to the top three players in each match).
  const bonus = raw.bonus_points ?? 0;
  if (bonus > 0) {
    const max = s.bonus_max ?? 3;
    add("bonus", Math.min(bonus, max), `${bonus} bonus`);
  }

  return breakdown;
}

// Drops the breakdown — kept for older callers that just want the total.
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
