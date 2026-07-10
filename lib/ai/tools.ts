import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Tool set exposed to the AI assistant. Each tool queries through the
// caller's Supabase client, so RLS scopes results to leagues/teams the
// user belongs to.
export function buildAssistantTools(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  return {
    getMyLeagues: tool({
      description:
        "Lists the leagues the current user is in, with their team name in each. Call this first when the user asks anything league-related and you don't already know which league they mean.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("teams")
          .select("id, team_name, league_id, leagues(name, status, scoring_system)")
          .eq("user_id", userId);
        if (error) return { error: error.message };
        return {
          leagues: (data ?? []).map((t) => ({
            teamId: t.id,
            teamName: t.team_name,
            leagueId: t.league_id,
            leagueName: t.leagues?.name ?? "(unknown)",
            status: t.leagues?.status ?? null,
          })),
        };
      },
    }),

    getMyTeam: tool({
      description:
        "Returns the current user's roster for a specific team — players with position, club, total points, and injury status. Use this before any captain / start-or-sit / lineup question.",
      inputSchema: z.object({
        teamId: z.string().describe("UUID of the user's team. Get it from getMyLeagues if you don't have it."),
      }),
      execute: async ({ teamId }) => {
        const { data: team, error: tErr } = await supabase
          .from("teams")
          .select("id, team_name, league_id, user_id")
          .eq("id", teamId)
          .single();
        if (tErr || !team) return { error: tErr?.message ?? "Team not found" };
        if (team.user_id !== userId) return { error: "Not your team" };

        const { data: slots, error: sErr } = await supabase
          .from("roster_slots")
          .select("player_id")
          .eq("team_id", teamId);
        if (sErr) return { error: sErr.message };
        const playerIds = (slots ?? [])
          .map((s) => s.player_id)
          .filter((id): id is number => id != null);
        if (playerIds.length === 0) {
          return { teamId, teamName: team.team_name, leagueId: team.league_id, rosterSize: 0, players: [] };
        }
        const { data: players, error: pErr } = await supabase
          .from("players")
          .select("id, name, position, club_short, club, shirt_number, total_points, form, injury_status")
          .in("id", playerIds);
        if (pErr) return { error: pErr.message };

        return {
          teamId,
          teamName: team.team_name,
          leagueId: team.league_id,
          rosterSize: players?.length ?? 0,
          players: (players ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            position: p.position,
            club: p.club_short ?? p.club,
            shirtNumber: p.shirt_number,
            totalPoints: p.total_points ?? 0,
            form: p.form ?? null,
            injury: p.injury_status ?? null,
          })),
        };
      },
    }),

    getFreeAgents: tool({
      description:
        "Top free agents in a league, optionally filtered by position. Use this before a waiver/add suggestion.",
      inputSchema: z.object({
        leagueId: z.string(),
        position: z.enum(["GK", "DEF", "MID", "FWD"]).optional(),
        limit: z.number().min(1).max(20).default(10),
      }),
      execute: async ({ leagueId, position, limit }) => {
        const { data: leagueTeams } = await supabase
          .from("teams")
          .select("id")
          .eq("league_id", leagueId);
        const teamIds = (leagueTeams ?? []).map((t) => t.id);
        const rosteredIds = new Set<number>();
        if (teamIds.length > 0) {
          const { data: rostered } = await supabase
            .from("roster_slots")
            .select("player_id")
            .in("team_id", teamIds);
          for (const r of rostered ?? []) {
            if (r.player_id != null) rosteredIds.add(r.player_id);
          }
        }

        let q = supabase
          .from("players")
          .select("id, name, position, club_short, club, total_points, form, injury_status")
          .order("total_points", { ascending: false })
          .limit(limit + rosteredIds.size);
        if (position) q = q.eq("position", position);
        const { data, error } = await q;
        if (error) return { error: error.message };

        const free = (data ?? [])
          .filter((p) => !rosteredIds.has(p.id))
          .slice(0, limit)
          .map((p) => ({
            id: p.id,
            name: p.name,
            position: p.position,
            club: p.club_short ?? p.club,
            totalPoints: p.total_points ?? 0,
            form: p.form ?? null,
            injury: p.injury_status ?? null,
          }));

        return { leagueId, position: position ?? "all", freeAgents: free };
      },
    }),

    getLeagueStandings: tool({
      description:
        "Current standings for a league — every team with rank, total points, and gameweek points. Useful for waiver-priority context and trash talk.",
      inputSchema: z.object({ leagueId: z.string() }),
      execute: async ({ leagueId }) => {
        const { data, error } = await supabase
          .from("teams")
          .select("id, team_name, total_points, gameweek_points, rank")
          .eq("league_id", leagueId)
          .order("rank", { ascending: true, nullsFirst: false });
        if (error) return { error: error.message };
        return {
          leagueId,
          standings: (data ?? []).map((t) => ({
            teamId: t.id,
            teamName: t.team_name,
            rank: t.rank,
            totalPoints: t.total_points ?? 0,
            lastGameweekPoints: t.gameweek_points ?? 0,
          })),
        };
      },
    }),

    suggestCaptain: tool({
      description:
        "Picks the best captain candidate from the user's roster based on form and total points. Returns top 3 options ranked.",
      inputSchema: z.object({ teamId: z.string() }),
      execute: async ({ teamId }) => {
        const { data: team } = await supabase
          .from("teams")
          .select("user_id")
          .eq("id", teamId)
          .single();
        if (!team || team.user_id !== userId) return { error: "Not your team" };

        const { data: slots } = await supabase
          .from("roster_slots")
          .select("player_id")
          .eq("team_id", teamId);
        const playerIds = (slots ?? [])
          .map((s) => s.player_id)
          .filter((id): id is number => id != null);
        if (playerIds.length === 0) return { teamId, candidates: [] };

        const { data: players, error } = await supabase
          .from("players")
          .select("id, name, position, club_short, total_points, form, injury_status")
          .in("id", playerIds);
        if (error) return { error: error.message };

        const candidates = (players ?? [])
          .filter((p) => !p.injury_status || p.injury_status === "Fit")
          .map((p) => {
            const formScore = Number(p.form ?? 0);
            const pointsScore = (p.total_points ?? 0) / 10;
            return {
              id: p.id,
              name: p.name,
              position: p.position,
              club: p.club_short,
              score: formScore * 1.5 + pointsScore,
              form: p.form ?? null,
              totalPoints: p.total_points ?? 0,
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        return { teamId, candidates };
      },
    }),

    explainRules: tool({
      description:
        "Plain-English explanation of fantasy Premier League draft mechanics. Use this for new users asking how anything works.",
      inputSchema: z.object({
        topic: z.enum([
          "draft",
          "snake_draft",
          "scoring",
          "captain",
          "waivers",
          "trades",
          "lineup",
          "chips",
        ]),
      }),
      execute: async ({ topic }) => ({
        topic,
        explanation: RULES[topic],
      }),
    }),
  };
}

const RULES: Record<string, string> = {
  draft:
    "A draft is the start-of-season event where managers take turns picking real Premier League players. Once a player is drafted in your league, no one else can pick them — that's the difference vs the classic FPL where everyone can own the same players.",
  snake_draft:
    "Snake draft means the order reverses each round. If you pick last in round 1, you pick first in round 2 — keeps it fair. PitchIQ uses this by default.",
  scoring:
    "Players score points based on real match events: appearances (1-2 pts), goals (4 for FWD, 5 for MID, 6 for DEF/GK), assists (3), clean sheets (4 for DEF/GK), saves, bonus, etc. Yellow cards (-1) and reds (-3) hurt. Captains score double.",
  captain:
    "You pick a captain each gameweek — they score double. Pick a vice-captain too: if your captain doesn't play, the vice gets the armband automatically.",
  waivers:
    "Waivers are how you add a free agent. Submit a claim, and on Wednesday the system processes everyone's claims in priority order (worst-ranked team first by default). You drop a player to make space for the new one.",
  trades:
    "Trades are direct manager-to-manager swaps. You propose a trade, the other manager accepts or rejects. League members can see the proposal so it stays transparent.",
  lineup:
    "Each gameweek you set a starting XI from your roster: 1 GK + 10 outfield. Pick a formation (4-4-2, 3-5-2, etc.) and slot players into positions. Your bench scores nothing unless someone's auto-subbed in for not playing.",
  chips:
    "Chips are one-time-use boosts. Triple Captain triples your captain's score, Bench Boost counts your bench, Wildcard lets you reshape your team without trade limits, Free Hit is a one-week swap that reverts.",
};
