"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  leagueId: string;
  leagueName: string;
};

export function LeagueDangerZone({ leagueId, leagueName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const matches = confirmName.trim().toLowerCase() === leagueName.trim().toLowerCase();

  function remove() {
    if (!matches) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/league/${leagueId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "Could not delete league");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <GlassCard className="border border-[var(--color-accent-danger)]/25 p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-danger)]">
        Danger zone
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold text-[var(--color-text-primary)]">
        Delete league
      </h2>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Permanently removes this league, all teams, draft history, trades, and waiver claims.
        This cannot be undone.
      </p>

      {!open ? (
        <Button
          type="button"
          variant="outline"
          className="tap-target mt-4 gap-2 border-[var(--color-accent-danger)]/40 text-[var(--color-accent-danger)] hover:bg-[var(--color-accent-danger)]/10"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="size-4" /> Delete league
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="confirmLeagueName">
              Type <span className="font-semibold text-[var(--color-text-primary)]">{leagueName}</span> to confirm
            </Label>
            <Input
              id="confirmLeagueName"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="h-11"
              autoComplete="off"
              placeholder={leagueName}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="tap-target border-[var(--color-glass-border)]"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setConfirmName("");
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="tap-target gap-2 bg-[var(--color-accent-danger)] text-white hover:bg-[var(--color-accent-danger)]/90"
              disabled={pending || !matches}
              onClick={remove}
            >
              <Trash2 className="size-4" />
              {pending ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-3 text-sm text-[var(--color-accent-danger)]">{error}</p>
      ) : null}
    </GlassCard>
  );
}
