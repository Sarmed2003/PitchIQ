import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fail } from "@/lib/api-response";
import { teamIdForPick, buildRoundOneOrder } from "@/lib/draft/engine";
import { logger } from "@/lib/logger";

const schema = z.object({
  leagueId: z.string().uuid(),
  /** Optional client-side queue (priority order) of player IDs. */
  queue: z.array(z.number().int().positive()).max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    const { leagueId, queue } = schema.parse(await request.json());
    const admin = createAdminSupabaseClient();

    const { data: league } = await supabase.from("leagues").select("*").eq("id", leagueId).single();
    if (!league) {
      return NextResponse.json(fail("League not found", 404), { status: 404 });
    }

    const { data: session } = await supabase
      .from("draft_sessions")
      .select("*")
      .eq("league_id", leagueId)
      .single();

    if (!session || session.status !== "active") {
      return NextResponse.json(fail("Draft is not active", 400), { status: 400 });
    }

    const { data: teams } = await supabase
      .from("teams")
      .select("id, user_id, draft_position")
      .eq("league_id", leagueId);

    const teamList = teams ?? [];
    const n = teamList.length;
    const order =
      session.snake_order && session.snake_order.length === n
        ? session.snake_order
        : buildRoundOneOrder(
            teamList.map((t) => ({ id: t.id, draft_position: t.draft_position })),
          );

    const expectedTeam = teamIdForPick(session.current_pick ?? 0, n, order);
    if (!expectedTeam) {
      return NextResponse.json(fail("Invalid draft state", 500), { status: 500 });
    }

    const pickingTeam = teamList.find((t) => t.id === expectedTeam);
    const isCommissioner = league.commissioner_id === user.id;
    const isOnClock = pickingTeam?.user_id === user.id;

    if (!isOnClock && !isCommissioner) {
      return NextResponse.json(fail("Not your pick", 403), { status: 403 });
    }

    const { data: pickedIds } = await admin
      .from("draft_picks")
      .select("player_id")
      .eq("draft_session_id", session.id);

    const exclude = new Set(
      (pickedIds ?? []).map((p) => p.player_id).filter((x): x is number => x != null),
    );

    let candidate: { id: number } | null = null;

    // 1. Honor the manager's queued picks first (highest priority first).
    if (queue && queue.length > 0) {
      const inQueue = queue.find((id) => !exclude.has(id));
      if (inQueue != null) candidate = { id: inQueue };
    }

    // 2. Fallback: best remaining player by VOR if available, else total_points.
    if (!candidate) {
      const { data: pool } = await admin
        .from("players")
        .select("id, total_points, draft_vor, form")
        .limit(800);
      const ranked = (pool ?? [])
        .filter((p) => !exclude.has(p.id))
        .map((p) => ({
          id: p.id,
          score:
            (p.draft_vor != null ? Number(p.draft_vor) : 0) * 5 +
            (p.total_points ?? 0) +
            Number(p.form ?? 0),
        }))
        .sort((a, b) => b.score - a.score);
      if (ranked.length > 0) candidate = { id: ranked[0].id };
    }

    if (!candidate) {
      return NextResponse.json(fail("No players available", 400), { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const cookie = request.headers.get("cookie") ?? "";
    const res = await fetch(`${origin}/api/draft/pick`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      body: JSON.stringify({ leagueId, playerId: candidate.id }),
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
