import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/upstash";
import { readIdempotent, writeIdempotent } from "@/lib/idempotency";

export const runtime = "nodejs";

const ClaimBody = z.object({
  team_id: z.string().uuid(),
  add_player_id: z.number().int().positive(),
  drop_player_id: z.number().int().positive().nullable().optional(),
  priority: z.number().int().min(1).max(50).default(1),
  faab_bid: z.number().int().min(0).max(1000).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const teamId = url.searchParams.get("team_id");
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("waiver_claims")
    .select("*")
    .order("created_at", { ascending: false });
  if (teamId) query = query.eq("team_id", teamId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ claims: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 20 claims / hour is comfortably above any normal use.
  const rl = await checkRateLimit(user.id, {
    key: "waiver-claim",
    limit: 20,
    windowSeconds: 3600,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Waiver claim rate limit reached for this hour." },
      { status: 429 },
    );
  }

  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) {
    const cached = await readIdempotent(supabase, user.id, idempotencyKey);
    if (cached) return NextResponse.json(cached, { status: 201 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ClaimBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { team_id, add_player_id, drop_player_id, priority, faab_bid } = parsed.data;

  const { data: team } = await supabase
    .from("teams")
    .select("id, league_id, user_id")
    .eq("id", team_id)
    .maybeSingle();
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.user_id !== user.id)
    return NextResponse.json({ error: "Not your team" }, { status: 403 });

  // Can't claim someone already rostered — they'd need a trade instead.
  const { data: rostered } = await supabase
    .from("teams")
    .select("id, roster_slots(player_id)")
    .eq("league_id", team.league_id);
  type RowWithRoster = { id: string; roster_slots: { player_id: number | null }[] | null };
  const rosteredIds = new Set<number>();
  for (const t of (rostered ?? []) as unknown as RowWithRoster[]) {
    for (const r of t.roster_slots ?? []) {
      if (r.player_id != null) rosteredIds.add(r.player_id);
    }
  }
  if (rosteredIds.has(add_player_id)) {
    return NextResponse.json(
      { error: "That player is already on a roster — make a trade instead." },
      { status: 400 },
    );
  }

  // If they're dropping someone, that player has to be on their team.
  if (drop_player_id != null) {
    const { data: ownsDrop } = await supabase
      .from("roster_slots")
      .select("id")
      .eq("team_id", team_id)
      .eq("player_id", drop_player_id)
      .maybeSingle();
    if (!ownsDrop) {
      return NextResponse.json(
        { error: "Drop player is not on your roster" },
        { status: 400 },
      );
    }
  }

  const { data: inserted, error: insErr } = await supabase
    .from("waiver_claims")
    .insert({
      league_id: team.league_id,
      team_id,
      add_player_id,
      drop_player_id: drop_player_id ?? null,
      priority,
      faab_bid: faab_bid ?? 0,
    })
    .select("*")
    .single();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const result = { claim: inserted };
  if (idempotencyKey) {
    await writeIdempotent(supabase, user.id, idempotencyKey, result);
  }
  return NextResponse.json(result, { status: 201 });
}
