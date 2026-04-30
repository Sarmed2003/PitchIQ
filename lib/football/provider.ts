/**
 * Adapter layer for whichever football data API we're paying for. Right now
 * we only ship the api-football (api-sports.io) implementation, but if we
 * swap to Sportmonks or Stats Perform the sync jobs above don't have to
 * change — they go through this interface.
 */

import { logger } from "@/lib/logger";

export type ProviderPlayer = {
  apiId: number;
  name: string;
  photoUrl: string | null;
  club: string;
  clubShort: string | null;
  position: "GK" | "DEF" | "MID" | "FWD";
  nationality: string | null;
  age: number | null;
  shirtNumber: number | null;
  injuryStatus: "available" | "doubtful" | "injured" | "suspended";
};

export type ProviderFixture = {
  apiId: number;
  homeClub: string;
  awayClub: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  live: boolean;
  startsAt: string; // ISO
  status: string;
};

export type ProviderPlayerMatchStat = {
  fixtureId: number;
  playerApiId: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  yellowCards: number;
  redCards: number;
  saves: number;
  bonus: number;
  raw: unknown;
};

export interface FootballDataProvider {
  name: string;
  // Every PL player for a season. Implementations handle pagination internally.
  fetchAllPlayers(season: number): Promise<ProviderPlayer[]>;
  // Fixtures for a season, optionally filtered to in-progress matches.
  fetchFixtures(season: number, opts?: { live?: boolean; gameweek?: number }): Promise<ProviderFixture[]>;
  // Per-player stat lines for one fixture, feeds the scoring engine.
  fetchFixturePlayerStats(fixtureApiId: number): Promise<ProviderPlayerMatchStat[]>;
}

// -----------------------------------------------------------------------------
// api-football.com adapter
// -----------------------------------------------------------------------------

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const PL_LEAGUE = 39;

type RawApiPlayer = {
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
};

type RawApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
  };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
};

type RawApiFixtureStats = {
  response?: Array<{
    team?: { name?: string };
    players?: Array<{
      player: { id: number; name: string };
      statistics: Array<{
        games?: { minutes?: number };
        goals?: { total?: number; assists?: number; saves?: number };
        cards?: { yellow?: number; red?: number };
        defense?: { saves?: number };
        offsides?: number;
      }>;
    }>;
  }>;
};

function mapPosition(apiPos?: string): ProviderPlayer["position"] {
  const u = (apiPos ?? "M").toUpperCase();
  if (u === "G" || u === "GOALKEEPER") return "GK";
  if (u === "D" || u === "DEFENDER" || u === "DEFENCE") return "DEF";
  if (u === "F" || u === "ATTACKER" || u === "FORWARD" || u === "STRIKER") return "FWD";
  return "MID";
}

function fetchFromApi(
  url: URL,
  apiKey: string,
): Promise<Response> {
  return fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "v3.football.api-sports.io",
    },
    cache: "no-store",
  });
}

export function createApiFootballProvider(apiKey: string): FootballDataProvider {
  if (!apiKey) {
    throw new Error("api-football: missing API key");
  }

  return {
    name: "api-football",

    async fetchAllPlayers(season: number) {
      const out: ProviderPlayer[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const url = new URL(`${API_FOOTBALL_BASE}/players`);
        url.searchParams.set("league", String(PL_LEAGUE));
        url.searchParams.set("season", String(season));
        url.searchParams.set("page", String(page));
        const res = await fetchFromApi(url, apiKey);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          logger.error("api-football players error", res.status, text);
          throw new Error(`api-football players: ${res.status}`);
        }
        const body = (await res.json()) as {
          paging?: { current: number; total: number };
          response: RawApiPlayer[];
        };
        totalPages = body.paging?.total ?? 1;
        for (const entry of body.response ?? []) {
          const p = entry.player;
          const stat = entry.statistics?.[0];
          const club = stat?.team?.name ?? "Unknown";
          const clubShort = stat?.team?.code ?? null;
          const shirt = p.number ?? stat?.games?.number ?? null;
          out.push({
            apiId: p.id,
            name: p.name,
            photoUrl: p.photo ?? null,
            club,
            clubShort,
            position: mapPosition(stat?.games?.position),
            nationality: p.nationality ?? null,
            age: p.age ?? null,
            shirtNumber: typeof shirt === "number" ? shirt : null,
            injuryStatus: p.injured ? "injured" : "available",
          });
        }
        page += 1;
      } while (page <= totalPages);
      return out;
    },

    async fetchFixtures(season, opts) {
      const url = new URL(`${API_FOOTBALL_BASE}/fixtures`);
      url.searchParams.set("league", String(PL_LEAGUE));
      url.searchParams.set("season", String(season));
      if (opts?.live) url.searchParams.set("live", "all");
      if (opts?.gameweek) url.searchParams.set("round", `Regular Season - ${opts.gameweek}`);
      const res = await fetchFromApi(url, apiKey);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        logger.error("api-football fixtures error", res.status, text);
        throw new Error(`api-football fixtures: ${res.status}`);
      }
      const body = (await res.json()) as { response: RawApiFixture[] };
      return (body.response ?? []).map<ProviderFixture>((f) => ({
        apiId: f.fixture.id,
        homeClub: f.teams.home.name,
        awayClub: f.teams.away.name,
        homeScore: f.goals.home ?? 0,
        awayScore: f.goals.away ?? 0,
        minute: f.fixture.status.elapsed ?? 0,
        live: ["1H", "2H", "ET", "P", "LIVE"].includes(f.fixture.status.short),
        startsAt: f.fixture.date,
        status: f.fixture.status.short,
      }));
    },

    async fetchFixturePlayerStats(fixtureApiId) {
      const url = new URL(`${API_FOOTBALL_BASE}/fixtures/players`);
      url.searchParams.set("fixture", String(fixtureApiId));
      const res = await fetchFromApi(url, apiKey);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        logger.error("api-football fixture stats error", res.status, text);
        throw new Error(`api-football fixture stats: ${res.status}`);
      }
      const body = (await res.json()) as RawApiFixtureStats;
      const out: ProviderPlayerMatchStat[] = [];
      for (const team of body.response ?? []) {
        for (const pl of team.players ?? []) {
          const s = pl.statistics?.[0];
          if (!s) continue;
          out.push({
            fixtureId: fixtureApiId,
            playerApiId: pl.player.id,
            minutesPlayed: s.games?.minutes ?? 0,
            goals: s.goals?.total ?? 0,
            assists: s.goals?.assists ?? 0,
            cleanSheet: false, // computed by scoring engine using fixture goals
            yellowCards: s.cards?.yellow ?? 0,
            redCards: s.cards?.red ?? 0,
            saves: s.goals?.saves ?? s.defense?.saves ?? 0,
            bonus: 0,
            raw: pl,
          });
        }
      }
      return out;
    },
  };
}

// -----------------------------------------------------------------------------
// Default provider resolution from env
// -----------------------------------------------------------------------------

export function resolveProvider(): FootballDataProvider {
  const provider = process.env.FOOTBALL_API_PROVIDER ?? "api-football";
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) {
    throw new Error(
      "FOOTBALL_API_KEY not set. Add it to .env.local and Vercel + Supabase secrets.",
    );
  }
  switch (provider) {
    case "api-football":
      return createApiFootballProvider(key);
    default:
      throw new Error(`Unsupported FOOTBALL_API_PROVIDER: ${provider}`);
  }
}
