import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { WaiverClaimList, type WaiverClaimRow } from "@/components/waivers/WaiverClaimList";

type ClaimDb = {
  id: string;
  status: WaiverClaimRow["status"];
  priority: number;
  faab_bid: number;
  add_player_id: number;
  drop_player_id: number | null;
  league_id: string;
  team_id: string;
  created_at: string;
  processed_at: string | null;
  failure_reason: string | null;
};

type PlayerLite = {
  id: number;
  name: string;
  club: string;
  club_short: string | null;
  position: string | null;
  shirt_number: number | null;
};

export default async function WaiversPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/waivers");

  const { data: myTeams } = await supabase
    .from("teams")
    .select("id, team_name, league_id, leagues!inner(name, waiver_type)")
    .eq("user_id", user.id);

  if (!myTeams || myTeams.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
          Waivers
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          You&apos;re not in a league yet.{" "}
          <Link href="/league/create" className="text-[var(--color-accent)] underline">
            Create one
          </Link>{" "}
          or{" "}
          <Link href="/league/join" className="text-[var(--color-accent)] underline">
            join with a code
          </Link>
          .
        </p>
      </GlassCard>
    );
  }

  type TeamRow = {
    id: string;
    team_name: string;
    league_id: string;
    leagues: { name: string; waiver_type: string }[] | { name: string; waiver_type: string };
  };
  const teams = myTeams as unknown as TeamRow[];
  const leagueOf = (teamId: string) => {
    const t = teams.find((tt) => tt.id === teamId);
    if (!t) return null;
    return Array.isArray(t.leagues) ? t.leagues[0] : t.leagues;
  };

  const teamIds = teams.map((t) => t.id);
  const { data: claimRows } = await supabase
    .from("waiver_claims")
    .select(
      "id, status, priority, faab_bid, add_player_id, drop_player_id, league_id, team_id, created_at, processed_at, failure_reason",
    )
    .in("team_id", teamIds)
    .order("created_at", { ascending: false });

  const allPlayerIds = [
    ...new Set(
      ((claimRows ?? []) as ClaimDb[]).flatMap((c) => [
        c.add_player_id,
        ...(c.drop_player_id != null ? [c.drop_player_id] : []),
      ]),
    ),
  ];

  const { data: players } =
    allPlayerIds.length > 0
      ? await supabase
          .from("players")
          .select("id, name, club, club_short, position, shirt_number")
          .in("id", allPlayerIds)
      : { data: [] };

  const byPlayerId = new Map(((players ?? []) as PlayerLite[]).map((p) => [p.id, p]));

  const claimsByTeam = new Map<string, WaiverClaimRow[]>();
  for (const c of (claimRows ?? []) as ClaimDb[]) {
    const add = byPlayerId.get(c.add_player_id) ?? null;
    const drop = c.drop_player_id != null ? (byPlayerId.get(c.drop_player_id) ?? null) : null;
    const row: WaiverClaimRow = {
      id: c.id,
      status: c.status,
      priority: c.priority,
      faab_bid: c.faab_bid,
      add_player: add,
      drop_player: drop,
      created_at: c.created_at,
      processed_at: c.processed_at,
      failure_reason: c.failure_reason,
    };
    const arr = claimsByTeam.get(c.team_id) ?? [];
    arr.push(row);
    claimsByTeam.set(c.team_id, arr);
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <GlassCard className="relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent" />
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Free agent market
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          Waivers
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Pending claims process on your league&apos;s waiver run. Worst-ranked teams have first
          priority by default; commissioners can switch to FAAB bidding from league settings.
        </p>
      </GlassCard>

      {teams.map((t) => {
        const league = leagueOf(t.id);
        const isFaab = league?.waiver_type === "faab";
        const claims = claimsByTeam.get(t.id) ?? [];
        const pendingCount = claims.filter((c) => c.status === "pending").length;
        return (
          <GlassCard key={t.id} className="p-5 sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {league?.name ?? "League"}
                </p>
                <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
                  {t.team_name}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <GlassBadge variant="accent" className="text-[10px]">
                  {isFaab ? "FAAB bidding" : "Reverse standings"}
                </GlassBadge>
                <GlassBadge className="text-[10px]">
                  {pendingCount} pending
                </GlassBadge>
                <Link
                  href="/players?available=true"
                  className="text-[11px] font-medium text-[var(--color-accent)] hover:underline"
                >
                  Browse free agents →
                </Link>
              </div>
            </div>
            <WaiverClaimList claims={claims} isFaab={isFaab} />
          </GlassCard>
        );
      })}
    </div>
  );
}
