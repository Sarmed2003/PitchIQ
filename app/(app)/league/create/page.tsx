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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(2).max(80),
  teamName: z.string().min(2).max(80),
  maxTeams: z.number().min(2).max(20),
  draftType: z.enum(["snake", "auction"]),
  draftMode: z.enum(["live", "async"]),
});

type Form = z.infer<typeof schema>;

export default function CreateLeaguePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      teamName: "",
      maxTeams: 10,
      draftType: "snake",
      draftMode: "live",
    },
  });

  async function onSubmit(values: Form) {
    setError(null);
    const res = await fetch("/api/league", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      setError(json.error ?? "Could not create league");
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
        Create a league
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        You will be commissioner and your squad is created automatically.
      </p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">League name</Label>
          <Input id="name" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="teamName">Your team name</Label>
          <Input id="teamName" {...form.register("teamName")} />
        </div>
        <div className="space-y-2">
          <Label>Max teams</Label>
          <Input
            type="number"
            min={2}
            max={20}
            {...form.register("maxTeams", { valueAsNumber: true })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Draft type</Label>
            <Select
              value={form.watch("draftType")}
              onValueChange={(v) => {
                if (v === "snake" || v === "auction") form.setValue("draftType", v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="snake">Snake</SelectItem>
                <SelectItem value="auction">Auction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select
              value={form.watch("draftMode")}
              onValueChange={(v) => {
                if (v === "live" || v === "async") form.setValue("draftMode", v);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="async">Async</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error ? (
          <p className="text-sm text-[var(--color-accent-danger)]">{error}</p>
        ) : null}
        <Button type="submit" className="w-full">
          Create league
        </Button>
      </form>
    </GlassCard>
  );
}
