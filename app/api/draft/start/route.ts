import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/api-response";
import { buildRoundOneOrder } from "@/lib/draft/engine";
import { logger } from "@/lib/logger";

const schema = z.object({ leagueId: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    const { leagueId } = schema.parse(await request.json());

    const { data: league } = await supabase.from("leagues").select("*").eq("id", leagueId).single();
    if (!league || league.commissioner_id !== user.id) {
      return NextResponse.json(fail("Forbidden", 403), { status: 403 });
    }

    const { data: existing } = await supabase
      .from("draft_sessions")
      .select("id")
      .eq("league_id", leagueId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(ok({ sessionId: existing.id, created: false }), { status: 200 });
    }

    const { data: teams } = await supabase
      .from("teams")
      .select("id, draft_position")
      .eq("league_id", leagueId);

    if (!teams?.length) {
      return NextResponse.json(fail("Add teams before starting the draft", 400), { status: 400 });
    }

    const order = buildRoundOneOrder(teams);
    const admin = createAdminSupabaseClient();
    const pickSeconds = 90;
    const deadline = new Date(Date.now() + pickSeconds * 1000).toISOString();

    const { data: session, error } = await admin
      .from("draft_sessions")
      .insert({
        league_id: leagueId,
        status: "active",
        current_pick: 1,
        current_round: 1,
        current_team_id: order[0] ?? null,
        pick_deadline: deadline,
        pick_time_seconds: pickSeconds,
        snake_order: order,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !session) {
      return NextResponse.json(fail(error?.message ?? "Could not start draft", 500), { status: 500 });
    }

    await admin.from("leagues").update({ status: "drafting" }).eq("id", leagueId);

    return NextResponse.json(ok({ sessionId: session.id, created: true }), { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
