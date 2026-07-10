import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const schema = z.object({
  leagueId: z.string().uuid(),
  extendSeconds: z.number().min(10).max(600).optional(),
});

// Commissioner-only: extend or reset the running pick clock.
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
    const add = body.extendSeconds ?? 30;

    const { data: league } = await supabase.from("leagues").select("commissioner_id").eq("id", body.leagueId).single();
    if (!league || league.commissioner_id !== user.id) {
      return NextResponse.json(fail("Forbidden", 403), { status: 403 });
    }

    const admin = createAdminSupabaseClient();
    const { data: session } = await admin
      .from("draft_sessions")
      .select("id, pick_deadline")
      .eq("league_id", body.leagueId)
      .eq("status", "active")
      .maybeSingle();

    if (!session) {
      return NextResponse.json(fail("No active draft", 400), { status: 400 });
    }

    const base = session.pick_deadline ? new Date(session.pick_deadline).getTime() : Date.now();
    const next = new Date(Math.max(Date.now(), base) + add * 1000).toISOString();

    await admin.from("draft_sessions").update({ pick_deadline: next }).eq("id", session.id);

    return NextResponse.json(ok({ pick_deadline: next }), { status: 200 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
