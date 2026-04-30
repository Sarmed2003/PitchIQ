-- waiver_claims: queued add/drop requests waiting for the weekly waiver run.
-- The cron at /api/cron/process-waivers reads these in priority order
-- (worst-standing team first by default, or highest FAAB bid), awards the
-- winner per player, and applies the roster move.

CREATE TABLE IF NOT EXISTS public.waiver_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues (id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  add_player_id INTEGER NOT NULL REFERENCES public.players (id),
  drop_player_id INTEGER REFERENCES public.players (id),
  priority INTEGER NOT NULL DEFAULT 1,
  faab_bid INTEGER NOT NULL DEFAULT 0 CHECK (faab_bid >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','won','lost','cancelled','failed')),
  process_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waiver_claims_league_status
  ON public.waiver_claims (league_id, status);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_team_status
  ON public.waiver_claims (team_id, status);

ALTER TABLE public.waiver_claims ENABLE ROW LEVEL SECURITY;

-- A team owner can read/write their own claims.
CREATE POLICY waiver_owner_select ON public.waiver_claims FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = waiver_claims.team_id AND t.user_id = auth.uid()
  )
);

CREATE POLICY waiver_owner_insert ON public.waiver_claims FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = waiver_claims.team_id AND t.user_id = auth.uid()
  )
);

CREATE POLICY waiver_owner_update ON public.waiver_claims FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = waiver_claims.team_id AND t.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = waiver_claims.team_id AND t.user_id = auth.uid()
  )
);

CREATE POLICY waiver_owner_delete ON public.waiver_claims FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = waiver_claims.team_id AND t.user_id = auth.uid()
  )
);

-- League members can see each other's resolved claims (no secret moves).
CREATE POLICY waiver_league_read ON public.waiver_claims FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.league_id = waiver_claims.league_id AND t.user_id = auth.uid()
  )
);
