import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api-response";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ leagueId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { leagueId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    const { data: league } = await supabase
      .from("leagues")
      .select("id, commissioner_id, name")
      .eq("id", leagueId)
      .maybeSingle();
    if (!league) {
      return NextResponse.json(fail("League not found", 404), { status: 404 });
    }
    if (league.commissioner_id !== user.id) {
      return NextResponse.json(fail("Forbidden", 403), { status: 403 });
    }

    const { error } = await supabase.from("leagues").delete().eq("id", leagueId);
    if (error) {
      return NextResponse.json(fail(error.message, 400), { status: 400 });
    }

    return NextResponse.json(ok({ deleted: true, name: league.name }), { status: 200 });
  } catch (e) {
    logger.error("league/[leagueId] DELETE", e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
