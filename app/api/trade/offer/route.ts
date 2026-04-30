import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const schema = z.object({
  leagueId: z.string().uuid(),
  receivingTeamId: z.string().uuid(),
  givePlayerIds: z.array(z.number().int()).min(1),
  getPlayerIds: z.array(z.number().int()).min(1),
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

    const { data: myTeam } = await supabase
      .from("teams")
      .select("id, team_name, user_id, league_id")
      .eq("league_id", body.leagueId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!myTeam) {
      return NextResponse.json(fail("You have no team in this league", 403), { status: 403 });
    }

    const { data: theirTeam } = await supabase
      .from("teams")
      .select("id, team_name, user_id")
      .eq("id", body.receivingTeamId)
      .eq("league_id", body.leagueId)
      .single();

    if (!theirTeam || theirTeam.user_id === user.id) {
      return NextResponse.json(fail("Invalid receiving team", 400), { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const { data: trade, error: tErr } = await admin
      .from("trades")
      .insert({
        league_id: body.leagueId,
        proposing_team_id: myTeam.id,
        receiving_team_id: theirTeam.id,
        status: "pending",
        ai_analysis: null,
      })
      .select()
      .single();

    if (tErr || !trade) {
      return NextResponse.json(fail(tErr?.message ?? "Trade failed", 400), { status: 400 });
    }

    for (const pid of body.givePlayerIds) {
      await admin.from("trade_assets").insert({
        trade_id: trade.id,
        player_id: pid,
        from_team_id: myTeam.id,
        to_team_id: theirTeam.id,
      });
    }
    for (const pid of body.getPlayerIds) {
      await admin.from("trade_assets").insert({
        trade_id: trade.id,
        player_id: pid,
        from_team_id: theirTeam.id,
        to_team_id: myTeam.id,
      });
    }

    await admin.from("notifications").insert({
      user_id: theirTeam.user_id,
      type: "trade_offer",
      title: "New trade offer",
      body: `${myTeam.team_name} proposed a trade`,
      metadata: { trade_id: trade.id },
    });

    logger.debug("Trade created", trade.id);

    return NextResponse.json(ok({ tradeId: trade.id }), { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
