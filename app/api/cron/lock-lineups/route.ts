import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readGameweekFromSettings } from "@/lib/gameweek";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stamps `locked_at` on any lineup whose league deadline has passed so the
// PUT route refuses further edits. Vercel Cron hits this every 5 minutes.
// Requires the CRON_SECRET bearer token.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const now = new Date();

  const { data: leagues, error: leaguesErr } = await admin
    .from("leagues")
    .select("id, settings");
  if (leaguesErr) {
    return NextResponse.json({ error: leaguesErr.message }, { status: 500 });
  }

  let locked = 0;
  let skipped = 0;
  for (const l of leagues ?? []) {
    const gw = readGameweekFromSettings(l.settings ?? null, now);
    if (!gw.locked || !gw.deadline) {
      skipped++;
      continue;
    }

    const { data: open } = await admin
      .from("lineups")
      .select("id")
      .eq("league_id", l.id)
      .eq("gameweek", gw.gameweek)
      .eq("season", gw.season)
      .is("locked_at", null);

    if (!open || open.length === 0) {
      skipped++;
      continue;
    }

    const { error: updErr } = await admin
      .from("lineups")
      .update({ locked_at: now.toISOString() })
      .eq("league_id", l.id)
      .eq("gameweek", gw.gameweek)
      .eq("season", gw.season)
      .is("locked_at", null);

    if (updErr) {
      return NextResponse.json({ error: updErr.message, locked, skipped }, { status: 500 });
    }
    locked += open.length;
  }

  return NextResponse.json({ ok: true, locked, skipped, at: now.toISOString() });
}
