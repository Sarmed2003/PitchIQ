import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { LineupEditor, type EditorPlayer } from "@/components/team/LineupEditor";
import {
  readGameweekFromSettings,
  formatDeadlineLabel,
} from "@/lib/gameweek";
import { FORMATIONS, FORMATION_COUNTS, type Formation } from "@/lib/lineup/schema";

export default async function LineupPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/team/${teamId}/lineup`);

  const { data: team } = await supabase
    .from("teams")
    .select("id, team_name, league_id, user_id")
    .eq("id", teamId)
    .maybeSingle();
  if (!team) notFound();
  if (team.user_id !== user.id) {
    redirect(`/team/${teamId}`);
  }
  if (!team.league_id) notFound();

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, settings")
    .eq("id", team.league_id)
    .maybeSingle();

  const gw = readGameweekFromSettings(league?.settings ?? null);

  const { data: roster } = await supabase
    .from("roster_slots")
    .select("player_id")
    .eq("team_id", teamId);

  const playerIds = (roster ?? [])
    .map((r) => r.player_id)
    .filter((x): x is number => x != null);

  const { data: playerRows } =
    playerIds.length > 0
      ? await supabase
          .from("players")
          .select(
            "id, name, position, club, club_short, shirt_number, total_points, injury_status",
          )
          .in("id", playerIds)
      : { data: [] };

  const editorRoster: EditorPlayer[] = (playerRows ?? []) as EditorPlayer[];

  const { data: existing } = await supabase
    .from("lineups")
    .select("formation, starters, bench, captain_player_id, vice_player_id, chip")
    .eq("team_id", teamId)
    .eq("gameweek", gw.gameweek)
    .eq("season", gw.season)
    .maybeSingle();

  const initialFormation: Formation =
    existing?.formation && (FORMATIONS as readonly string[]).includes(existing.formation)
      ? (existing.formation as Formation)
      : "4-4-2";

  let starterIds: number[] = [];
  let benchIds: number[] = [];

  if (existing) {
    const starters = Array.isArray(existing.starters) ? (existing.starters as Array<{ player_id: number }>) : [];
    const bench = Array.isArray(existing.bench) ? (existing.bench as Array<{ player_id: number }>) : [];
    starterIds = starters.map((s) => s.player_id).filter((x): x is number => Number.isFinite(x));
    benchIds = bench.map((b) => b.player_id).filter((x): x is number => Number.isFinite(x));
  }

  // If no existing lineup, derive a sensible default from roster_slots + position counts.
  if (starterIds.length === 0) {
    const counts = FORMATION_COUNTS[initialFormation];
    const byPos = (pos: string) =>
      editorRoster
        .filter((p) => p.position === pos)
        .sort((a, b) => b.total_points - a.total_points);
    const def = byPos("DEF").slice(0, counts.DEF).map((p) => p.id);
    const mid = byPos("MID").slice(0, counts.MID).map((p) => p.id);
    const fwd = byPos("FWD").slice(0, counts.FWD).map((p) => p.id);
    const gk = byPos("GK").slice(0, 1).map((p) => p.id);
    starterIds = [...gk, ...def, ...mid, ...fwd];
    const startSet = new Set(starterIds);
    benchIds = editorRoster.filter((p) => !startSet.has(p.id)).map((p) => p.id);
  }

  const deadlineLabel = formatDeadlineLabel(gw.deadline);

  return (
    <div className="space-y-4 lg:space-y-6">
      <GlassCard className="relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent" />
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
          {league?.name ?? "League"}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          {team.team_name} · Lineup
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Set your starting XI, bench order, captain &amp; vice for gameweek {gw.gameweek}.
        </p>
      </GlassCard>

      {editorRoster.length < 11 ? (
        <GlassCard className="p-6 text-center text-sm text-[var(--color-text-muted)]">
          You need at least 11 players on your roster to set a lineup. Finish your draft or pick up free agents first.
        </GlassCard>
      ) : (
        <LineupEditor
          teamId={team.id}
          leagueId={team.league_id}
          gameweek={gw.gameweek}
          deadlineLabel={deadlineLabel}
          locked={gw.locked}
          roster={editorRoster}
          initial={{
            formation: initialFormation,
            starterIds,
            benchIds,
            captainId: existing?.captain_player_id ?? null,
            viceId: existing?.vice_player_id ?? null,
            chip: (existing?.chip as "triple_captain" | "bench_boost" | "free_hit" | "wildcard" | null) ?? null,
          }}
        />
      )}
    </div>
  );
}
