"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type JoinFormProps = {
  inviteCode: string;
  leagueName: string;
};

export function JoinForm({ inviteCode, leagueName }: JoinFormProps) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) {
      setError("Please enter a team name");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/league/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode, teamName: teamName.trim() }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? "Could not join");
        setBusy(false);
        return;
      }
      const leagueId = json.data?.league?.id;
      if (leagueId) router.push(`/league/${leagueId}`);
      else router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="teamName" className="text-[var(--color-text-muted)]">
          Team name
        </Label>
        <Input
          id="teamName"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder={`Your squad in ${leagueName}`}
          autoComplete="off"
          autoFocus
          className="h-11"
          maxLength={80}
        />
      </div>
      {error ? (
        <p className="text-sm text-[var(--color-accent-danger)]">{error}</p>
      ) : null}
      <Button type="submit" disabled={busy} className="tap-target h-11 w-full">
        {busy ? "Joining…" : `Accept invitation`}
      </Button>
      <p className="text-center text-[11px] text-[var(--color-text-hint)]">
        Code <span className="font-mono text-[var(--color-text-muted)]">{inviteCode.toUpperCase()}</span>
      </p>
    </form>
  );
}
