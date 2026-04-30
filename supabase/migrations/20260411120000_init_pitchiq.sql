-- PitchIQ initial schema + RLS

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  favorite_club TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.players (
  id SERIAL PRIMARY KEY,
  api_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  club TEXT NOT NULL,
  club_short TEXT,
  position TEXT CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  nationality TEXT,
  age INTEGER,
  total_points INTEGER DEFAULT 0,
  form NUMERIC(4, 2) DEFAULT 0,
  price NUMERIC(5, 2),
  ownership_pct NUMERIC(5, 2) DEFAULT 0,
  injury_status TEXT DEFAULT 'available' CHECK (
    injury_status IN ('available', 'doubtful', 'injured', 'suspended')
  ),
  injury_detail TEXT,
  predicted_points_next_gw NUMERIC(5, 2),
  injury_risk_score NUMERIC(4, 3),
  draft_vor NUMERIC(6, 2),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_players_position ON public.players (position);
CREATE INDEX idx_players_club ON public.players (club);

CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  commissioner_id UUID REFERENCES public.profiles (id),
  draft_type TEXT CHECK (draft_type IN ('snake', 'auction')) DEFAULT 'snake',
  draft_mode TEXT CHECK (draft_mode IN ('live', 'async')) DEFAULT 'live',
  max_teams INTEGER DEFAULT 10,
  roster_size INTEGER DEFAULT 15,
  scoring_system JSONB DEFAULT '{}'::jsonb,
  auction_budget INTEGER DEFAULT 100,
  waiver_type TEXT DEFAULT 'reverse_standings',
  trade_deadline TIMESTAMPTZ,
  season TEXT NOT NULL DEFAULT '2025-26',
  status TEXT DEFAULT 'setup' CHECK (
    status IN ('setup', 'drafting', 'active', 'complete')
  ),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  league_id UUID REFERENCES public.leagues (id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles (id),
  team_name TEXT NOT NULL,
  logo_url TEXT,
  total_points INTEGER DEFAULT 0,
  gameweek_points INTEGER DEFAULT 0,
  rank INTEGER,
  draft_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT now (),
  UNIQUE (league_id, user_id)
);

CREATE TABLE public.draft_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  league_id UUID REFERENCES public.leagues (id) ON DELETE CASCADE UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'active', 'paused', 'complete')
  ),
  current_pick INTEGER DEFAULT 1,
  current_round INTEGER DEFAULT 1,
  current_team_id UUID REFERENCES public.teams (id),
  pick_deadline TIMESTAMPTZ,
  pick_time_seconds INTEGER DEFAULT 90,
  snake_order UUID[],
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.draft_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  draft_session_id UUID REFERENCES public.draft_sessions (id) ON DELETE CASCADE,
  league_id UUID REFERENCES public.leagues (id),
  team_id UUID REFERENCES public.teams (id),
  player_id INTEGER REFERENCES public.players (id),
  pick_number INTEGER NOT NULL,
  round INTEGER NOT NULL,
  amount INTEGER,
  auto_picked BOOLEAN DEFAULT false,
  picked_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.roster_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  team_id UUID REFERENCES public.teams (id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES public.players (id),
  slot_type TEXT DEFAULT 'bench' CHECK (
    slot_type IN ('starter', 'bench', 'injured_reserve')
  ),
  lineup_position TEXT,
  acquired_via TEXT DEFAULT 'draft' CHECK (
    acquired_via IN ('draft', 'waiver', 'trade', 'free_agent')
  ),
  acquired_at TIMESTAMPTZ DEFAULT now (),
  UNIQUE (team_id, player_id)
);

CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  league_id UUID REFERENCES public.leagues (id),
  proposing_team_id UUID REFERENCES public.teams (id),
  receiving_team_id UUID REFERENCES public.teams (id),
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected', 'cancelled', 'vetoed')
  ),
  ai_analysis JSONB,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '48 hours'),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trade_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  trade_id UUID REFERENCES public.trades (id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES public.players (id),
  from_team_id UUID REFERENCES public.teams (id),
  to_team_id UUID REFERENCES public.teams (id)
);

CREATE TABLE public.gameweek_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  team_id UUID REFERENCES public.teams (id),
  gameweek INTEGER NOT NULL,
  season TEXT NOT NULL DEFAULT '2025-26',
  points INTEGER DEFAULT 0,
  rank INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT now (),
  UNIQUE (team_id, gameweek, season)
);

CREATE TABLE public.player_match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  player_id INTEGER REFERENCES public.players (id),
  fixture_id INTEGER NOT NULL,
  gameweek INTEGER NOT NULL,
  season TEXT NOT NULL DEFAULT '2025-26',
  minutes_played INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  clean_sheet BOOLEAN DEFAULT false,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  fantasy_points INTEGER DEFAULT 0,
  raw_stats JSONB DEFAULT '{}'::jsonb,
  UNIQUE (player_id, fixture_id)
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID REFERENCES public.profiles (id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id UUID REFERENCES public.profiles (id),
  context TEXT NOT NULL,
  entity_id TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now (),
  updated_at TIMESTAMPTZ DEFAULT now ()
);

-- -----------------------------------------------------------------------------
-- Updated_at trigger for profiles
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Helper: league visibility (member or commissioner)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_in_league(p_league_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.league_id = p_league_id
      AND t.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.leagues l
    WHERE l.id = p_league_id
      AND l.commissioner_id = auth.uid()
  );
$$;

