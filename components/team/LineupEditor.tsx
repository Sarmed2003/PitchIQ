"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { Button } from "@/components/ui/button";
import { JerseyToken } from "@/components/players/JerseyToken";
import { PitchVisualizer, type PitchPlayer } from "@/components/team/PitchVisualizer";
import { cn } from "@/lib/utils";
import {
  FORMATIONS,
  FORMATION_COUNTS,
  CHIPS,
  type Formation,
} from "@/lib/lineup/schema";

export type EditorPlayer = {
  id: number;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD" | string | null;
  club: string | null;
  club_short: string | null;
  shirt_number: number | null;
  total_points: number;
  injury_status: string | null;
};

type Props = {
  teamId: string;
  leagueId: string;
  gameweek: number;
  deadlineLabel: string;
  locked: boolean;
  roster: EditorPlayer[];
  initial: {
    formation: Formation;
    starterIds: number[];
    benchIds: number[];
    captainId: number | null;
    viceId: number | null;
    chip: (typeof CHIPS)[number] | null;
  };
};

const SLOT_KEYS_BY_POSITION: Record<"GK" | "DEF" | "MID" | "FWD", string[]> = {
  GK: ["gk"],
  DEF: ["d1", "d2", "d3", "d4", "d5"],
  MID: ["m1", "m2", "m3", "m4", "m5"],
  FWD: ["f1", "f2", "f3"],
};

function buildSlotMap(
  formation: Formation,
  starterIds: number[],
  byId: Map<number, EditorPlayer>,
) {
  const counts = FORMATION_COUNTS[formation];
  const map: Record<string, number | undefined> = {};
  const slotsForPos = (pos: "GK" | "DEF" | "MID" | "FWD") => {
    const wanted = pos === "GK" ? 1 : counts[pos];
    return SLOT_KEYS_BY_POSITION[pos].slice(0, wanted);
  };
  const remaining = new Set(starterIds);
  (["GK", "DEF", "MID", "FWD"] as const).forEach((pos) => {
    const slots = slotsForPos(pos);
    const matches = [...remaining].filter((id) => byId.get(id)?.position === pos);
    slots.forEach((slot, i) => {
      const id = matches[i];
      if (id != null) {
        map[slot] = id;
        remaining.delete(id);
      }
    });
  });
  return map;
}

function toPitchPlayer(
  p: EditorPlayer,
  captainId: number | null,
  viceId: number | null,
): PitchPlayer {
  return {
    name: p.name,
    position: p.position,
    club: p.club_short ?? p.club,
    shirtNumber: p.shirt_number,
    points: p.total_points,
    isCaptain: p.id === captainId,
    isVice: p.id === viceId,
    isInjured: p.injury_status === "injured",
  };
}

