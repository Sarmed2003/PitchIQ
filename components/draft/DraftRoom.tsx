"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Star, X } from "lucide-react";
import { useDraftRoom } from "@/hooks/useDraftRoom";
import { useDraftPresence } from "@/hooks/useDraftPresence";
import { useTurnAlert } from "@/hooks/useTurnAlert";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PickClock } from "@/components/draft/PickClock";
import { DraftAssistantPlaceholder } from "@/components/draft/DraftAssistantPlaceholder";
import { teamIdForPick, buildRoundOneOrder } from "@/lib/draft/engine";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { JerseyToken } from "@/components/players/JerseyToken";
import {
  addToQueue,
  getQueue,
  isQueued,
  moveInQueue,
  removeFromQueue,
} from "@/lib/draft/queue";

type PlayerRow = {
  id: number;
  name: string;
  club: string;
  club_short?: string | null;
  position: string | null;
  form: string;
  total_points: number;
  shirt_number: number | null;
};

export function DraftRoom({ leagueId }: { leagueId: string }) {
  const { data, loading, error, refresh } = useDraftRoom(leagueId);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [filter, setFilter] = useState("");
  const [picking, setPicking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [queueIds, setQueueIds] = useState<number[]>([]);

  useEffect(() => {
    createBrowserSupabaseClient()
      .auth.getUser()
      .then(({ data: u }) => {
        setUserId(u.user?.id ?? null);
        setDisplayName(
          (u.user?.user_metadata?.display_name as string | undefined) ?? u.user?.email ?? null,
        );
      });
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/players?page=1&limit=500", { credentials: "include" });
      const json = await res.json();
      const items = json.data?.items as PlayerRow[] | undefined;
      if (items) setPlayers(items);
    })();
  }, []);

  const teams = useMemo(() => data?.teams ?? [], [data]);
  const picks = useMemo(
    () =>
      (data?.picks ?? []) as Array<{
        id: string;
        pick_number: number;
        player_id: number | null;
        team_id: string | null;
        players?: { name: string } | null;
      }>,
    [data],
  );

  const session = data?.session as
    | {
        id: string;
        status: string;
        current_pick: number;
        current_team_id: string | null;
        pick_deadline: string | null;
        pick_time_seconds: number;
        snake_order: string[] | null;
      }
    | null
    | undefined;

  const rosterSize = data?.rosterSize ?? 15;
  const commissionerId = data?.commissionerId;

  const pickedIds = useMemo(
    () => new Set(picks.map((p) => p.player_id).filter((x): x is number => x != null)),
    [picks],
  );

  const order = useMemo(() => {
    if (session?.snake_order && session.snake_order.length === teams.length) {
      return session.snake_order;
    }
    return buildRoundOneOrder(teams.map((t) => ({ id: t.id, draft_position: t.draft_position })));
  }, [session?.snake_order, teams]);

  const n = teams.length;
  const onClock = n > 0 && session ? teamIdForPick(session.current_pick, n, order) : null;
  const myTeam = teams.find((t) => t.user_id === userId);
  const myTurn = onClock && myTeam?.id === onClock;
  const isCommissioner = userId === commissionerId;

  // Persist + load my watchlist/queue when team is known.
  useEffect(() => {
    if (myTeam?.id) setQueueIds(getQueue(myTeam.id));
  }, [myTeam?.id]);

  // Audio + tab-title flash when it's my pick.
  useTurnAlert(!!myTurn && session?.status === "active");

  // Live presence in the draft room.
  const presence = useDraftPresence(
    leagueId,
    userId ? { user_id: userId, display_name: displayName } : null,
  );
  const onlineSet = useMemo(() => new Set(presence.map((p) => p.user_id)), [presence]);

  const queueSet = useMemo(() => new Set(queueIds), [queueIds]);

  const toggleQueue = useCallback(
    (playerId: number) => {
      if (!myTeam?.id) return;
      const next = isQueued(myTeam.id, playerId)
        ? removeFromQueue(myTeam.id, playerId)
        : addToQueue(myTeam.id, playerId);
      setQueueIds(next);
    },
    [myTeam?.id],
  );

  const moveQueue = useCallback(
    (playerId: number, dir: -1 | 1) => {
      if (!myTeam?.id) return;
      setQueueIds(moveInQueue(myTeam.id, playerId, dir));
    },
    [myTeam?.id],
  );

  const available = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return players.filter(
      (p) =>
        !pickedIds.has(p.id) &&
        (!f || p.name.toLowerCase().includes(f) || p.club.toLowerCase().includes(f)),
    );
  }, [players, pickedIds, filter]);

  const startDraft = async () => {
    setStarting(true);
    try {
      await fetch("/api/draft/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId }),
        credentials: "include",
      });
      await refresh();
    } finally {
      setStarting(false);
    }
  };

  const submitPick = useCallback(
    async (playerId: number) => {
      setPicking(true);
      try {
        await fetch("/api/draft/pick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leagueId, playerId }),
          credentials: "include",
        });
        await refresh();
      } finally {
        setPicking(false);
      }
    },
    [leagueId, refresh],
  );

  const autoPick = useCallback(async () => {
    setPicking(true);
    try {
      await fetch("/api/draft/autopick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId, queue: queueIds }),
        credentials: "include",
      });
      await refresh();
    } finally {
      setPicking(false);
    }
  }, [leagueId, refresh, queueIds]);

  if (loading) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading draft…</p>;
  }
  if (error) {
    return <p className="text-sm text-[var(--color-accent-danger)]">{error}</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 lg:h-[calc(100dvh-7rem)] lg:flex-row">
      <GlassPanel className="flex w-full shrink-0 flex-col gap-3 p-3 lg:w-72">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Order
        </p>
        <PickClock
          deadlineIso={session?.pick_deadline ?? null}
          onExpire={() => {
            if (session?.status === "active" && (myTurn || isCommissioner)) {
              autoPick();
            }
          }}
        />
        <ul className="space-y-2 overflow-y-auto text-sm">
          {teams.map((t) => {
            const online = t.user_id ? onlineSet.has(t.user_id) : false;
            return (
              <li
                key={t.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2 py-1.5",
                  t.id === onClock
                    ? "border-[var(--color-accent-warn)] bg-[var(--color-accent-warn)]/10"
                    : "border-[var(--color-glass-border)]",
                )}
              >
                <span
                  aria-label={online ? "Online" : "Offline"}
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    online ? "bg-emerald-400 animate-pulse" : "bg-white/20",
                  )}
                />
                <span className="truncate">{t.team_name}</span>
                {t.user_id === userId ? (
                  <GlassBadge variant="accent" className="ml-auto">
                    You
                  </GlassBadge>
                ) : null}
              </li>
            );
          })}
        </ul>
        {!session && isCommissioner ? (
          <Button type="button" disabled={starting} onClick={startDraft}>
            {starting ? "Starting…" : "Start draft"}
          </Button>
        ) : null}
      </GlassPanel>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <GlassPanel className="flex min-h-0 flex-1 flex-col p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-display text-sm font-medium text-[var(--color-text-primary)]">
              Player pool
            </p>
            <Input
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-xs border-[var(--color-glass-border)] bg-[var(--color-surface-2)]"
            />
          </div>
          <div className="min-h-64 max-h-80 flex-1 space-y-2 overflow-y-auto pr-1">
            {available.map((p) => {
              const canPick = (myTurn || isCommissioner) && session?.status === "active";
              const queued = queueSet.has(p.id);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "tap-target flex w-full items-center gap-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 py-2 text-left text-sm transition-colors hover:border-[var(--color-accent)]/50",
                  )}
                >
                  <button
                    type="button"
                    disabled={!myTeam}
                    onClick={() => toggleQueue(p.id)}
                    aria-label={queued ? "Remove from queue" : "Add to queue"}
                    className={cn(
                      "shrink-0 rounded-md p-1 transition-colors",
                      queued
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-accent)]",
                      !myTeam && "opacity-40",
                    )}
                  >
                    <Star className="size-4" fill={queued ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    disabled={!canPick || picking}
                    onClick={() => submitPick(p.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 disabled:opacity-50"
                  >
                    <JerseyToken
                      club={p.club_short ?? p.club}
                      name={p.name.split(/\s+/).slice(-1)[0]}
                      number={p.shirt_number}
                      isGoalkeeper={p.position === "GK"}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="block truncate font-display text-sm font-medium text-[var(--color-text-primary)]">
                        {p.name}
                      </span>
                      <span className="block truncate font-mono text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                        {p.club_short ?? p.club} · {p.position}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-broadcast text-sm leading-none text-[var(--color-text-primary)]">
                        {p.total_points}
                      </span>
                      <span className="block font-mono text-[10px] text-[var(--color-text-muted)]">
                        {p.form}
                      </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="h-40 shrink-0 overflow-y-auto p-3 lg:h-48">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">Recent picks</p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-[var(--color-text-primary)]">
            {picks.slice(-8).map((pk) => (
              <li key={pk.id}>
                #{pk.pick_number} {pk.players?.name ?? "Player"}
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-3 lg:w-80">
        <GlassPanel className="flex max-h-72 flex-col gap-2 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              My queue
            </p>
            <span className="font-broadcast text-[11px] text-[var(--color-text-muted)]">
              {queueIds.length}
            </span>
          </div>
          {queueIds.length === 0 ? (
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Star players in the pool to queue auto-picks. The clock will use this list when your time expires.
            </p>
          ) : (
            <ul className="flex-1 space-y-1 overflow-y-auto">
              {queueIds.map((id, i) => {
                const p = players.find((pl) => pl.id === id);
                if (!p) return null;
                const taken = pickedIds.has(id);
                return (
                  <li
                    key={id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border border-[var(--color-glass-border)] px-2 py-1.5 text-[11px]",
                      taken && "opacity-40 line-through",
                    )}
                  >
                    <span className="font-broadcast w-5 text-[var(--color-text-muted)]">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[var(--color-text-primary)]">
                      {p.name}
                    </span>
                    <button
                      type="button"
                      aria-label="Move up"
                      onClick={() => moveQueue(id, -1)}
                      disabled={i === 0}
                      className="rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      onClick={() => moveQueue(id, 1)}
                      disabled={i === queueIds.length - 1}
                      className="rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => toggleQueue(id)}
                      className="rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassPanel>
        <DraftAssistantPlaceholder />
        <GlassPanel className="p-3 text-xs text-[var(--color-text-muted)]">
          <p>
            Pick {session?.current_pick ?? 0} of {n * rosterSize || "—"} · Round{" "}
            {n ? Math.ceil((session?.current_pick ?? 1) / n) : "—"}
          </p>
          <p className="mt-1">
            <span className="font-broadcast">{presence.length}</span> manager{presence.length === 1 ? "" : "s"} online
          </p>
          {!myTurn && session?.status === "active" ? (
            <p className="mt-2">Waiting on the clock — you will see live updates here.</p>
          ) : null}
        </GlassPanel>
      </div>
    </div>
  );
}
