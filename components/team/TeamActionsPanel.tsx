"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  teamId: string;
  teamName: string;
  leagueId: string;
  isOwner: boolean;
  isCommissioner: boolean;
};

export function TeamActionsPanel({
  teamId,
  teamName,
  leagueId,
  isOwner,
  isCommissioner,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(teamName);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwner && !isCommissioner) return null;

  function rename() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/team/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teamName: nameDraft.trim() }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "Could not rename");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/team/${teamId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "Could not delete");
        return;
      }
      router.push(isOwner ? "/dashboard" : `/league/${leagueId}`);
      router.refresh();
    });
  }

  return (
    <GlassCard className="border border-[var(--color-accent-danger)]/20 p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        Squad management
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold text-[var(--color-text-primary)]">
        {isOwner ? "Your team" : "Manager controls"}
      </h2>

      {isOwner ? (
        <div className="mt-4 space-y-3">
          {editing ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="teamName">Team name</Label>
                <Input
                  id="teamName"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="h-11"
                  maxLength={80}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="tap-target border-[var(--color-glass-border)]"
                  disabled={pending}
                  onClick={() => {
                    setEditing(false);
                    setNameDraft(teamName);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="tap-target gap-1"
                  disabled={pending || nameDraft.trim().length < 2}
                  onClick={rename}
                >
                  <Pencil className="size-3.5" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="tap-target gap-2 border-[var(--color-glass-border)]"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-4" /> Rename team
            </Button>
          )}
        </div>
      ) : null}

      <div className={cn("mt-4 border-t border-[var(--color-glass-border)] pt-4")}>
        {!confirmDelete ? (
          <Button
            type="button"
            variant="outline"
            className="tap-target gap-2 border-[var(--color-accent-danger)]/40 text-[var(--color-accent-danger)] hover:bg-[var(--color-accent-danger)]/10"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" />
            {isOwner ? "Leave league / delete team" : "Remove manager from league"}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              {isOwner
                ? "This removes your squad and roster from the league. You can rejoin with the invite code if seats remain."
                : "This removes this manager's squad from your league."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="tap-target border-[var(--color-glass-border)]"
                disabled={pending}
                onClick={() => setConfirmDelete(false)}
              >
                Keep team
              </Button>
              <Button
                type="button"
                className="tap-target gap-2 bg-[var(--color-accent-danger)] text-white hover:bg-[var(--color-accent-danger)]/90"
                disabled={pending}
                onClick={remove}
              >
                <Trash2 className="size-4" />
                {pending ? "Deleting…" : "Confirm delete"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-[var(--color-accent-danger)]">{error}</p>
      ) : null}
    </GlassCard>
  );
}
