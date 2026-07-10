import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Walks every league, sorts pending claims, awards the winner per player and
// applies the add/drop. Two strategies depending on league.waiver_type:
//   rolling → worst-ranked team wins, ties on priority then created_at
//   faab    → highest bid wins, then priority, then created_at
// FAAB budget deduction lands when we wire team budgets. Bearer-secret guarded.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const now = new Date();

  const { data: leagues, error: leaguesErr } = await admin
    .from("leagues")
    .select("id, waiver_type");
  if (leaguesErr) return NextResponse.json({ error: leaguesErr.message }, { status: 500 });

  let totalAwarded = 0;
  let totalLost = 0;
  let totalFailed = 0;

  for (const league of leagues ?? []) {
    const { data: pending } = await admin
      .from("waiver_claims")
      .select("*")
      .eq("league_id", league.id)
      .eq("status", "pending");
    if (!pending || pending.length === 0) continue;

    const { data: teams } = await admin
      .from("teams")
      .select("id, rank, total_points")
      .eq("league_id", league.id);
    const teamRank = new Map<string, number>();
    const sortedTeams = (teams ?? [])
      .slice()
      .sort((a, b) => {
        if (a.rank == null && b.rank == null) return (a.total_points ?? 0) - (b.total_points ?? 0);
        if (a.rank == null) return -1;
        if (b.rank == null) return 1;
        return b.rank - a.rank; // worst rank first (highest rank number)
      });
    sortedTeams.forEach((t, i) => teamRank.set(t.id, i)); // 0 = worst = first pick

    // Bucket by player — only one claim wins per player.
    const grouped = new Map<number, typeof pending>();
    for (const c of pending) {
      const key = c.add_player_id;
      const arr = grouped.get(key) ?? [];
      arr.push(c);
      grouped.set(key, arr);
    }

    const winnerIds = new Set<string>();
    const awardedClaimIds: string[] = [];
    const lostClaimIds: string[] = [];

    const isFaab = league.waiver_type === "faab";

    for (const [, claims] of grouped) {
      // Pick a winner for this player.
      const sorted = claims.slice().sort((a, b) => {
        if (isFaab) {
          if (a.faab_bid !== b.faab_bid) return b.faab_bid - a.faab_bid;
        }
        const ar = teamRank.get(a.team_id) ?? 999;
        const br = teamRank.get(b.team_id) ?? 999;
        if (ar !== br) return ar - br;
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
      });

      const winner = sorted[0];
      const losers = sorted.slice(1);

      // Best-effort add/drop. If anything fails we mark the claim failed and
      // move on so one bad row doesn't poison the whole league run.
      let success = true;
      let failureReason: string | null = null;

      if (winner.drop_player_id != null) {
        const { error: dropErr } = await admin
          .from("roster_slots")
          .delete()
          .eq("team_id", winner.team_id)
          .eq("player_id", winner.drop_player_id);
        if (dropErr) {
          success = false;
          failureReason = `drop failed: ${dropErr.message}`;
        }
      }

      if (success) {
        const { error: addErr } = await admin.from("roster_slots").insert({
          team_id: winner.team_id,
          player_id: winner.add_player_id,
          slot_type: "bench",
          acquired_via: "waiver",
        });
        if (addErr) {
          success = false;
          failureReason = `add failed: ${addErr.message}`;
        }
      }

      if (success) {
        awardedClaimIds.push(winner.id);
        winnerIds.add(winner.team_id);
        totalAwarded++;
      } else {
        totalFailed++;
        await admin
          .from("waiver_claims")
          .update({
            status: "failed",
            processed_at: now.toISOString(),
            failure_reason: failureReason,
          })
          .eq("id", winner.id);
      }

      lostClaimIds.push(...losers.map((l) => l.id));
    }

    if (awardedClaimIds.length > 0) {
      await admin
        .from("waiver_claims")
        .update({ status: "won", processed_at: now.toISOString() })
        .in("id", awardedClaimIds);
    }
    if (lostClaimIds.length > 0) {
      await admin
        .from("waiver_claims")
        .update({ status: "lost", processed_at: now.toISOString() })
        .in("id", lostClaimIds);
      totalLost += lostClaimIds.length;
    }
  }

  return NextResponse.json({
    ok: true,
    awarded: totalAwarded,
    lost: totalLost,
    failed: totalFailed,
    at: now.toISOString(),
  });
}
