"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api-response";

type ScoresPayload = {
  matches: Array<{
    home: string;
    away: string;
    homeScore: number;
    awayScore: number;
    minute: number;
    live: boolean;
  }>;
  updatedAt: string;
};

export function LiveScoreBar() {
  const { data } = useQuery({
    queryKey: ["live-scores"],
    queryFn: async () => {
      const res = await fetch("/api/scores");
      const json = (await res.json()) as ApiResponse<ScoresPayload>;
      if (!json.data) throw new Error(json.error ?? "scores");
      return json.data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (!data?.matches?.length) return null;

  const liveCount = data.matches.filter((m) => m.live).length;
  const items = [...data.matches, ...data.matches];

  return (
    <div className="relative h-10 shrink-0 overflow-hidden border-b border-[var(--color-glass-border)]/80 bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] backdrop-blur">
      <div className="absolute inset-y-0 left-0 z-10 flex items-center gap-2 bg-[var(--color-pitch)] px-3 text-[10px] uppercase tracking-[0.2em]">
        <span className={liveCount > 0 ? "pulse-live text-[var(--color-accent-2)]" : "text-[var(--color-text-muted)]"}>
          {liveCount > 0 ? "Live" : "Today"}
        </span>
      </div>
      <div
        className="ticker-track absolute inset-y-0 left-20 flex items-center font-broadcast text-xs text-[var(--color-text-primary)]"
        aria-hidden
      >
        {items.map((m, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="opacity-90">{m.home}</span>
            <span className="rounded bg-[var(--color-glass)] px-1.5 py-0.5 font-mono text-[11px] tracking-tight text-[var(--color-text-primary)]">
              {m.homeScore}
              <span className="px-1 text-[var(--color-text-hint)]">·</span>
              {m.awayScore}
            </span>
            <span className="opacity-90">{m.away}</span>
            {m.live ? (
              <span className="ml-1 rounded-sm bg-[var(--color-accent-2)]/15 px-1 text-[10px] font-semibold text-[var(--color-accent-2)]">
                {m.minute}&apos;
              </span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
