import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const FOOTBALL_BASE = "https://v3.football.api-sports.io";
const PL_LEAGUE = 39;

/** Minimal gameweek sync: fetch live fixtures and log count (stats enrichment in follow-up). */
Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const footballKey = Deno.env.get("FOOTBALL_API_KEY");
  const season = Number(Deno.env.get("FOOTBALL_SEASON") ?? "2025");

  if (!supabaseUrl || !serviceKey || !footballKey) {
    return new Response(JSON.stringify({ error: "Missing env" }), { status: 500 });
  }

  const _supabase = createClient(supabaseUrl, serviceKey);

  const url = new URL(`${FOOTBALL_BASE}/fixtures`);
  url.searchParams.set("league", String(PL_LEAGUE));
  url.searchParams.set("season", String(season));
  url.searchParams.set("live", "all");

  const res = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": footballKey,
      "X-RapidAPI-Host": "v3.football.api-sports.io",
    },
  });

  if (!res.ok) {
    const t = await res.text();
    return new Response(JSON.stringify({ error: t }), { status: 502 });
  }

  const body = (await res.json()) as { response?: unknown[] };
  const liveCount = body.response?.length ?? 0;

  return new Response(
    JSON.stringify({
      ok: true,
      liveFixtures: liveCount,
      note: "Wire fixture statistics + scoring.ts in a follow-up cron step.",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
