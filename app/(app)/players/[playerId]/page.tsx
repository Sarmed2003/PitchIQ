import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPoints } from "@/lib/utils/format";
import { PlayerGameweekChart } from "@/components/player/PlayerGameweekChart";
import {
  WaiverClaimButton,
  type ClaimableTeam,
} from "@/components/waivers/WaiverClaimButton";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const id = Number(playerId);
  if (Number.isNaN(id)) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: player } = await supabase.from("players").select("*").eq("id", id).maybeSingle();

  if (!player) notFound();

  const { data: recentStats } = await supabase
    .from("player_match_stats")
    .select("gameweek, fantasy_points")
    .eq("player_id", id)
    .order("gameweek", { ascending: false })
    .limit(5);

  const chartData = [...(recentStats ?? [])].reverse();

  // Build claimable-team payload + check whether this player is already on any roster.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let claimableTeams: ClaimableTeam[] = [];
  let alreadyRostered = false;

  if (user) {
    const { data: myTeams } = await supabase
      .from("teams")
      .select("id, team_name, league_id, leagues!inner(name, waiver_type)")
      .eq("user_id", user.id);
    type TeamRow = {
      id: string;
      team_name: string;
      league_id: string;
      leagues: { name: string; waiver_type: string }[] | { name: string; waiver_type: string };
    };

    const rows = (myTeams ?? []) as unknown as TeamRow[];
    if (rows.length > 0) {
      // Check if player is rostered in any of these leagues.
      const leagueIds = [...new Set(rows.map((r) => r.league_id))];
      const { data: rostered } = await supabase
        .from("teams")
        .select("league_id, roster_slots(player_id)")
        .in("league_id", leagueIds);
      type RR = { league_id: string; roster_slots: { player_id: number | null }[] | null };
      for (const r of (rostered ?? []) as unknown as RR[]) {
        if ((r.roster_slots ?? []).some((s) => s.player_id === player.id)) {
          alreadyRostered = true;
          break;
        }
      }

      // Fetch each team's roster (just the same-position players for the dropdown).
      const teamIds = rows.map((r) => r.id);
      const { data: rosterRows } = await supabase
        .from("roster_slots")
        .select("team_id, player_id, players!inner(name, position)")
        .in("team_id", teamIds);
      type RosterRow = {
        team_id: string;
        player_id: number;
        players: { name: string; position: string | null } | { name: string; position: string | null }[];
      };
      const rosterByTeam = new Map<string, ClaimableTeam["roster"]>();
      for (const r of (rosterRows ?? []) as unknown as RosterRow[]) {
        const arr = rosterByTeam.get(r.team_id) ?? [];
        const pl = Array.isArray(r.players) ? r.players[0] : r.players;
        if (pl) arr.push({ player_id: r.player_id, name: pl.name, position: pl.position });
        rosterByTeam.set(r.team_id, arr);
      }

      claimableTeams = rows.map((r) => {
        const league = Array.isArray(r.leagues) ? r.leagues[0] : r.leagues;
        return {
          id: r.id,
          team_name: r.team_name,
          league_name: league.name,
          league_id: r.league_id,
          waiver_type: league.waiver_type,
          roster: rosterByTeam.get(r.id) ?? [],
        };
      });
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">{player.club}</p>
            <h1 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
              {player.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {player.position ? (
                <GlassBadge variant="accent">{player.position}</GlassBadge>
              ) : null}
              <GlassBadge>{formatPoints(player.total_points)} pts</GlassBadge>
              {player.injury_status !== "available" ? (
                <GlassBadge variant="danger">{player.injury_status}</GlassBadge>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user ? (
              <WaiverClaimButton
                player={{ id: player.id, name: player.name, position: player.position }}
                teams={claimableTeams}
                alreadyRostered={alreadyRostered}
              />
            ) : null}
            <Link
              href="/players"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-[var(--color-glass-border)]",
              )}
            >
              Back to pool
            </Link>
          </div>
        </div>
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          Deep scouting and projections will land in a later release — for now track
          form, status, and recent fantasy returns.
        </p>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="font-display text-lg font-medium text-[var(--color-text-primary)]">
          Last 5 gameweeks
        </h2>
        {chartData.length > 0 ? (
          <div className="mt-4 h-48">
            <PlayerGameweekChart data={chartData} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            No match stats synced yet — run the gameweek sync after the season starts.
          </p>
        )}
      </GlassCard>
    </div>
  );
}