-- Invite lookup for join flow (bypasses RLS safely by code)
CREATE OR REPLACE FUNCTION public.get_league_by_invite(code text)
RETURNS TABLE (
  id uuid,
  name text,
  invite_code text,
  commissioner_id uuid,
  draft_type text,
  draft_mode text,
  max_teams integer,
  roster_size integer,
  status text,
  season text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.name,
    l.invite_code,
    l.commissioner_id,
    l.draft_type,
    l.draft_mode,
    l.max_teams,
    l.roster_size,
    l.status,
    l.season
  FROM public.leagues l
  WHERE lower(l.invite_code) = lower(trim(code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_league_by_invite (text) TO authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gameweek_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY profiles_select_all ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- players (read for signed-in users)
CREATE POLICY players_select_auth ON public.players FOR SELECT TO authenticated USING (true);

-- leagues
CREATE POLICY leagues_select_member ON public.leagues FOR SELECT TO authenticated USING (public.user_in_league (id));
CREATE POLICY leagues_insert_commissioner ON public.leagues FOR INSERT TO authenticated WITH CHECK (commissioner_id = auth.uid());
CREATE POLICY leagues_update_commissioner ON public.leagues FOR UPDATE TO authenticated USING (commissioner_id = auth.uid()) WITH CHECK (commissioner_id = auth.uid());

-- teams
CREATE POLICY teams_select_league ON public.teams FOR SELECT TO authenticated USING (public.user_in_league (league_id));
CREATE POLICY teams_insert ON public.teams FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.leagues l
    WHERE l.id = league_id
      AND (
        l.commissioner_id = auth.uid()
        OR (
          (
            SELECT count(*)::integer
            FROM public.teams t
            WHERE t.league_id = l.id
          ) < l.max_teams
        )
      )
  )
);
CREATE POLICY teams_update_owner ON public.teams FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- draft_sessions
CREATE POLICY draft_sessions_select ON public.draft_sessions FOR SELECT TO authenticated USING (public.user_in_league (league_id));
CREATE POLICY draft_sessions_insert ON public.draft_sessions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.leagues l
    WHERE l.id = draft_sessions.league_id
      AND l.commissioner_id = auth.uid()
  )
);
CREATE POLICY draft_sessions_update_commissioner ON public.draft_sessions FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.leagues l
    WHERE l.id = draft_sessions.league_id
      AND l.commissioner_id = auth.uid()
  )
);

-- draft_picks
CREATE POLICY draft_picks_select ON public.draft_picks FOR SELECT TO authenticated USING (public.user_in_league (league_id));
CREATE POLICY draft_picks_insert ON public.draft_picks FOR INSERT TO authenticated WITH CHECK (
  public.user_in_league (league_id)
  AND (
    EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_id
        AND t.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.leagues l
      WHERE l.id = league_id
        AND l.commissioner_id = auth.uid()
    )
  )
);

-- roster_slots
CREATE POLICY roster_select ON public.roster_slots FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = roster_slots.team_id
      AND public.user_in_league (t.league_id)
  )
);
CREATE POLICY roster_update_owner ON public.roster_slots FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = roster_slots.team_id
      AND t.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = roster_slots.team_id
      AND t.user_id = auth.uid()
  )
);
CREATE POLICY roster_insert_owner ON public.roster_slots FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = team_id
      AND t.user_id = auth.uid()
  )
);
CREATE POLICY roster_delete_owner ON public.roster_slots FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = roster_slots.team_id
      AND t.user_id = auth.uid()
  )
);

-- trades
CREATE POLICY trades_select_parties ON public.trades FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id IN (proposing_team_id, receiving_team_id)
      AND t.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.leagues l
    WHERE l.id = trades.league_id
      AND l.commissioner_id = auth.uid()
  )
);
CREATE POLICY trades_insert_proposer ON public.trades FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = proposing_team_id
      AND t.user_id = auth.uid()
  )
);
CREATE POLICY trades_update_parties ON public.trades FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id IN (proposing_team_id, receiving_team_id)
      AND t.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.leagues l
    WHERE l.id = trades.league_id
      AND l.commissioner_id = auth.uid()
  )
);

-- trade_assets
CREATE POLICY trade_assets_select ON public.trade_assets FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.trades tr
    WHERE tr.id = trade_assets.trade_id
      AND (
        EXISTS (
          SELECT 1
          FROM public.teams t
          WHERE t.id IN (tr.proposing_team_id, tr.receiving_team_id)
            AND t.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1
          FROM public.leagues l
          WHERE l.id = tr.league_id
            AND l.commissioner_id = auth.uid()
        )
      )
  )
);
CREATE POLICY trade_assets_insert ON public.trade_assets FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.trades tr
    WHERE tr.id = trade_id
      AND EXISTS (
        SELECT 1
        FROM public.teams t
        WHERE t.id = tr.proposing_team_id
          AND t.user_id = auth.uid()
      )
  )
);
CREATE POLICY trade_assets_delete ON public.trade_assets FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.trades tr
    WHERE tr.id = trade_id
      AND tr.status = 'pending'
      AND EXISTS (
        SELECT 1
        FROM public.teams t
        WHERE t.id = tr.proposing_team_id
          AND t.user_id = auth.uid()
      )
  )
);

-- gameweek_scores
CREATE POLICY gw_scores_select ON public.gameweek_scores FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.teams t
    WHERE t.id = team_id
      AND public.user_in_league (t.league_id)
  )
);

-- player_match_stats
CREATE POLICY pms_select ON public.player_match_stats FOR SELECT TO authenticated USING (true);

-- notifications
CREATE POLICY notif_own ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ai_conversations
CREATE POLICY ai_conv_own ON public.ai_conversations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Grant authenticated access to tables (RLS still applies)
-- -----------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
