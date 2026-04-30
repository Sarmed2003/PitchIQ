import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { PitchVisualizer, type PitchPlayer } from "@/components/team/PitchVisualizer";
import { JerseyToken } from "@/components/players/JerseyToken";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPoints } from "@/lib/utils/format";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: team } = await supabase
    .from("teams")
    .select("id, team_name, league_id, user_id, total_points, gameweek_points, rank")
    .eq("id", teamId)
    .maybeSingle();
  if (!team) notFound();

  const { data: leagueRow } = await supabase
    .from("leagues")
    .select("id, name")
    .eq("id", team.league_id)
    .maybeSingle();

  const { data: roster } = await supabase
    .from("roster_slots")
    .select("id, slot_type, lineup_position, player_id")
    .eq("team_id", teamId);

  const slots = roster ?? [];
  const playerIds = [...new Set(slots.map((s) => s.player_id).filter((x): x is number => x != null))];
  const { data: playerRows } =
    playerIds.length > 0
      ? await supabase
          .from("players")
          .select("id, name, position, total_points, club, club_short, shirt_number, injury_status")
          .in("id", playerIds)
      : { data: [] };
  type PR = {
    id: number;
    name: string;
    position: string | null;
    total_points: number;
    club: string;
    club_short: string | null;
    shirt_number: number | null;
    injury_status: string;
  };

  const byPlayerId = new Map(((playerRows ?? []) as PR[]).map((p) => [p.id, p]));

  const starters: Record<string, PitchPlayer | undefined> = {};
  for (const row of slots) {
    const pos = row.lineup_position;
    if (!pos || pos.startsWith("bench")) continue;
    const pl = row.player_id != null ? byPlayerId.get(row.player_id) : undefined;
    if (!pl) continue;
    const base: PitchPlayer = {
      name: pl.name,
      position: pl.position,
      club: pl.club_short ?? pl.club,
      shirtNumber: pl.shirt_number,
      points: pl.total_points,
      isInjured: pl.injury_status === "injured",
    };
    if (pos === "GK") starters.gk = base;
    else if (pos.startsWith("DEF")) {
      const i = ["d1", "d2", "d3", "d4"].find((k) => !starters[k]);
      if (i) starters[i] = base;
    } else if (pos.startsWith("MID")) {
      const i = ["m1", "m2", "m3", "m4", "m5"].find((k) => !starters[k]);
      if (i) starters[i] = base;
    } else if (pos.startsWith("FWD")) {
      const i = ["f1", "f2", "f3"].find((k) => !starters[k]);
      if (i) starters[i] = base;
    }
  }

  const isMine = team.user_id === user.id;
  const league = leagueRow;

  return (
    <div className="space-y-4 lg:space-y-6">
      <GlassCard className="relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent" />
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
              {league?.name ?? "League"}
              {team.rank ? ` · Rank #${team.rank}` : ""}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
              {team.team_name}
            </h1>
            <p className="mt-2 flex flex-wrap items-baseline gap-3 font-mono text-sm text-[var(--color-text-muted)]">
              <span className="font-broadcast text-2xl text-[var(--color-text-primary)]">
                {formatPoints(team.total_points)}
              </span>
              total pts
              <span className="text-[var(--color-text-hint)]">·</span>
              <span className="text-[var(--color-accent-2)]">
                GW {formatPoints(team.gameweek_points)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isMine ? (
              <Link
                href={`/team/${team.id}/lineup`}
                className={cn(buttonVariants({ variant: "default" }), "tap-target")}
              >
                Set lineup
              </Link>
            ) : null}
            {league ? (
              <Link
                href={`/league/${league.id}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "tap-target border-[var(--color-glass-border)]",
                )}
              >
                League home
              </Link>
            ) : null}
            <Link
              href="/trades"
              className={cn(buttonVariants({ variant: "secondary" }), "tap-target")}
            >
              Trades
            </Link>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4 sm:p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Starting XI
            </p>
            <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
              On the pitch
            </h2>
          </div>
          {isMine ? (
            <Link
              href={`/team/${team.id}/lineup`}
              className="text-[10px] uppercase tracking-wide text-[var(--color-accent)] hover:underline"
            >
              Edit lineup →
            </Link>
          ) : null}
        </div>
        <PitchVisualizer
          starters={starters}
          formation="4-4-2"
          className="mt-4"
        />
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Squad
            </p>
            <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
              Full roster
            </h2>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">{slots.length} players</span>
        </div>
        {slots.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[var(--color-glass-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
            Roster fills after the draft completes — head to the draft room to build your squad.
          </div>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {slots.map((r) => {
              const pl = r.player_id != null ? byPlayerId.get(r.player_id) : undefined;
              if (!pl) return null;
              return (
                <li key={r.id}>
                  <Link
                    href={`/players/${pl.id}`}
                    className="hover-surface flex items-center gap-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] p-3"
                  >
                    <JerseyToken
                      club={pl.club_short ?? pl.club}
                      name={pl.name.split(/\s+/).slice(-1)[0]}
                      number={pl.shirt_number}
                      isGoalkeeper={pl.position === "GK"}
                      state={
                        pl.injury_status === "injured"
                          ? "injured"
                          : pl.injury_status === "suspended"
                            ? "suspended"
                            : "default"
                      }
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold text-[var(--color-text-primary)]">
                        {pl.name}
                      </p>
                      <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                        {pl.club_short ?? pl.club} · {pl.position}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <GlassBadge
                        variant={r.slot_type === "starter" ? "accent" : "default"}
                        className="text-[10px]"
                      >
                        {r.slot_type === "starter"
                          ? r.lineup_position ?? "STARTER"
                          : (r.slot_type ?? "BENCH").toUpperCase()}
                      </GlassBadge>
                      <span className="font-broadcast text-sm leading-none text-[var(--color-text-primary)]">
                        {pl.total_points}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
