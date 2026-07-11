import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api-response";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ tradeId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { tradeId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    const { data: trade } = await supabase
      .from("trades")
      .select("id, status, proposing_team_id")
      .eq("id", tradeId)
      .maybeSingle();
    if (!trade) {
      return NextResponse.json(fail("Trade not found", 404), { status: 404 });
    }
    if (trade.status !== "pending") {
      return NextResponse.json(fail("Trade is not pending", 400), { status: 400 });
    }

    const { data: proposerTeam } = trade.proposing_team_id
      ? await supabase
          .from("teams")
          .select("user_id")
          .eq("id", trade.proposing_team_id)
          .maybeSingle()
      : { data: null };

    if (proposerTeam?.user_id !== user.id) {
      return NextResponse.json(fail("Only the proposer can cancel", 403), { status: 403 });
    }

    const { error } = await supabase
      .from("trades")
      .update({ status: "cancelled", responded_at: new Date().toISOString() })
      .eq("id", tradeId);
    if (error) {
      return NextResponse.json(fail(error.message, 400), { status: 400 });
    }

    return NextResponse.json(ok({ cancelled: true }), { status: 200 });
  } catch (e) {
    logger.error("trade/[tradeId] DELETE", e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
