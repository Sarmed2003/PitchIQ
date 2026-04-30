"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type State =
  | { kind: "idle" }
  | { kind: "syncing" }
  | { kind: "ok"; count: number; provider: string }
  | { kind: "error"; message: string };

export function SyncPlayersButton({ className }: { className?: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const reduce = useReducedMotion();

  async function run() {
    setState({ kind: "syncing" });
    try {
      const res = await fetch("/api/sync/players", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setState({ kind: "error", message: json.error ?? "Sync failed" });
        return;
      }
      setState({
        kind: "ok",
        count: json.data?.upserted ?? 0,
        provider: json.data?.provider ?? "provider",
      });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Sync failed",
      });
    }
  }

  const busy = state.kind === "syncing";

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        onClick={run}
        disabled={busy}
        className="tap-target h-11 w-full gap-2"
      >
        <motion.span
          animate={busy && !reduce ? { rotate: 360 } : { rotate: 0 }}
          transition={busy ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0 }}
        >
          <RefreshCw className="size-4" />
        </motion.span>
        {busy ? "Syncing player pool…" : "Sync players now"}
      </Button>

      {state.kind === "ok" ? (
        <p className="flex items-center gap-2 text-xs text-[var(--color-accent-2)]">
          <Check className="size-3.5" /> Synced {state.count} players via {state.provider}.
        </p>
      ) : null}
      {state.kind === "error" ? (
        <p className="flex items-start gap-2 text-xs text-[var(--color-accent-danger)]">
          <AlertCircle className="size-3.5 shrink-0" /> {state.message}
        </p>
      ) : null}
    </div>
  );
}
