import { describe, expect, it } from "vitest";
import { LineupPayload, FORMATIONS, FORMATION_COUNTS } from "./schema";

describe("LineupPayload schema", () => {
  it("accepts a valid 4-4-2 lineup", () => {
    const starters = Array.from({ length: 11 }, (_, i) => ({
      slot: ["gk", "d1", "d2", "d3", "d4", "m1", "m2", "m3", "m4", "f1", "f2"][i],
      player_id: i + 1,
    }));
    const ok = LineupPayload.safeParse({
      formation: "4-4-2",
      starters,
      bench: [{ order: 0, player_id: 99 }],
      captain_player_id: 1,
      vice_player_id: 2,
      chip: null,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects fewer than 11 starters", () => {
    const r = LineupPayload.safeParse({
      formation: "4-4-2",
      starters: [{ slot: "gk", player_id: 1 }],
      bench: [],
      captain_player_id: 1,
      vice_player_id: null,
    });
    expect(r.success).toBe(false);
  });

  it("rejects bad formation", () => {
    const r = LineupPayload.safeParse({
      formation: "10-0-0",
      starters: Array.from({ length: 11 }, (_, i) => ({ slot: `s${i}`, player_id: i + 1 })),
      bench: [],
      captain_player_id: null,
      vice_player_id: null,
    });
    expect(r.success).toBe(false);
  });

  it("formation counts always sum to 10 outfield (+ 1 GK)", () => {
    for (const f of FORMATIONS) {
      const c = FORMATION_COUNTS[f];
      expect(c.DEF + c.MID + c.FWD).toBe(10);
    }
  });
});
