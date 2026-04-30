import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Params = { params: Promise<{ claimId: string }> };

const PatchBody = z.object({
  priority: z.number().int().min(1).max(50).optional(),
  faab_bid: z.number().int().min(0).max(1000).optional(),
  drop_player_id: z.number().int().positive().nullable().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const { claimId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });

  const { data: claim } = await supabase
    .from("waiver_claims")
    .select("id, status, team_id, teams!inner(user_id)")
    .eq("id", claimId)
    .maybeSingle();
  if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (claim.status !== "pending")
    return NextResponse.json({ error: "Claim already processed" }, { status: 400 });

  const { error } = await supabase
    .from("waiver_claims")
    .update(parsed.data)
    .eq("id", claimId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { claimId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: claim } = await supabase
    .from("waiver_claims")
    .select("id, status")
    .eq("id", claimId)
    .maybeSingle();
  if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (claim.status !== "pending")
    return NextResponse.json({ error: "Claim already processed" }, { status: 400 });

  const { error } = await supabase
    .from("waiver_claims")
    .update({ status: "cancelled", processed_at: new Date().toISOString() })
    .eq("id", claimId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
