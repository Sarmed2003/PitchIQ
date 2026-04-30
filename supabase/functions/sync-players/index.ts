import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const FOOTBALL_BASE = "https://v3.football.api-sports.io";
const PL_LEAGUE = 39;

type ApiResponse = {
  paging: { current: number; total: number };
  response: Array<{
    player: {
      id: number;
      name: string;
      age?: number;
      nationality?: string;
      photo?: string;
      number?: number;
      injured?: boolean;
    };
    statistics?: Array<{
      team?: { name?: string; code?: string };
      games?: { position?: string; number?: number };
    }>;
  }>;
};

function mapPosition(apiPos: string): string {
  const u = apiPos.toUpperCase();
  if (u === "G" || u === "GOALKEEPER") return "GK";
  if (u === "D" || u === "DEFENDER") return "DEF";
  if (u === "F" || u === "ATTACKER" || u === "FORWARD") return "FWD";
  return "MID";
}

function authorize(req: Request): boolean {
  const expected = Deno.env.get("CRON_SHARED_SECRET");
  if (!expected) return true; // no secret configured = open (dev only)
  const got = req.headers.get("x-cron-secret");
  return got === expected;
}

Deno.serve(async (req) => {
  if (!authorize(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const footballKey = Deno.env.get("FOOTBALL_API_KEY");
  const season = Number(Deno.env.get("FOOTBALL_SEASON") ?? "2025");

  if (!supabaseUrl || !serviceKey || !footballKey) {
    return new Response(JSON.stringify({ error: "Missing env" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  let page = 1;
  let totalPages = 1;
  let upserted = 0;

  do {
    const url = new URL(`${FOOTBALL_BASE}/players`);
    url.searchParams.set("league", String(PL_LEAGUE));
    url.searchParams.set("season", String(season));
    url.searchParams.set("page", String(page));

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

    const body = (await res.json()) as ApiResponse;
    totalPages = body.paging?.total ?? 1;

    const rows = (body.response ?? []).map((entry) => {
      const p = entry.player;
      const st = entry.statistics?.[0];
      const teamName = st?.team?.name ?? "Unknown";
      const teamShort = st?.team?.code ?? null;
      const pos = mapPosition(st?.games?.position ?? "M");
      const shirt = p.number ?? st?.games?.number ?? null;
      return {
        api_id: p.id,
        name: p.name,
        photo_url: p.photo ?? null,
        club: teamName,
        club_short: teamShort,
        position: pos,
        nationality: p.nationality ?? null,
        age: p.age ?? null,
        shirt_number: typeof shirt === "number" ? shirt : null,
        injury_status: p.injured ? "injured" : "available",
      };
    });

    if (rows.length > 0) {
      const { error } = await supabase.from("players").upsert(rows, {
        onConflict: "api_id",
      });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      upserted += rows.length;
    }

    page += 1;
  } while (page <= totalPages);

  return new Response(JSON.stringify({ ok: true, upserted }), {
    headers: { "Content-Type": "application/json" },
  });
});
