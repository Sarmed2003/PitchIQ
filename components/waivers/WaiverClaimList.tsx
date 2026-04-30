"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { JerseyToken } from "@/components/players/JerseyToken";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WaiverClaimRow = {
  id: string;
  status: "pending" | "won" | "lost" | "cancelled" | "failed";
  priority: number;
  faab_bid: number;
  add_player: {
    id: number;
    name: string;
    club: string | null;
    club_short: string | null;
    position: string | null;
    shirt_number: number | null;
  } | null;
  drop_player: {
    id: number;
    name: string;
    club: string | null;
    club_short: string | null;
    position: string | null;
    shirt_number: number | null;
  } | null;
  created_at: string;
  processed_at: string | null;
  failure_reason: string | null;
};

const STATUS_LABELS: Record<WaiverClaimRow["status"], { label: string; tone: "default" | "accent" | "danger" | "success" }> = {
  pending: { label: "Pending", tone: "accent" },
  won: { label: "Won", tone: "success" },
  lost: { label: "Lost", tone: "default" },
  cancelled: { label: "Cancelled", tone: "default" },
  failed: { label: "Failed", tone: "danger" },
};

export function WaiverClaimList({ claims, isFaab }: { claims: WaiverClaimRow[]; isFaab: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const cancel = (id: string) =>
    startTransition(async () => {
      const res = await fetch(`/api/waivers/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    });

  if (claims.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-glass-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
        No waiver claims yet — head to the players page to file one.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {claims.map((c) => {
          const status = STATUS_LABELS[c.status] ?? STATUS_LABELS.pending;
          return (
            <motion.li
              key={c.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] p-3 sm:flex-row sm:items-center",
              )}
            >
              <div className="flex flex-1 items-center gap-3">
                {c.add_player ? (
                  <JerseyToken
                    club={c.add_player.club_short ?? c.add_player.club}
                    name={c.add_player.name.split(/\s+/).slice(-1)[0]}
                    number={c.add_player.shirt_number}
                    isGoalkeeper={c.add_player.position === "GK"}
                    size="sm"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-[var(--color-text-primary)]">
                    Add {c.add_player?.name ?? "?"}
                  </p>
                  <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                    {c.drop_player ? `Drop ${c.drop_player.name}` : "No drop selected"}
                    {" · "}Priority {c.priority}
                    {isFaab ? ` · Bid $${c.faab_bid}` : null}
                  </p>
                  {c.failure_reason ? (
                    <p className="mt-0.5 text-[10px] text-[var(--color-danger)]">
                      {c.failure_reason}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-shrink-0">
                <GlassBadge variant={status.tone === "success" ? "accent" : status.tone === "danger" ? "danger" : status.tone === "accent" ? "accent" : "default"} className="text-[10px]">
                  {status.label}
                </GlassBadge>
                {c.status === "pending" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => cancel(c.id)}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
