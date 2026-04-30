import { PL_LEAGUE_ID } from "@/lib/utils/constants";
import { logger } from "@/lib/logger";

const FOOTBALL_BASE = "https://v3.football.api-sports.io";

export type ApiFootballPlayer = {
  player: {
    id: number;
    name: string;
    firstname?: string;
    lastname?: string;
    age?: number;
    nationality?: string;
    photo?: string;
  };
  statistics?: Array<{
    team?: { name?: string };
    games?: { position?: string };
  }>;
};

export type PlayersPageResponse = {
  results: number;
  paging: { current: number; total: number };
  response: ApiFootballPlayer[];
};

/**
 * One page of PL players from api-football. Uses FOOTBALL_API_KEY for the
 * X-RapidAPI-Key header — the rest of pagination is handled by the caller.
 */
export async function fetchPlayersPage(
  season: number,
  page: number,
): Promise<PlayersPageResponse> {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) {
    throw new Error("FOOTBALL_API_KEY is not set");
  }

  const url = new URL(`${FOOTBALL_BASE}/players`);
  url.searchParams.set("league", String(PL_LEAGUE_ID));
  url.searchParams.set("season", String(season));
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": "v3.football.api-sports.io",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("API-Football players error", res.status, text);
    throw new Error(`API-Football error ${res.status}`);
  }

  return res.json() as Promise<PlayersPageResponse>;
}

// Reshape an api-football payload into our players-table insert shape.
export function mapApiPlayerToRow(entry: ApiFootballPlayer) {
  const p = entry.player;
  const stat = entry.statistics?.[0];
  const teamName = stat?.team?.name ?? "Unknown";
  const posRaw = stat?.games?.position ?? "M";
  const position = mapPosition(posRaw);

  return {
    api_id: p.id,
    name: p.name,
    photo_url: p.photo ?? null,
    club: teamName,
    club_short: null as string | null,
    position,
    nationality: p.nationality ?? null,
    age: p.age ?? null,
    total_points: 0,
    form: "0",
    price: null as string | null,
    ownership_pct: "0",
    injury_status: "available" as const,
    injury_detail: null as string | null,
  };
}

function mapPosition(apiPos: string): "GK" | "DEF" | "MID" | "FWD" {
  const u = apiPos.toUpperCase();
  if (u === "G" || u === "GOALKEEPER") return "GK";
  if (u === "D" || u === "DEFENDER" || u === "DEFENCE") return "DEF";
  if (u === "F" || u === "ATTACKER" || u === "FORWARD" || u === "STRIKER")
    return "FWD";
  return "MID";
}
