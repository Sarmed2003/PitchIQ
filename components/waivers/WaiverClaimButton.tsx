"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

export type ClaimableTeam = {
  id: string;
  team_name: string;
  league_name: string;
  league_id: string;
  waiver_type: string;
  roster: Array<{
    player_id: number;
    name: string;
    position: string | null;
  }>;
};

type Props = {
  player: { id: number; name: string; position: string | null };
  teams: ClaimableTeam[];
  /** Whether this player is already on a roster in any of the user's leagues. */
  alreadyRostered: boolean;
};

export function WaiverClaimButton({ player, teams, alreadyRostered }: Props) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [dropId, setDropId] = useState<number | "">("");
  const [priority, setPriority] = useState(1);
  const [bid, setBid] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const team = teams.find((t) => t.id === teamId);
  const isFaab = team?.waiver_type === "faab";
  const samePosRoster = team
    ? team.roster.filter((r) => !player.position || r.position === player.position)
    : [];

  if (alreadyRostered) {
    return (
      <Button variant="outline" disabled>
        Already on a roster
      </Button>
    );
  }
  if (teams.length === 0) {
    return (
      <Button variant="outline" disabled>
        Join a league to claim
      </Button>
    );
  }

  async function submit() {
    setError(null);
    if (!teamId) {
      setError("Pick a team first.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/waivers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          team_id: teamId,
          add_player_id: player.id,
          drop_player_id: dropId || null,
          priority,
          faab_bid: isFaab ? bid : 0,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data?.error ?? `Failed (${res.status})`);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Claim on waivers</Button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-md sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              initial={reduce ? undefined : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? undefined : { y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-surface)]/95 p-5 shadow-2xl backdrop-blur-2xl"
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  Waiver claim
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold text-[var(--color-text-primary)]">
                  Add {player.name}
                </h3>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  Team
                </label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full rounded-md border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.team_name} · {t.league_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  Drop (optional — same position recommended)
                </label>
                <select
                  value={dropId}
                  onChange={(e) =>
                    setDropId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full rounded-md border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                >
                  <option value="">No drop (will fail if roster is full)</option>
                  {samePosRoster.map((r) => (
                    <option key={r.player_id} value={r.player_id}>
                      {r.name} ({r.position ?? "?"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                    Priority
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) || 1)}
                    className="w-full rounded-md border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  />
                </div>
                {isFaab ? (
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                      FAAB bid
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={bid}
                      onChange={(e) => setBid(Number(e.target.value) || 0)}
                      className="w-full rounded-md border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
                    />
                  </div>
                ) : null}
              </div>

              {error ? (
                <p className="rounded-lg border border-[var(--color-accent-danger)]/40 bg-[var(--color-accent-danger)]/10 p-2 text-sm text-[var(--color-text-primary)]">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={pending}>
                  {pending ? "Submitting…" : "Submit claim"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
