import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/api-response";
import { resolveProvider } from "@/lib/football/provider";
import { checkRateLimit } from "@/lib/upstash";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/database.types";

type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];

export const runtime = "nodejs";
export const maxDuration = 60;

// Pulls fresh player data from the football provider and upserts into Postgres.
// Commissioner-only, capped at 2 runs/day per user via Upstash so the free
// api-football quota survives the season.
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(fail("Unauthorized", 401), { status: 401 });
    }

    // Must run a league to trigger this.
    const { count: commishCount } = await supabase
      .from("leagues")
      .select("id", { count: "exact", head: true })
      .eq("commissioner_id", user.id);

    if (!commishCount) {
      return NextResponse.json(
        fail("Only league commissioners can trigger sync", 403),
        { status: 403 },
      );
    }

    // Free api-football plans give 100 req/day; full sync uses ~50 of those.
    const rl = await checkRateLimit(user.id, {
      key: "sync:players",
      limit: 2,
      windowSeconds: 24 * 60 * 60,
    });
    if (!rl.success) {
      return NextResponse.json(
        fail("Sync limit reached for today. Try again tomorrow.", 429),
        { status: 429 },
      );
    }

    const season = Number(process.env.FOOTBALL_SEASON ?? "2025");
    const provider = resolveProvider();

    let players;
    try {
      players = await provider.fetchAllPlayers(season);
    } catch (e) {
      logger.error("provider.fetchAllPlayers failed", e);
      return NextResponse.json(
        fail(e instanceof Error ? e.message : "Provider failed", 502),
        { status: 502 },
      );
    }

    if (!players.length) {
      return NextResponse.json(ok({ upserted: 0, season, provider: provider.name }), {
        status: 200,
      });
    }

    const admin = createAdminSupabaseClient();
    const rows: PlayerInsert[] = players.map((p) => ({
      api_id: p.apiId,
      name: p.name,
      photo_url: p.photoUrl,
      club: p.club,
      club_short: p.clubShort,
      position: p.position,
      nationality: p.nationality,
      age: p.age,
      shirt_number: p.shirtNumber,
      injury_status: p.injuryStatus,
    }));

    const { error: upsertErr, count } = await admin
      .from("players")
      .upsert(rows, { onConflict: "api_id", count: "exact" });

    if (upsertErr) {
      return NextResponse.json(fail(upsertErr.message, 500), { status: 500 });
    }

    return NextResponse.json(
      ok({
        upserted: count ?? rows.length,
        season,
        provider: provider.name,
        triggeredBy: user.id,
      }),
      { status: 200 },
    );
  } catch (e) {
    logger.error("sync/players", e);
    return NextResponse.json(
      fail(e instanceof Error ? e.message : "Internal error", 500),
      { status: 500 },
    );
  }
}
