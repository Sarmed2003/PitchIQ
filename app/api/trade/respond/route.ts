import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api-response";
import { logger } from "@/lib/logger";

const schema = z.object({
  tradeId: z.string().uuid(),
  accept: z.boolean(),
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

    if (!body.accept) {
      // Reject: single UPDATE, no roster mutation, RLS handles authorisation.
      const { error: rejErr } = await supabase
        .from("trades")
        .update({ status: "rejected", responded_at: new Date().toISOString() })
        .eq("id", body.tradeId)
        .eq("status", "pending");
      if (rejErr) {
        return NextResponse.json(fail(rejErr.message, 400), { status: 400 });
      }
      return NextResponse.json(ok({ status: "rejected" }), { status: 200 });
    }

    // Accept: the swap runs inside a single Postgres transaction via RPC so a
    // mid-swap failure cannot leave one team richer and the other poorer.
    // The RPC verifies caller identity + trade state itself.
    const { error: rpcErr } = await supabase.rpc("accept_trade", {
      p_trade_id: body.tradeId,
    });
    if (rpcErr) {
      const status = rpcErr.code === "42501" ? 403 : 400;
      return NextResponse.json(fail(rpcErr.message, status), { status });
    }

    return NextResponse.json(ok({ status: "accepted" }), { status: 200 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(fail(e.message, 400), { status: 400 });
    }
    logger.error(e);
    return NextResponse.json(fail("Internal error", 500), { status: 500 });
  }
}
