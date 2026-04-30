"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  inviteCode: z.string().min(4).max(16),
  teamName: z.string().min(2).max(80),
});

type Form = z.infer<typeof schema>;

export default function JoinLeaguePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { inviteCode: "", teamName: "" },
  });

  async function onSubmit(values: Form) {
    setError(null);
    const res = await fetch("/api/league/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      setError(json.error ?? "Could not join");
      return;
    }
    const leagueId = json.data?.league?.id;
    if (leagueId) router.push(`/league/${leagueId}`);
    else router.push("/dashboard");
    router.refresh();
  }

  return (
    <GlassCard className="max-w-lg p-6">
      <h1 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
        Join with invite code
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Paste the code your commissioner shared — it is case-insensitive.
      </p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="inviteCode">Invite code</Label>
          <Input id="inviteCode" autoComplete="off" {...form.register("inviteCode")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="teamName">Your team name</Label>
          <Input id="teamName" {...form.register("teamName")} />
        </div>
        {error ? (
          <p className="text-sm text-[var(--color-accent-danger)]">{error}</p>
        ) : null}
        <Button type="submit" className="w-full">
          Join league
        </Button>
      </form>
    </GlassCard>
  );
}
