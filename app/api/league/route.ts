import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok, type ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  teamName: z.string().min(2).max(80),
  maxTeams: z.number().min(2).max(20).optional(),
  draftType: z.enum(["snake", "auction"]).optional(),
  draftMode: z.enum(["live", "async"]).optional(),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    const { data: teams, error } = await supabase
      .from("teams")
      .select(
        `
        id,
        team_name,
        total_points,
        rank,
        leagues (
          id,
          name,
          status,
          invite_code,
          commissioner_id,
          season
        )
      `,
      )
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(fail(error.message, 500), { status: 500 });
    }

    return NextResponse.json(ok(teams ?? []), { status: 200 });
  } catch (e) {
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    const body = createSchema.parse(await request.json());

    const { data: league, error: leErr } = await supabase
      .from("leagues")
      .insert({
        name: body.name,
        commissioner_id: user.id,
        max_teams: body.maxTeams ?? 10,
        draft_type: body.draftType ?? "snake",
        draft_mode: body.draftMode ?? "live",
      })
      .select()
      .single();

    if (leErr || !league) {
      return NextResponse.json(
        fail(leErr?.message ?? "Could not create league", 400),
        { status: 400 },
      );
    }

    const { data: team, error: tErr } = await supabase
      .from("teams")
      .insert({
        league_id: league.id,
        user_id: user.id,
        team_name: body.teamName,
        draft_position: 1,
      })
      .select()
      .single();

    if (tErr || !team) {
      return NextResponse.json(fail(tErr?.message ?? "Could not create team", 400), {
        status: 400,
      });
    }

    const payload = { league, team };
    return NextResponse.json(ok(payload) as ApiResponse<typeof payload>, {
      status: 201,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
