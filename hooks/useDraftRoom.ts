"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export type DraftRoomPayload = {
  session: Record<string, unknown> | null;
  picks: unknown[];
  teams: Array<{
    id: string;
    team_name: string;
    user_id: string | null;
    draft_position: number | null;
  }>;
  rosterSize: number;
  commissionerId: string | null;
};

export function useDraftRoom(leagueId: string) {
  const [data, setData] = useState<DraftRoomPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/draft/room?leagueId=${encodeURIComponent(leagueId)}`, {
      credentials: "include",
    });
    const json = (await res.json()) as ApiResponse<DraftRoomPayload>;
    if (!res.ok || json.error || !json.data) {
      throw new Error(json.error ?? "Failed to load draft");
    }
    setData(json.data);
    setError(null);
  }, [leagueId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await refresh();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`draft:${leagueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "draft_picks",
          filter: `league_id=eq.${leagueId}`,
        },
        () => {
          refresh().catch((e) => logger.warn("draft refresh", e));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "draft_sessions",
          filter: `league_id=eq.${leagueId}`,
        },
        () => {
          refresh().catch((e) => logger.warn("draft refresh", e));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId, refresh]);

  return { data, loading, error, refresh };
}
