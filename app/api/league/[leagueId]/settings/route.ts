import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/database.types";

const schema = z.object({
  maxTeams: z.number().min(2).max(20).optional(),
  rosterSize: z.number().min(11).max(25).optional(),
  waiverType: z.string().min(1).max(40).optional(),
  tradeDeadline: z.string().nullable().optional(),
  scoringSystem: z.record(z.string(), z.number()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    const { leagueId } = await params;

    const { data: league } = await supabase
      .from("leagues")
      .select("id, commissioner_id")
      .eq("id", leagueId)
      .maybeSingle();
    if (!league) {
      return NextResponse.json(fail("League not found", 404), { status: 404 });
    }
    if (league.commissioner_id !== user.id) {
      return NextResponse.json(fail("Forbidden", 403), { status: 403 });
    }

    const body = schema.parse(await request.json());
    const update: Database["public"]["Tables"]["leagues"]["Update"] = {};
    if (body.maxTeams !== undefined) update.max_teams = body.maxTeams;
    if (body.rosterSize !== undefined) update.roster_size = body.rosterSize;
    if (body.waiverType !== undefined) update.waiver_type = body.waiverType;
    if (body.tradeDeadline !== undefined) update.trade_deadline = body.tradeDeadline;
    if (body.scoringSystem !== undefined) {
      update.scoring_system = body.scoringSystem as Database["public"]["Tables"]["leagues"]["Update"]["scoring_system"];
    }

    const { error } = await supabase.from("leagues").update(update).eq("id", leagueId);
    if (error) {
      return NextResponse.json(fail(error.message, 400), { status: 400 });
    }

    return NextResponse.json(ok({ updated: true }), { status: 200 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error("league/[leagueId]/settings PATCH", e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
