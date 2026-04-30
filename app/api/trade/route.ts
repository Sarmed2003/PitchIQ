import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import type { Tables } from "@/types/database.types";

type TradeRow = Tables<"trades">;

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    const { data: teams } = await supabase.from("teams").select("id").eq("user_id", user.id);
    const teamIds = (teams ?? []).map((t) => t.id);
    if (teamIds.length === 0) {
      return NextResponse.json(ok([]), { status: 200 });
    }

    const { data: out } = await supabase
      .from("trades")
      .select("*")
      .in("proposing_team_id", teamIds);

    const { data: inc } = await supabase
      .from("trades")
      .select("*")
      .in("receiving_team_id", teamIds);

    const map = new Map<string, TradeRow>();
    for (const t of [...(out ?? []), ...(inc ?? [])]) {
      map.set(t.id, t);
    }

    return NextResponse.json(ok([...map.values()]), { status: 200 });
  } catch (e) {
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
