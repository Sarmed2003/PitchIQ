"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  leagueId: string;
  maxTeams: number;
  rosterSize: number;
  tradeDeadline: string | null;
  waiverType: string;
  scoring: Record<string, number | undefined>;
};

const SCORING_KEYS: Array<{ key: string; label: string; group: "appearance" | "attack" | "defense" | "discipline" | "bonus" }> = [
  { key: "played_any", label: "Played < 60'", group: "appearance" },
  { key: "played_60", label: "Played 60+", group: "appearance" },
  { key: "goal_gk", label: "Goal — GK", group: "attack" },
  { key: "goal_def", label: "Goal — DEF", group: "attack" },
  { key: "goal_mid", label: "Goal — MID", group: "attack" },
  { key: "goal_fwd", label: "Goal — FWD", group: "attack" },
  { key: "assist", label: "Assist", group: "attack" },
  { key: "clean_sheet_gk", label: "Clean sheet — GK", group: "defense" },
  { key: "clean_sheet_def", label: "Clean sheet — DEF", group: "defense" },
  { key: "clean_sheet_mid", label: "Clean sheet — MID", group: "defense" },
  { key: "save_points_per", label: "Saves per point", group: "defense" },
  { key: "yellow_card", label: "Yellow card", group: "discipline" },
  { key: "red_card", label: "Red card", group: "discipline" },
  { key: "own_goal", label: "Own goal", group: "discipline" },
  { key: "penalty_miss", label: "Penalty miss", group: "discipline" },
  { key: "penalty_save", label: "Penalty save", group: "bonus" },
  { key: "bonus_max", label: "Bonus cap", group: "bonus" },
];

const GROUP_LABELS: Record<string, string> = {
  appearance: "Appearance",
  attack: "Attack",
  defense: "Defense",
  discipline: "Discipline",
  bonus: "Bonus",
};

export function LeagueSettingsForm({
  leagueId,
  maxTeams,
  rosterSize,
  tradeDeadline,
  waiverType,
  scoring,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scoringDraft, setScoringDraft] = useState<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const k of SCORING_KEYS) {
      const v = scoring[k.key];
      out[k.key] = typeof v === "number" ? v : 0;
    }
    return out;
  });
  const [maxTeamsDraft, setMaxTeamsDraft] = useState<number>(maxTeams);
  const [rosterSizeDraft, setRosterSizeDraft] = useState<number>(rosterSize);
  const [waiverDraft, setWaiverDraft] = useState<string>(waiverType ?? "reverse_standings");
  const [deadlineDraft, setDeadlineDraft] = useState<string>(
    tradeDeadline ? new Date(tradeDeadline).toISOString().slice(0, 16) : "",
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = SCORING_KEYS.reduce<Record<string, typeof SCORING_KEYS>>((acc, k) => {
    (acc[k.group] ??= []).push(k);
    return acc;
  }, {});

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await fetch(`/api/league/${leagueId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          maxTeams: maxTeamsDraft,
          rosterSize: rosterSizeDraft,
          waiverType: waiverDraft,
          tradeDeadline: deadlineDraft ? new Date(deadlineDraft).toISOString() : null,
          scoringSystem: scoringDraft,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "Could not save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      router.refresh();
    });
  }

  return (
    <GlassCard className="relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent" />
      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
        Configuration
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold text-[var(--color-text-primary)]">
        Rules & scoring
      </h2>
      <form onSubmit={onSave} className="mt-5 space-y-6">
        {/* Structure */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="maxTeams">Max managers</Label>
            <Input
              id="maxTeams"
              type="number"
              min={2}
              max={20}
              value={maxTeamsDraft}
              onChange={(e) => setMaxTeamsDraft(Number(e.target.value))}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rosterSize">Roster size</Label>
            <Input
              id="rosterSize"
              type="number"
              min={11}
              max={25}
              value={rosterSizeDraft}
              onChange={(e) => setRosterSizeDraft(Number(e.target.value))}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="waiverType">Waivers</Label>
            <select
              id="waiverType"
              value={waiverDraft}
              onChange={(e) => setWaiverDraft(e.target.value)}
              className="h-11 w-full rounded-lg border border-[var(--color-glass-border)] bg-transparent px-2.5 text-sm text-[var(--color-text-primary)] outline-none focus-visible:border-[var(--color-accent)]"
            >
              <option value="reverse_standings">Reverse standings</option>
              <option value="faab">FAAB ($100)</option>
              <option value="rolling">Rolling priority</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deadline">Trade deadline</Label>
          <Input
            id="deadline"
            type="datetime-local"
            value={deadlineDraft}
            onChange={(e) => setDeadlineDraft(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="luxury-divider" aria-hidden />

        {/* Scoring */}
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Scoring
              </p>
              <h3 className="font-display text-base font-semibold text-[var(--color-text-primary)]">
                Tune the points engine
              </h3>
            </div>
            <span className="text-[10px] text-[var(--color-text-hint)]">
              Edit any rule. Saved per league.
            </span>
          </div>

          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {GROUP_LABELS[group] ?? group}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((it) => (
                  <label
                    key={it.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 py-2"
                  >
                    <span className="text-xs text-[var(--color-text-muted)]">{it.label}</span>
                    <Input
                      type="number"
                      step={1}
                      value={scoringDraft[it.key] ?? 0}
                      onChange={(e) =>
                        setScoringDraft((prev) => ({
                          ...prev,
                          [it.key]: Number(e.target.value),
                        }))
                      }
                      className="h-8 w-20 text-right font-mono"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <p className="text-sm text-[var(--color-accent-danger)]">{error}</p>
        ) : null}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending} className="tap-target h-11 gap-2">
            <Save className="size-4" />
            {pending ? "Saving…" : "Save settings"}
          </Button>
          {saved ? (
            <span className={cn("flex items-center gap-1 text-xs text-[var(--color-accent-2)]")}>
              <Check className="size-3.5" /> Saved
            </span>
          ) : null}
        </div>
      </form>
    </GlassCard>
  );
}
