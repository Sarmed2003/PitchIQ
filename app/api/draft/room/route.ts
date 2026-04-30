import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const leagueId = request.nextUrl.searchParams.get("leagueId");
    if (!leagueId) {
      return NextResponse.json(fail("leagueId required", 400), { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    const { data: session } = await supabase
      .from("draft_sessions")
      .select("*")
      .eq("league_id", leagueId)
      .maybeSingle();

    const { data: picks } = await supabase
      .from("draft_picks")
      .select("*, players(id, name, club, position)")
      .eq("league_id", leagueId)
      .order("pick_number", { ascending: true });

    const { data: teams } = await supabase
      .from("teams")
      .select("id, team_name, user_id, draft_position")
      .eq("league_id", leagueId)
      .order("draft_position", { ascending: true, nullsFirst: false });

    const { data: league } = await supabase
      .from("leagues")
      .select("roster_size, commissioner_id")
      .eq("id", leagueId)
      .single();

    return NextResponse.json(
      ok({
        session,
        picks: picks ?? [],
        teams: teams ?? [],
        rosterSize: league?.roster_size ?? 15,
        commissionerId: league?.commissioner_id ?? null,
      }),
      { status: 200 },
    );
  } catch (e) {
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
