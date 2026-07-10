import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LineupPayload, FORMATION_COUNTS, type Formation } from "@/lib/lineup/schema";
import { readGameweekFromSettings, SEASON } from "@/lib/gameweek";
import { checkRateLimit } from "@/lib/upstash";
import { readIdempotent, writeIdempotent } from "@/lib/idempotency";

export const runtime = "nodejs";

type Params = { params: Promise<{ teamId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { teamId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: team } = await supabase
    .from("teams")
    .select("id, league_id, user_id")
    .eq("id", teamId)
    .maybeSingle();
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!team.league_id) return NextResponse.json({ error: "Team missing league" }, { status: 400 });

  const { data: league } = await supabase
    .from("leagues")
    .select("id, settings")
    .eq("id", team.league_id)
    .maybeSingle();
  const gw = readGameweekFromSettings(league?.settings ?? null);

  const { data: lineup } = await supabase
    .from("lineups")
    .select("*")
    .eq("team_id", teamId)
    .eq("gameweek", gw.gameweek)
    .eq("season", gw.season)
    .maybeSingle();

  return NextResponse.json({
    team,
    gameweek: gw,
    lineup: lineup ?? null,
    isOwner: team.user_id === user.id,
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { teamId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: team } = await supabase
    .from("teams")
    .select("id, league_id, user_id")
    .eq("id", teamId)
    .maybeSingle();
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (team.user_id !== user.id)
    return NextResponse.json({ error: "Only the team owner can edit lineups" }, { status: 403 });
  if (!team.league_id)
    return NextResponse.json({ error: "Team missing league" }, { status: 400 });

  const rl = await checkRateLimit(user.id, {
    key: "lineup-edit",
    limit: 30,
    windowSeconds: 300,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many lineup edits, slow down a bit." },
      { status: 429 },
    );
  }

  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) {
    const cached = await readIdempotent(supabase, user.id, idempotencyKey);
    if (cached) return NextResponse.json(cached);
  }

  const { data: league } = await supabase
    .from("leagues")
    .select("id, settings")
    .eq("id", team.league_id)
    .maybeSingle();
  const gw = readGameweekFromSettings(league?.settings ?? null);
  if (gw.locked) {
    return NextResponse.json(
      { error: "Lineup deadline has passed for this gameweek." },
      { status: 423 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = LineupPayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const payload = parsed.data;

  // Every player in the payload must already be on this team's roster.
  const playerIds = [
    ...payload.starters.map((s) => s.player_id),
    ...payload.bench.map((b) => b.player_id),
  ];
  const uniquePlayerIds = [...new Set(playerIds)];
  if (uniquePlayerIds.length !== playerIds.length) {
    return NextResponse.json({ error: "Duplicate player in starters/bench" }, { status: 400 });
  }

  const { data: roster } = await supabase
    .from("roster_slots")
    .select("player_id")
    .eq("team_id", teamId);
  const rosterIds = new Set((roster ?? []).map((r) => r.player_id).filter((x): x is number => x != null));
  for (const id of uniquePlayerIds) {
    if (!rosterIds.has(id)) {
      return NextResponse.json(
        { error: `Player ${id} is not on this team's roster` },
        { status: 400 },
      );
    }
  }

  // Position counts must match the chosen formation.
  const formation = payload.formation as Formation;
  const counts = FORMATION_COUNTS[formation];
  const { data: positions } = await supabase
    .from("players")
    .select("id, position")
    .in("id", payload.starters.map((s) => s.player_id));
  const posById = new Map((positions ?? []).map((p) => [p.id, p.position]));
  let gks = 0,
    defs = 0,
    mids = 0,
    fwds = 0;
  for (const s of payload.starters) {
    const pos = posById.get(s.player_id);
    if (pos === "GK") gks++;
    else if (pos === "DEF") defs++;
    else if (pos === "MID") mids++;
    else if (pos === "FWD") fwds++;
  }
  if (gks !== 1 || defs !== counts.DEF || mids !== counts.MID || fwds !== counts.FWD) {
    return NextResponse.json(
      {
        error: `Formation ${formation} requires 1 GK / ${counts.DEF} DEF / ${counts.MID} MID / ${counts.FWD} FWD; received ${gks}/${defs}/${mids}/${fwds}`,
      },
      { status: 400 },
    );
  }

  // Captain & vice must be in the XI and different.
  const starterIds = new Set(payload.starters.map((s) => s.player_id));
  if (payload.captain_player_id && !starterIds.has(payload.captain_player_id)) {
    return NextResponse.json({ error: "Captain must be in the starting XI" }, { status: 400 });
  }
  if (payload.vice_player_id && !starterIds.has(payload.vice_player_id)) {
    return NextResponse.json({ error: "Vice captain must be in the starting XI" }, { status: 400 });
  }
  if (
    payload.captain_player_id &&
    payload.vice_player_id &&
    payload.captain_player_id === payload.vice_player_id
  ) {
    return NextResponse.json(
      { error: "Captain and vice captain must be different players" },
      { status: 400 },
    );
  }

  const { error: upsertErr } = await supabase
    .from("lineups")
    .upsert(
      {
        team_id: teamId,
        league_id: team.league_id,
        gameweek: gw.gameweek,
        season: gw.season || SEASON,
        formation: payload.formation,
        starters: payload.starters,
        bench: payload.bench,
        captain_player_id: payload.captain_player_id,
        vice_player_id: payload.vice_player_id,
        chip: payload.chip ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_id,gameweek,season" },
    );

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  const result = { ok: true, gameweek: gw.gameweek };
  if (idempotencyKey) {
    await writeIdempotent(supabase, user.id, idempotencyKey, result);
  }
  return NextResponse.json(result);
}
