import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/glass/GlassCard";
import Link from "next/link";
import { formatPoints } from "@/lib/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rows: Array<{
    id: string;
    team_name: string;
    total_points: number;
    gameweek_points: number;
    league_name: string;
  }> = [];

  if (user) {
    const { data: mine } = await supabase.from("teams").select("league_id").eq("user_id", user.id);
    const leagueIds = [...new Set((mine ?? []).map((m) => m.league_id).filter(Boolean))] as string[];

    if (leagueIds.length > 0) {
      const { data: leagueRows } = await supabase.from("leagues").select("id, name").in("id", leagueIds);
      const leagueNameById = new Map((leagueRows ?? []).map((l) => [l.id, l.name]));

      const { data: teamRows } = await supabase
        .from("teams")
        .select("id, team_name, total_points, gameweek_points, league_id")
        .in("league_id", leagueIds)
        .order("total_points", { ascending: false })
        .limit(100);

      rows = (teamRows ?? []).map((t) => ({
        id: t.id,
        team_name: t.team_name,
        total_points: t.total_points ?? 0,
        gameweek_points: t.gameweek_points ?? 0,
        league_name: (t.league_id && leagueNameById.get(t.league_id)) || "—",
      }));
    }
  }

  return (
    <GlassCard className="p-6">
      <h1 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
        Leaderboard
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Teams from every league you belong to, ranked by season points.
      </p>
      <Table className="mt-6">
        <TableHeader>
          <TableRow className="border-[var(--color-glass-border)] hover:bg-transparent">
            <TableHead className="text-[var(--color-text-muted)]">Rank</TableHead>
            <TableHead className="text-[var(--color-text-muted)]">Team</TableHead>
            <TableHead className="text-[var(--color-text-muted)]">League</TableHead>
            <TableHead className="text-right text-[var(--color-text-muted)]">GW</TableHead>
            <TableHead className="text-right text-[var(--color-text-muted)]">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((t, i) => (
            <TableRow key={t.id} className="border-[var(--color-glass-border)]">
              <TableCell className="font-mono text-[var(--color-text-muted)]">{i + 1}</TableCell>
              <TableCell>
                <Link
                  href={`/team/${t.id}`}
                  className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
                >
                  {t.team_name}
                </Link>
              </TableCell>
              <TableCell className="text-[var(--color-text-muted)]">{t.league_name}</TableCell>
              <TableCell className="text-right font-mono">
                {formatPoints(t.gameweek_points)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatPoints(t.total_points)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--color-text-muted)]">
          Join or create a league to populate your leaderboard.
        </p>
      ) : null}
    </GlassCard>
  );
}
