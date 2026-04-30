"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type PresenceUser = {
  user_id: string;
  display_name: string | null;
  online_at: string;
};

// Tracks who's actually in the draft room via a Supabase presence channel.
// Used to render the live "online" dot next to each manager.
export function useDraftPresence(
  leagueId: string,
  me: { user_id: string; display_name: string | null } | null,
) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!me) return;
    const supabase = createBrowserSupabaseClient();
    const channel = supabase.channel(`presence:draft:${leagueId}`, {
      config: { presence: { key: me.user_id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, PresenceUser[]>;
        const flat = Object.values(state).flat();
        setUsers(flat);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: me.user_id,
            display_name: me.display_name,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [leagueId, me?.user_id, me?.display_name, me]);

  return users;
}
