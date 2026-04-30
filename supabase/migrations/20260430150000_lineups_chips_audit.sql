-- Tables added in this migration:
--   lineups          - per-team weekly XI, bench, captain, vice, chip
--   scoring_audit    - per-rule breakdown for every player-gameweek score
--   idempotency_keys - de-dupes retried mutations
--   league_prizes    - cosmetic-only prize labels (Stripe is later)

-- Lineups

CREATE TABLE IF NOT EXISTS public.lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES public.leagues (id) ON DELETE CASCADE,
  gameweek INTEGER NOT NULL,
  season TEXT NOT NULL DEFAULT '2025-26',
  formation TEXT NOT NULL DEFAULT '4-4-2'
    CHECK (formation IN ('4-4-2','4-3-3','3-5-2','3-4-3','4-5-1','5-3-2','5-4-1')),
  starters JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [{slot, player_id}, ...]
  bench JSONB NOT NULL DEFAULT '[]'::jsonb,        -- ordered [{order, player_id}]
  captain_player_id INTEGER REFERENCES public.players (id),
  vice_player_id INTEGER REFERENCES public.players (id),
  chip TEXT CHECK (chip IN ('triple_captain','bench_boost','free_hit','wildcard')),
  locked_at TIMESTAMPTZ,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (team_id, gameweek, season)
);

CREATE INDEX IF NOT EXISTS idx_lineups_league_gw ON public.lineups (league_id, gameweek);

ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lineups_owner_rw" ON public.lineups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = lineups.team_id AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = lineups.team_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "lineups_league_read" ON public.lineups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.league_id = lineups.league_id AND t.user_id = auth.uid()
    )
  );

-- Scoring audit (every point a player gets has a row here).

CREATE TABLE IF NOT EXISTS public.scoring_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES public.leagues (id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams (id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES public.players (id),
  gameweek INTEGER NOT NULL,
  fixture_id INTEGER,
  base_points INTEGER NOT NULL DEFAULT 0,
  final_points INTEGER NOT NULL DEFAULT 0,
  multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [{key, value, reason}]
  source TEXT NOT NULL DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scoring_audit_team_gw
  ON public.scoring_audit (team_id, gameweek);

ALTER TABLE public.scoring_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scoring_audit_member_read" ON public.scoring_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.league_id = scoring_audit.league_id AND t.user_id = auth.uid()
    )
  );

-- Idempotency keys.

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_created
  ON public.idempotency_keys (created_at);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "idempotency_owner" ON public.idempotency_keys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- League prizes (badge text only for now; payouts are not in scope).

CREATE TABLE IF NOT EXISTS public.league_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES public.leagues (id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 20),
  label TEXT NOT NULL,
  badge TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (league_id, rank)
);

ALTER TABLE public.league_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "league_prizes_member_read" ON public.league_prizes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.league_id = league_prizes.league_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "league_prizes_commissioner_write" ON public.league_prizes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_prizes.league_id AND l.commissioner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_prizes.league_id AND l.commissioner_id = auth.uid()
    )
  );
