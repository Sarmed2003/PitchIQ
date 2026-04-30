import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { LeagueSettingsForm } from "@/components/league/LeagueSettingsForm";
import { InvitePanel } from "@/components/league/InvitePanel";
import { SyncPlayersButton } from "@/components/league/SyncPlayersButton";
import { DEFAULT_SCORING_SYSTEM } from "@/lib/draft/scoring";

export default async function LeagueSettingsPage({
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
  if (league.commissioner_id !== user.id) {
    redirect(`/league/${leagueId}`);
  }

  const scoring =
    typeof league.scoring_system === "object" &&
    league.scoring_system !== null &&
    !Array.isArray(league.scoring_system)
      ? (league.scoring_system as Record<string, number>)
      : {};

  return (
    <div className="space-y-4 lg:space-y-6">
      <GlassCard className="relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent" />
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Commissioner controls
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          {league.name} · settings
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Tune scoring rules, sync the player pool, and share invites.
        </p>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <LeagueSettingsForm
          leagueId={leagueId}
          maxTeams={league.max_teams}
          rosterSize={league.roster_size}
          tradeDeadline={league.trade_deadline}
          waiverType={league.waiver_type}
          scoring={{ ...DEFAULT_SCORING_SYSTEM, ...scoring }}
        />

        <div className="space-y-4 lg:space-y-6">
          <InvitePanel
            leagueName={league.name}
            inviteCode={league.invite_code ?? ""}
            appUrl={process.env.NEXT_PUBLIC_APP_URL}
          />

          <GlassCard className="relative overflow-hidden p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-2)]/45 to-transparent" />
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent-2)]">
              Player data
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-[var(--color-text-primary)]">
              Sync from Premier League
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Pulls every PL roster (clubs, shirt numbers, injuries) from your data
              provider. Free plan is rate-limited — keep it to once a day.
            </p>
            <SyncPlayersButton className="mt-4" />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
