import { describe, expect, it } from "vitest";
import {
  applyCaptainMultiplier,
  calculateFantasyPoints,
  calculateFantasyPointsBreakdown,
  DEFAULT_SCORING_SYSTEM,
} from "./scoring";

describe("calculateFantasyPointsBreakdown", () => {
  it("returns 0 with empty input", () => {
    const r = calculateFantasyPointsBreakdown(null, "MID", null);
    expect(r.total).toBe(0);
    expect(r.parts).toHaveLength(0);
  });

  it("awards 2 pts for >=60 minutes (no other action)", () => {
    const r = calculateFantasyPointsBreakdown({ minutes_played: 90 }, "MID", null);
    expect(r.total).toBe(2);
    expect(r.parts.find((p) => p.key === "played_60")?.value).toBe(2);
  });

  it("awards 1 pt for cameo (1-59 minutes)", () => {
    const r = calculateFantasyPointsBreakdown({ minutes_played: 30 }, "FWD", null);
    expect(r.total).toBe(1);
  });

  it("scores defender goals at 6 pts each", () => {
    const r = calculateFantasyPointsBreakdown(
      { minutes_played: 90, goals: 2, clean_sheet: true },
      "DEF",
      null,
    );
    // 2 (played 60) + 12 (2 goals * 6) + 4 (clean sheet) = 18
    expect(r.total).toBe(18);
  });

  it("clean sheet only counts when >=60 minutes", () => {
    const r = calculateFantasyPointsBreakdown(
      { minutes_played: 30, clean_sheet: true },
      "DEF",
      null,
    );
    expect(r.parts.find((p) => p.key === "clean_sheet")).toBeUndefined();
  });

  it("penalises GK/DEF for goals conceded in groups of 2", () => {
    const r = calculateFantasyPointsBreakdown(
      { minutes_played: 90, goals_conceded: 3 },
      "GK",
      null,
    );
    // 2 (appearance) + floor(3/2)*-1 = 2 - 1 = 1
    expect(r.total).toBe(1);
  });

  it("does not penalise mids/fwds for goals conceded", () => {
    const r = calculateFantasyPointsBreakdown(
      { minutes_played: 90, goals_conceded: 5 },
      "MID",
      null,
    );
    expect(r.total).toBe(2);
  });

  it("yellow card subtracts 1, red subtracts 3", () => {
    const r = calculateFantasyPointsBreakdown(
      { minutes_played: 90, yellow_cards: 1, red_cards: 1 },
      "MID",
      null,
    );
    expect(r.total).toBe(2 - 1 - 3);
  });

  it("respects league overrides via scoring_system", () => {
    const customRules = { played_60: 5, goal_mid: 10 };
    const r = calculateFantasyPointsBreakdown(
      { minutes_played: 90, goals: 1 },
      "MID",
      customRules,
    );
    expect(r.total).toBe(5 + 10);
  });

  it("calculateFantasyPoints returns same total as breakdown", () => {
    const input = { minutes_played: 90, goals: 1, assists: 2 };
    const total = calculateFantasyPoints(input, "FWD", null);
    const breakdown = calculateFantasyPointsBreakdown(input, "FWD", null);
    expect(total).toBe(breakdown.total);
  });

  it("includes a sane default scoring system", () => {
    expect(DEFAULT_SCORING_SYSTEM.played_60).toBe(2);
    expect(DEFAULT_SCORING_SYSTEM.goal_def).toBe(6);
  });
});

describe("applyCaptainMultiplier", () => {
  it("doubles points for captain", () => {
    expect(applyCaptainMultiplier(10, true, false)).toBe(20);
  });

  it("triples for triple captain", () => {
    expect(applyCaptainMultiplier(10, true, true)).toBe(30);
  });

  it("non-captains are unchanged", () => {
    expect(applyCaptainMultiplier(10, false, true)).toBe(10);
  });
});
