"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchPlayersPage } from "@/lib/queries/player-api";
import { GlassCard } from "@/components/glass/GlassCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { POSITIONS } from "@/lib/utils/constants";
import { PlayerCard } from "@/components/players/PlayerCard";
import { Search } from "lucide-react";

export default function PlayersPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [position, setPosition] = useState<string>("all");
  const [sort, setSort] = useState<string>("points");
  const limit = 24;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const query = useInfiniteQuery({
    queryKey: ["players", { q: debouncedQ, position, sort, limit }],
    queryFn: ({ pageParam }) =>
      fetchPlayersPage({
        page: pageParam,
        limit,
        q: debouncedQ || undefined,
        position: position === "all" ? undefined : position,
        sort,
      }),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((acc, p) => acc + p.items.length, 0);
      if (loaded >= last.total) return undefined;
      return pages.length + 1;
    },
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <GlassCard className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent" />
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Player pool
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Scout the league
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Search every Premier League name synced to PitchIQ.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input
              placeholder="Search by name or club…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-11 pl-9"
              inputMode="search"
              aria-label="Search players"
            />
          </div>
          <div className="flex gap-2">
            <Select value={position} onValueChange={(v) => setPosition(v ?? "all")}>
              <SelectTrigger className="h-11 w-32 sm:w-40">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {POSITIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v ?? "points")}>
              <SelectTrigger className="h-11 w-32 sm:w-44">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="points">Total points</SelectItem>
                <SelectItem value="form">Form</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {query.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <GlassCard
                key={i}
                className="h-[150px] animate-pulse opacity-50"
                aria-hidden
              />
            ))
          : null}
        {query.isError ? (
          <p className="col-span-full text-sm text-[var(--color-accent-danger)]">
            {(query.error as Error).message}
          </p>
        ) : null}
        {items.map((pl) => (
          <PlayerCard key={pl.id} player={pl} href={`/players/${pl.id}`} />
        ))}
      </div>

      {!query.isLoading && items.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            No players found. Adjust your filters or sync the player pool.
          </p>
        </GlassCard>
      ) : null}

      {query.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="tap-target h-11 w-full border-[var(--color-glass-border)]"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}
