-- Atomic trade acceptance. Runs the whole roster swap + status update inside a
-- single transaction so a mid-swap failure can never leave one team richer and
-- the other poorer. Called via .rpc('accept_trade', { trade_id }).
--
-- Guardrails:
--   * SECURITY DEFINER so we can bypass RLS for the writes, but we verify
--     inside that the caller is the receiving manager (or the league commissioner)
--     before doing anything, so RLS semantics are preserved.
--   * All writes happen in one BEGIN..COMMIT (implicit for plpgsql).
--   * On any error the whole thing rolls back cleanly.
CREATE OR REPLACE FUNCTION public.accept_trade(p_trade_id UUID)
RETURNS TABLE (status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_trade RECORD;
  v_asset RECORD;
  v_authorised BOOLEAN := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_trade FROM public.trades WHERE id = p_trade_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'trade not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_trade.status <> 'pending' THEN
    RAISE EXCEPTION 'trade not pending' USING ERRCODE = '22023';
  END IF;

  -- Only the receiving manager or the league commissioner may accept.
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = v_trade.receiving_team_id AND t.user_id = v_uid
  ) OR EXISTS (
    SELECT 1 FROM public.leagues l
    WHERE l.id = v_trade.league_id AND l.commissioner_id = v_uid
  ) INTO v_authorised;

  IF NOT v_authorised THEN
    RAISE EXCEPTION 'not the receiving manager' USING ERRCODE = '42501';
  END IF;

  -- Apply each asset movement. Any exception aborts the whole call.
  FOR v_asset IN
    SELECT * FROM public.trade_assets WHERE trade_id = p_trade_id
  LOOP
    IF v_asset.player_id IS NULL
       OR v_asset.from_team_id IS NULL
       OR v_asset.to_team_id IS NULL THEN
      CONTINUE;
    END IF;

    DELETE FROM public.roster_slots
      WHERE team_id = v_asset.from_team_id
        AND player_id = v_asset.player_id;

    INSERT INTO public.roster_slots (team_id, player_id, slot_type, acquired_via)
      VALUES (v_asset.to_team_id, v_asset.player_id, 'bench', 'trade');
  END LOOP;

  UPDATE public.trades
    SET status = 'accepted', responded_at = now()
    WHERE id = p_trade_id;

  RETURN QUERY SELECT 'accepted'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_trade(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_trade(UUID) TO authenticated;
