import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api-response";
import { sendTransactionalEmail } from "@/lib/resend";
import { draftInviteEmail } from "@/emails/draft_invite";
import { logger } from "@/lib/logger";

const schema = z.object({
  leagueId: z.string().uuid(),
  to: z.string().email(),
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

    const body = schema.parse(await request.json());
    const { data: league } = await supabase.from("leagues").select("*").eq("id", body.leagueId).single();

    if (!league || league.commissioner_id !== user.id) {
      return NextResponse.json(fail("Forbidden", 403), { status: 403 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const html = draftInviteEmail({
      leagueName: league.name,
      inviteCode: league.invite_code ?? "",
      appUrl,
    });

    const result = await sendTransactionalEmail({
      to: body.to,
      subject: `Join ${league.name} on PitchIQ`,
      html,
    });

    if (!result.ok) {
      return NextResponse.json(fail(result.error ?? "Email failed", 502), { status: 502 });
    }

    return NextResponse.json(ok({ sent: true }), { status: 200 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
