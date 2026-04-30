import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPoints } from "@/lib/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvitePanel } from "@/components/league/InvitePanel";

export default async function LeagueHomePage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", leagueId)
    .maybeSingle();
  if (!league) notFound();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, team_name, user_id, total_points, gameweek_points, rank, draft_position")
    .eq("league_id", leagueId)
    .order("total_points", { ascending: false });

  const myTeam = teams?.find((t) => t.user_id === user.id);
  const isCommissioner = league.commissioner_id === user.id;
  const seatsLeft = Math.max(0, (league.max_teams ?? 10) - (teams?.length ?? 0));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <GlassCard className="relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
              {league.season ?? "2025-26"} season · {league.status ?? "setup"}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
              {league.name}
            </h1>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {league.draft_type ?? "snake"} · {league.draft_mode ?? "live"} draft ·{" "}
              <span className="text-[var(--color-accent-2)]">
                {seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {myTeam ? (
              <Link
                href={`/team/${myTeam.id}`}
                className={cn(buttonVariants(), "tap-target inline-flex justify-center")}
              >
                My team
              </Link>
            ) : null}
            <Link
              href={`/draft/${leagueId}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "tap-target inline-flex justify-center border-[var(--color-glass-border)]",
              )}
            >
              Draft room
            </Link>
            {isCommissioner ? (
              <Link
                href={`/league/${leagueId}/settings`}
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "tap-target inline-flex justify-center",
                )}
              >
                Settings
              </Link>
            ) : null}
          </div>
        </div>
      </GlassCard>

      {/* Two-column on lg: standings + invite. Stacks on mobile. */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <GlassCard className="p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-end justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
              Standings
            </h2>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {teams?.length ?? 0} / {league.max_teams ?? 10} managers
            </span>
          </div>
          <div className="mt-4 -mx-1 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--color-glass-border)] hover:bg-transparent">
                  <TableHead className="w-10 text-[var(--color-text-muted)]">#</TableHead>
                  <TableHead className="text-[var(--color-text-muted)]">Team</TableHead>
                  <TableHead className="hidden text-right text-[var(--color-text-muted)] sm:table-cell">
                    GW
                  </TableHead>
                  <TableHead className="text-right text-[var(--color-text-muted)]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(teams ?? []).map((t, i) => (
                  <TableRow
                    key={t.id}
                    className="border-[var(--color-glass-border)] transition-colors hover:bg-[var(--color-glass)]"
                  >
                    <TableCell className="font-mono text-[var(--color-text-muted)]">
                      {t.rank ?? i + 1}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/team/${t.id}`}
                        className={cn(
                          "font-medium transition-colors hover:text-[var(--color-accent)]",
                          t.user_id === user.id
                            ? "text-[var(--color-accent)]"
                            : "text-[var(--color-text-primary)]",
                        )}
                      >
                        {t.team_name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-right font-mono text-sm sm:table-cell">
                      {formatPoints(t.gameweek_points)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatPoints(t.total_points)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!teams?.length ? (
            <div className="mt-6 rounded-xl border border-dashed border-[var(--color-glass-border)] p-6 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                No managers yet — kick things off by inviting friends.
              </p>
            </div>
          ) : null}
        </GlassCard>

        <InvitePanel
          leagueId={leagueId}
          leagueName={league.name}
          inviteCode={league.invite_code ?? ""}
          appUrl={appUrl}
          isCommissioner={isCommissioner}
        />
      </div>
    </div>
  );
}
