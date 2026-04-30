import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const schema = z.object({
  tradeId: z.string().uuid(),
  accept: z.boolean(),
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

    const { data: trade } = await supabase.from("trades").select("*").eq("id", body.tradeId).single();

    if (!trade || trade.status !== "pending") {
      return NextResponse.json(fail("Trade not available", 400), { status: 400 });
    }

    const { data: recv } = await supabase
      .from("teams")
      .select("id, user_id")
      .eq("id", trade.receiving_team_id ?? "")
      .single();

    if (!recv || recv.user_id !== user.id) {
      return NextResponse.json(fail("Only the receiving manager can respond", 403), { status: 403 });
    }

    if (!body.accept) {
      await admin.from("trades").update({ status: "rejected", responded_at: new Date().toISOString() }).eq("id", body.tradeId);
      return NextResponse.json(ok({ status: "rejected" }), { status: 200 });
    }

    const { data: assets } = await admin.from("trade_assets").select("*").eq("trade_id", body.tradeId);

    for (const a of assets ?? []) {
      if (a.player_id == null || !a.from_team_id || !a.to_team_id) continue;
      await admin.from("roster_slots").delete().eq("team_id", a.from_team_id).eq("player_id", a.player_id);
      await admin.from("roster_slots").insert({
        team_id: a.to_team_id,
        player_id: a.player_id,
        slot_type: "bench",
        acquired_via: "trade",
      });
    }

    await admin
      .from("trades")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", body.tradeId);

    return NextResponse.json(ok({ status: "accepted" }), { status: 200 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
