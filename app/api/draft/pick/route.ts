import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/api-response";
import { teamIdForPick, buildRoundOneOrder } from "@/lib/draft/engine";
import { logger } from "@/lib/logger";

const schema = z.object({
  leagueId: z.string().uuid(),
  playerId: z.number().int().positive(),
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

    const body = schema.parse(await request.json());
    const admin = createAdminSupabaseClient();

    const { data: league } = await supabase.from("leagues").select("*").eq("id", body.leagueId).single();
    if (!league) {
      return NextResponse.json(fail("League not found", 404), { status: 404 });
    }

    const { data: session } = await supabase
      .from("draft_sessions")
      .select("*")
      .eq("league_id", body.leagueId)
      .single();

    if (!session || session.status !== "active") {
      return NextResponse.json(fail("Draft is not active", 400), { status: 400 });
    }

    const { data: teams } = await supabase
      .from("teams")
      .select("id, user_id, draft_position")
      .eq("league_id", body.leagueId);

    const teamList = teams ?? [];
    const n = teamList.length;
    if (n === 0) {
      return NextResponse.json(fail("No teams", 400), { status: 400 });
    }

    const order =
      session.snake_order && session.snake_order.length === n
        ? session.snake_order
        : buildRoundOneOrder(
            teamList.map((t) => ({ id: t.id, draft_position: t.draft_position })),
          );

    const expectedTeam = teamIdForPick(session.current_pick, n, order);
    if (!expectedTeam) {
      return NextResponse.json(fail("Invalid draft state", 500), { status: 500 });
    }

    const pickingTeam = teamList.find((t) => t.id === expectedTeam);
    const isCommissioner = league.commissioner_id === user.id;
    const isOnClock = pickingTeam?.user_id === user.id;

    if (!isOnClock && !isCommissioner) {
      return NextResponse.json(fail("Not your pick", 403), { status: 403 });
    }

    const { data: taken } = await supabase
      .from("draft_picks")
      .select("id")
      .eq("draft_session_id", session.id)
      .eq("player_id", body.playerId)
      .maybeSingle();

    if (taken) {
      return NextResponse.json(fail("Player already drafted", 400), { status: 400 });
    }

    const round = Math.ceil(session.current_pick / n);
    const { error: pErr } = await admin.from("draft_picks").insert({
      draft_session_id: session.id,
      league_id: body.leagueId,
      team_id: expectedTeam,
      player_id: body.playerId,
      pick_number: session.current_pick,
      round,
    });

    if (pErr) {
      return NextResponse.json(fail(pErr.message, 400), { status: 400 });
    }

    const totalPicks = n * league.roster_size;
    const nextPick = session.current_pick + 1;

    if (nextPick > totalPicks) {
      await admin
        .from("draft_sessions")
        .update({
          status: "complete",
          completed_at: new Date().toISOString(),
          current_team_id: null,
          pick_deadline: null,
        })
        .eq("id", session.id);

      await admin.from("leagues").update({ status: "active" }).eq("id", body.leagueId);

      return NextResponse.json(ok({ complete: true }), { status: 200 });
    }

    const nextTeam = teamIdForPick(nextPick, n, order);
    const pickSeconds = session.pick_time_seconds ?? 90;
    const deadline = new Date(Date.now() + pickSeconds * 1000).toISOString();
    const nextRound = Math.ceil(nextPick / n);

    await admin
      .from("draft_sessions")
      .update({
        current_pick: nextPick,
        current_round: nextRound,
        current_team_id: nextTeam,
        pick_deadline: deadline,
        snake_order: order,
      })
      .eq("id", session.id);

    await admin.from("roster_slots").insert({
      team_id: expectedTeam,
      player_id: body.playerId,
      slot_type: "bench",
      acquired_via: "draft",
    });

    return NextResponse.json(ok({ complete: false, nextPick, nextTeam }), { status: 200 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
