import { z } from "zod";

export const FORMATIONS = [
  "4-4-2",
  "4-3-3",
  "3-5-2",
  "3-4-3",
  "4-5-1",
  "5-3-2",
  "5-4-1",
] as const;

export type Formation = (typeof FORMATIONS)[number];

// Outfield counts per formation. Always 1 GK + these three numbers = 11.
export const FORMATION_COUNTS: Record<Formation, { DEF: number; MID: number; FWD: number }> = {
  "4-4-2": { DEF: 4, MID: 4, FWD: 2 },
  "4-3-3": { DEF: 4, MID: 3, FWD: 3 },
  "3-5-2": { DEF: 3, MID: 5, FWD: 2 },
  "3-4-3": { DEF: 3, MID: 4, FWD: 3 },
  "4-5-1": { DEF: 4, MID: 5, FWD: 1 },
  "5-3-2": { DEF: 5, MID: 3, FWD: 2 },
  "5-4-1": { DEF: 5, MID: 4, FWD: 1 },
};

export const CHIPS = [
  "triple_captain",
  "bench_boost",
  "free_hit",
  "wildcard",
] as const;

export const StarterEntry = z.object({
  slot: z.string().min(1).max(6),
  player_id: z.number().int().positive(),
});

export const BenchEntry = z.object({
  order: z.number().int().min(0).max(10),
  player_id: z.number().int().positive(),
});

export const LineupPayload = z.object({
  formation: z.enum(FORMATIONS),
  starters: z.array(StarterEntry).min(11).max(11),
  bench: z.array(BenchEntry).min(0).max(10),
  captain_player_id: z.number().int().positive().nullable(),
  vice_player_id: z.number().int().positive().nullable(),
  chip: z.enum(CHIPS).nullable().optional(),
});

export type LineupPayloadT = z.infer<typeof LineupPayload>;
