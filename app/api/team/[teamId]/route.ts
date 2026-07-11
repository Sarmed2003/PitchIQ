import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const patchSchema = z.object({
  teamName: z.string().min(2).max(80),
});

type Params = { params: Promise<{ teamId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { teamId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    const body = patchSchema.parse(await request.json());

    const { data: team } = await supabase
      .from("teams")
      .select("id, user_id")
      .eq("id", teamId)
      .maybeSingle();
    if (!team) {
      return NextResponse.json(fail("Team not found", 404), { status: 404 });
    }
    if (team.user_id !== user.id) {
      return NextResponse.json(fail("Forbidden", 403), { status: 403 });
    }

    const { error } = await supabase
      .from("teams")
      .update({ team_name: body.teamName })
      .eq("id", teamId);
    if (error) {
      return NextResponse.json(fail(error.message, 400), { status: 400 });
    }

    return NextResponse.json(ok({ updated: true }), { status: 200 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error("team/[teamId] PATCH", e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { teamId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    const { data: team } = await supabase
      .from("teams")
      .select("id, user_id, league_id")
      .eq("id", teamId)
      .maybeSingle();
    if (!team) {
      return NextResponse.json(fail("Team not found", 404), { status: 404 });
    }

    const { data: league } = team.league_id
      ? await supabase
          .from("leagues")
          .select("commissioner_id")
          .eq("id", team.league_id)
          .maybeSingle()
      : { data: null };

    const isOwner = team.user_id === user.id;
    const isCommissioner = league?.commissioner_id === user.id;
    if (!isOwner && !isCommissioner) {
      return NextResponse.json(fail("Forbidden", 403), { status: 403 });
    }

    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) {
      return NextResponse.json(fail(error.message, 400), { status: 400 });
    }

    return NextResponse.json(ok({ deleted: true }), { status: 200 });
  } catch (e) {
    logger.error("team/[teamId] DELETE", e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
