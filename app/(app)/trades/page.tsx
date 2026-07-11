"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Check, X, Ban } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/lib/api-response";

type TradeRow = {
  id: string;
  status: string;
  proposing_team_id: string | null;
  receiving_team_id: string | null;
  created_at?: string;
  expires_at?: string;
};

const STATUS_VARIANT: Record<string, "default" | "accent" | "warn" | "danger"> = {
  pending: "warn",
  accepted: "accent",
  rejected: "danger",
  cancelled: "default",
  vetoed: "danger",
};

export default function TradesPage() {
  const qc = useQueryClient();

  const { data: trades, isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      const res = await fetch("/api/trade", { credentials: "include" });
      const json = (await res.json()) as ApiResponse<TradeRow[]>;
      if (!res.ok || json.error) throw new Error(json.error ?? "load");
      return json.data ?? [];
    },
  });

  const { data: myTeamIds = [] } = useQuery({
    queryKey: ["my-team-ids"],
    queryFn: async () => {
      const res = await fetch("/api/league", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || json.error) return [] as string[];
      const rows = (json.data ?? []) as Array<{ id: string }>;
      return rows.map((r) => r.id);
    },
  });

  const cancel = useMutation({
    mutationFn: async (tradeId: string) => {
      const res = await fetch(`/api/trade/${tradeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "cancel");
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trades"] }),
  });

  const respond = useMutation({
    mutationFn: async (opts: { tradeId: string; accept: boolean }) => {
      const res = await fetch("/api/trade/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(opts),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "respond");
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trades"] }),
  });

  const pending = (trades ?? []).filter((t) => t.status === "pending");
  const past = (trades ?? []).filter((t) => t.status !== "pending");

  return (
    <div className="space-y-4 lg:space-y-6">
      <GlassCard className="relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent" />
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Transfer market
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Trade hub
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Offers you send and receive land here. AI grading ships in the next phase.
        </p>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Pending
            </p>
            <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
              On your desk
            </h2>
          </div>
          {pending.length > 0 ? (
            <span className="rounded-full bg-[var(--color-accent-warn)]/14 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--color-accent-warn)]">
              {pending.length} awaiting
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-4 grid gap-2">
            <div className="h-14 animate-pulse rounded-xl bg-[var(--color-glass)]" />
            <div className="h-14 animate-pulse rounded-xl bg-[var(--color-glass)]" />
          </div>
        ) : pending.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--color-glass-border)] p-6 text-center">
            <ArrowLeftRight className="mx-auto size-5 text-[var(--color-text-muted)]" />
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              No pending trades. Open a teammate&apos;s squad to start a deal.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {pending.map((t) => {
              const isProposer =
                t.proposing_team_id != null && myTeamIds.includes(t.proposing_team_id);
              const isReceiver =
                t.receiving_team_id != null && myTeamIds.includes(t.receiving_team_id);
              return (
              <li
                key={t.id}
                className="hover-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-[var(--color-text-primary)]">
                    Trade <span className="font-mono text-[var(--color-accent)]">{t.id.slice(0, 8)}</span>
                    {isProposer ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                        · You sent
                      </span>
                    ) : isReceiver ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-[var(--color-accent-2)]">
                        · Incoming
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {t.expires_at
                      ? `Expires ${new Date(t.expires_at).toLocaleDateString()}`
                      : "Awaiting response"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isProposer ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={cancel.isPending}
                      onClick={() => cancel.mutate(t.id)}
                      className="tap-target gap-1 border-[var(--color-glass-border)]"
                    >
                      <Ban className="size-3.5" /> Cancel
                    </Button>
                  ) : isReceiver ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={respond.isPending}
                        onClick={() => respond.mutate({ tradeId: t.id, accept: false })}
                        className="tap-target gap-1 border-[var(--color-glass-border)]"
                      >
                        <X className="size-3.5" /> Decline
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={respond.isPending}
                        onClick={() => respond.mutate({ tradeId: t.id, accept: true })}
                        className="tap-target gap-1"
                      >
                        <Check className="size-3.5" /> Accept
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          History
        </p>
        <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
          Past trades
        </h2>
        {past.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">No deals yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-glass-border)]">
            {past.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-mono text-[var(--color-text-muted)]">{t.id.slice(0, 8)}</span>
                <GlassBadge variant={STATUS_VARIANT[t.status] ?? "default"} className={cn("text-[10px] uppercase")}>
                  {t.status}
                </GlassBadge>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