export function LineupEditor({
  teamId,
  gameweek,
  deadlineLabel,
  locked,
  roster,
  initial,
}: Props) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [formation, setFormation] = useState<Formation>(initial.formation);
  const [starterIds, setStarterIds] = useState<number[]>(initial.starterIds);
  const [benchIds, setBenchIds] = useState<number[]>(initial.benchIds);
  const [captainId, setCaptainId] = useState<number | null>(initial.captainId);
  const [viceId, setViceId] = useState<number | null>(initial.viceId);
  const [chip, setChip] = useState<(typeof CHIPS)[number] | null>(initial.chip);
  const [swapTarget, setSwapTarget] = useState<{ kind: "starter" | "bench"; playerId: number } | null>(null);

  const byId = useMemo(() => new Map(roster.map((p) => [p.id, p])), [roster]);

  const slotMap = useMemo(
    () => buildSlotMap(formation, starterIds, byId),
    [formation, starterIds, byId],
  );

  const startersOnPitch: Record<string, PitchPlayer | undefined> = useMemo(() => {
    const out: Record<string, PitchPlayer | undefined> = {};
    for (const [slot, id] of Object.entries(slotMap)) {
      const p = id != null ? byId.get(id) : undefined;
      if (p) out[slot] = toPitchPlayer(p, captainId, viceId);
    }
    return out;
  }, [slotMap, byId, captainId, viceId]);

  const counts = FORMATION_COUNTS[formation];
  const positionTally = useMemo(() => {
    const t = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const id of starterIds) {
      const pos = byId.get(id)?.position as "GK" | "DEF" | "MID" | "FWD" | undefined;
      if (pos && pos in t) t[pos]++;
    }
    return t;
  }, [starterIds, byId]);

  const formationValid =
    positionTally.GK === 1 &&
    positionTally.DEF === counts.DEF &&
    positionTally.MID === counts.MID &&
    positionTally.FWD === counts.FWD;

  // === Actions ===

  const swap = useCallback(
    (otherId: number) => {
      if (!swapTarget) return;
      setError(null);
      setSaved(false);
      const a = swapTarget.playerId;
      const b = otherId;
      const aPos = byId.get(a)?.position;
      const bPos = byId.get(b)?.position;
      if (aPos !== bPos) {
        setError("You can only swap players in the same position. Use the formation selector to rebalance.");
        setSwapTarget(null);
        return;
      }
      setStarterIds((prev) => prev.map((id) => (id === a ? b : id === b ? a : id)));
      setBenchIds((prev) => prev.map((id) => (id === a ? b : id === b ? a : id)));
      // Captain / vice cleared if the player they belonged to just got benched.
      if (captainId === a && !starterIds.includes(b)) setCaptainId(null);
      if (viceId === a && !starterIds.includes(b)) setViceId(null);
      setSwapTarget(null);
    },
    [swapTarget, byId, captainId, viceId, starterIds, benchIds],
  );

  const handleSlotTap = useCallback(
    (slotId: string) => {
      if (locked) return;
      const id = slotMap[slotId];
      if (id == null) return;
      setSwapTarget({ kind: "starter", playerId: id });
    },
    [locked, slotMap],
  );

  const setCaptain = (id: number) => {
    if (locked) return;
    setSaved(false);
    if (id === viceId) setViceId(captainId);
    setCaptainId(id);
  };
  const setVice = (id: number) => {
    if (locked) return;
    setSaved(false);
    if (id === captainId) setCaptainId(viceId);
    setViceId(id);
  };

  const handleFormationChange = (next: Formation) => {
    if (locked) return;
    setSaved(false);
    setError(null);
    const wanted = FORMATION_COUNTS[next];
    const all = roster.slice();
    const pickByPos = (pos: "GK" | "DEF" | "MID" | "FWD", n: number) => {
      const inPos = all
        .filter((p) => p.position === pos)
        .sort((a, b) => {
          // current starters first, then by points
          const aStart = starterIds.includes(a.id) ? 1 : 0;
          const bStart = starterIds.includes(b.id) ? 1 : 0;
          if (aStart !== bStart) return bStart - aStart;
          return b.total_points - a.total_points;
        });
      return inPos.slice(0, n).map((p) => p.id);
    };
    const next11 = [
      ...pickByPos("GK", 1),
      ...pickByPos("DEF", wanted.DEF),
      ...pickByPos("MID", wanted.MID),
      ...pickByPos("FWD", wanted.FWD),
    ];
    if (next11.length < 11) {
      setError(
        `Roster doesn't have enough players for ${next}. Draft or trade for more before switching.`,
      );
      return;
    }
    const startSet = new Set(next11);
    const benchNext = roster.filter((p) => !startSet.has(p.id)).map((p) => p.id);
    setFormation(next);
    setStarterIds(next11);
    setBenchIds(benchNext);
    if (captainId && !startSet.has(captainId)) setCaptainId(null);
    if (viceId && !startSet.has(viceId)) setViceId(null);
  };

  async function handleSave() {
    if (locked) return;
    setError(null);
    setSaved(false);
    if (!formationValid) {
      setError("Lineup doesn't match the selected formation.");
      return;
    }
    const starters = Object.entries(slotMap)
      .filter(([, id]) => id != null)
      .map(([slot, id]) => ({ slot, player_id: id! }));
    if (starters.length !== 11) {
      setError("Need exactly 11 players on the pitch.");
      return;
    }
    const bench = benchIds.map((id, i) => ({ order: i, player_id: id }));
    startTransition(async () => {
      try {
        const res = await fetch(`/api/lineups/${teamId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            formation,
            starters,
            bench,
            captain_player_id: captainId,
            vice_player_id: viceId,
            chip,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data?.error ?? `Save failed (${res.status})`);
          return;
        }
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  // === Render ===

  const swapCandidates = useMemo(() => {
    if (!swapTarget) return [] as EditorPlayer[];
    const target = byId.get(swapTarget.playerId);
    if (!target) return [];
    const pool = swapTarget.kind === "starter" ? benchIds : starterIds;
    return pool
      .map((id) => byId.get(id))
      .filter((p): p is EditorPlayer => !!p && p.position === target.position);
  }, [swapTarget, byId, benchIds, starterIds]);

  const benchPlayers = benchIds.map((id) => byId.get(id)).filter((p): p is EditorPlayer => !!p);

  return (
    <div className="space-y-4">
      {/* Top control strip */}
      <GlassCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
            GW {gameweek}
          </span>
          <span
            className={cn(
              "text-[11px] font-medium",
              locked ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]",
            )}
          >
            · {deadlineLabel}
          </span>
          {locked ? (
            <GlassBadge variant="danger" className="ml-2 text-[10px]">
              Locked
            </GlassBadge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
            Formation
          </label>
          <select
            value={formation}
            onChange={(e) => handleFormationChange(e.target.value as Formation)}
            disabled={locked}
            className="rounded-md border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-2 py-1 font-broadcast text-sm tracking-wider text-[var(--color-text-primary)] disabled:opacity-60"
          >
            {FORMATIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <label className="ml-2 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
            Chip
          </label>
          <select
            value={chip ?? ""}
            onChange={(e) => {
              setSaved(false);
              setChip((e.target.value || null) as (typeof CHIPS)[number] | null);
            }}
            disabled={locked}
            className="rounded-md border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-2 py-1 text-sm capitalize text-[var(--color-text-primary)] disabled:opacity-60"
          >
            <option value="">None</option>
            {CHIPS.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={handleSave}
            disabled={locked || pending}
            className="ml-auto sm:ml-2"
          >
            {pending ? "Saving…" : saved ? "Saved ✓" : "Save lineup"}
          </Button>
        </div>
      </GlassCard>

      {error ? (
        <GlassCard className="border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-text-primary)]">
          {error}
        </GlassCard>
      ) : null}

      {/* Pitch */}
      <GlassCard className="p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Tap any player to swap with bench
          </p>
          <span className="font-broadcast text-[11px] tracking-wider text-[var(--color-text-muted)]">
            {positionTally.GK}-{positionTally.DEF}-{positionTally.MID}-{positionTally.FWD}
          </span>
        </div>
        <PitchVisualizer
          starters={startersOnPitch}
          formation={formation}
          onSlotTap={locked ? undefined : handleSlotTap}
        />
      </GlassCard>

      {/* Bench drawer */}
      <GlassCard className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Bench
            </p>
            <h3 className="font-display text-base font-semibold text-[var(--color-text-primary)]">
              {benchPlayers.length} reserves
            </h3>
          </div>
          <p className="hidden text-[11px] text-[var(--color-text-muted)] sm:block">
            Bench order is auto-sub priority on matchday
          </p>
        </div>
        {benchPlayers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-glass-border)] p-4 text-center text-sm text-[var(--color-text-muted)]">
            No bench players. Your full roster is on the pitch.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {benchPlayers.map((p) => {
              const isOpen = swapTarget?.kind === "bench" && swapTarget.playerId === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() =>
                      locked
                        ? null
                        : setSwapTarget(isOpen ? null : { kind: "bench", playerId: p.id })
                    }
                    className={cn(
                      "hover-surface group flex w-full items-center gap-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] p-3 text-left transition-colors",
                      isOpen && "border-[var(--color-accent)]/60 ring-1 ring-[var(--color-accent)]/40",
                      locked && "cursor-not-allowed opacity-60",
                    )}
                    aria-pressed={isOpen}
                  >
                    <JerseyToken
                      club={p.club_short ?? p.club}
                      name={p.name.split(/\s+/).slice(-1)[0]}
                      number={p.shirt_number}
                      isGoalkeeper={p.position === "GK"}
                      state={p.injury_status === "injured" ? "injured" : "bench"}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold text-[var(--color-text-primary)]">
                        {p.name}
                      </p>
                      <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                        {p.club_short ?? p.club} · {p.position}
                      </p>
                    </div>
                    <span className="font-broadcast text-sm text-[var(--color-text-primary)]">
                      {p.total_points}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>

      {/* Captain / Vice list (starters only) */}
      <GlassCard className="p-4 sm:p-5">
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Captain & vice
          </p>
          <h3 className="font-display text-base font-semibold text-[var(--color-text-primary)]">
            Captain scores 2× points (3× with Triple Captain chip)
          </h3>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {starterIds
            .map((id) => byId.get(id))
            .filter((p): p is EditorPlayer => !!p)
            .map((p) => {
              const isC = captainId === p.id;
              const isV = viceId === p.id;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] p-3"
                >
                  <JerseyToken
                    club={p.club_short ?? p.club}
                    name={p.name.split(/\s+/).slice(-1)[0]}
                    number={p.shirt_number}
                    isGoalkeeper={p.position === "GK"}
                    state={isC ? "captain" : isV ? "vice" : "default"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-[var(--color-text-primary)]">
                      {p.name}
                    </p>
                    <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                      {p.club_short ?? p.club} · {p.position}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setCaptain(p.id)}
                      disabled={locked}
                      className={cn(
                        "tap-target rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
                        isC
                          ? "bg-[var(--color-accent)] text-black"
                          : "border border-[var(--color-glass-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
                        locked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      C
                    </button>
                    <button
                      type="button"
                      onClick={() => setVice(p.id)}
                      disabled={locked}
                      className={cn(
                        "tap-target rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
                        isV
                          ? "bg-[var(--color-accent-2)] text-black"
                          : "border border-[var(--color-glass-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
                        locked && "cursor-not-allowed opacity-60",
                      )}
                    >
                      V
                    </button>
                  </div>
                </li>
              );
            })}
        </ul>
      </GlassCard>

      {/* Swap modal */}
      <AnimatePresence>
        {swapTarget ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-md sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSwapTarget(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              initial={reduce ? undefined : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? undefined : { y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="w-full max-w-md rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] p-4 backdrop-blur-2xl shadow-2xl"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  Swap{" "}
                  {byId.get(swapTarget.playerId)?.position}{" "}
                  · {swapTarget.kind === "starter" ? "starter" : "bench"}
                </p>
                <button
                  type="button"
                  onClick={() => setSwapTarget(null)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  ✕
                </button>
              </div>
              <p className="mb-3 font-display text-base font-semibold text-[var(--color-text-primary)]">
                {byId.get(swapTarget.playerId)?.name}
              </p>
              {swapCandidates.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--color-glass-border)] p-4 text-center text-sm text-[var(--color-text-muted)]">
                  No same-position swap targets available. Try a different formation to rebalance positions.
                </p>
              ) : (
                <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
                  {swapCandidates.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => swap(p.id)}
                        className="hover-surface flex w-full items-center gap-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] p-3 text-left"
                      >
                        <JerseyToken
                          club={p.club_short ?? p.club}
                          name={p.name.split(/\s+/).slice(-1)[0]}
                          number={p.shirt_number}
                          isGoalkeeper={p.position === "GK"}
                          state={p.injury_status === "injured" ? "injured" : "default"}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-semibold text-[var(--color-text-primary)]">
                            {p.name}
                          </p>
                          <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                            {p.club_short ?? p.club} · {p.position}
                          </p>
                        </div>
                        <span className="font-broadcast text-sm text-[var(--color-text-primary)]">
                          {p.total_points}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
