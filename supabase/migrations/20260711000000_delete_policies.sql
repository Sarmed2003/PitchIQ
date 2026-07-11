-- DELETE policies for teams/leagues and CASCADE fixes for league teardown.

-- Ensure child rows cascade when a league or team is removed.
ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS trades_league_id_fkey,
  ADD CONSTRAINT trades_league_id_fkey
    FOREIGN KEY (league_id) REFERENCES public.leagues (id) ON DELETE CASCADE;

ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS trades_proposing_team_id_fkey,
  ADD CONSTRAINT trades_proposing_team_id_fkey
    FOREIGN KEY (proposing_team_id) REFERENCES public.teams (id) ON DELETE CASCADE;

ALTER TABLE public.trades
  DROP CONSTRAINT IF EXISTS trades_receiving_team_id_fkey,
  ADD CONSTRAINT trades_receiving_team_id_fkey
    FOREIGN KEY (receiving_team_id) REFERENCES public.teams (id) ON DELETE CASCADE;

ALTER TABLE public.draft_picks
  DROP CONSTRAINT IF EXISTS draft_picks_league_id_fkey,
  ADD CONSTRAINT draft_picks_league_id_fkey
    FOREIGN KEY (league_id) REFERENCES public.leagues (id) ON DELETE CASCADE;

ALTER TABLE public.draft_picks
  DROP CONSTRAINT IF EXISTS draft_picks_team_id_fkey,
  ADD CONSTRAINT draft_picks_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES public.teams (id) ON DELETE CASCADE;

ALTER TABLE public.gameweek_scores
  DROP CONSTRAINT IF EXISTS gameweek_scores_team_id_fkey,
  ADD CONSTRAINT gameweek_scores_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES public.teams (id) ON DELETE CASCADE;

ALTER TABLE public.draft_sessions
  DROP CONSTRAINT IF EXISTS draft_sessions_current_team_id_fkey,
  ADD CONSTRAINT draft_sessions_current_team_id_fkey
    FOREIGN KEY (current_team_id) REFERENCES public.teams (id) ON DELETE SET NULL;

ALTER TABLE public.trade_assets
  DROP CONSTRAINT IF EXISTS trade_assets_from_team_id_fkey,
  ADD CONSTRAINT trade_assets_from_team_id_fkey
    FOREIGN KEY (from_team_id) REFERENCES public.teams (id) ON DELETE CASCADE;

ALTER TABLE public.trade_assets
  DROP CONSTRAINT IF EXISTS trade_assets_to_team_id_fkey,
  ADD CONSTRAINT trade_assets_to_team_id_fkey
    FOREIGN KEY (to_team_id) REFERENCES public.teams (id) ON DELETE CASCADE;

-- teams: owner leaves, or commissioner removes a manager
DROP POLICY IF EXISTS teams_delete_owner_or_commish ON public.teams;
CREATE POLICY teams_delete_owner_or_commish ON public.teams
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = teams.league_id AND l.commissioner_id = auth.uid()
    )
  );

-- leagues: commissioner only
DROP POLICY IF EXISTS leagues_delete_commissioner ON public.leagues;
CREATE POLICY leagues_delete_commissioner ON public.leagues
  FOR DELETE TO authenticated
  USING (commissioner_id = auth.uid());
