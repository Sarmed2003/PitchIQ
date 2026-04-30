import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const joinSchema = z.object({
  inviteCode: z.string().min(4).max(16),
  teamName: z.string().min(2).max(80),
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

    const body = joinSchema.parse(await request.json());

    const { data: rows, error: rpcErr } = await supabase.rpc("get_league_by_invite", {
      code: body.inviteCode.trim(),
    });

    if (rpcErr) {
      return NextResponse.json(fail(rpcErr.message, 400), { status: 400 });
    }

    const league = rows?.[0];
    if (!league) {
      return NextResponse.json(fail("Invalid invite code", 404), { status: 404 });
    }

    const { count, error: cErr } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("league_id", league.id);

    if (cErr) {
      return NextResponse.json(fail(cErr.message, 500), { status: 500 });
    }

    if ((count ?? 0) >= league.max_teams) {
      return NextResponse.json(fail("League is full", 400), { status: 400 });
    }

    const { data: team, error: tErr } = await supabase
      .from("teams")
      .insert({
        league_id: league.id,
        user_id: user.id,
        team_name: body.teamName,
      })
      .select()
      .single();

    if (tErr) {
      if (tErr.code === "23505") {
        return NextResponse.json(fail("You already have a team in this league", 400), {
          status: 400,
        });
      }
      return NextResponse.json(fail(tErr.message, 400), { status: 400 });
    }

    return NextResponse.json(ok({ league, team }), { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
