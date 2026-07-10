-- Fix create-league RLS: extend the leagues SELECT policy to include the
-- commissioner. Without this, .insert(...).select(...) fails at creation
-- time because the SELECT-after-INSERT step (Prefer: return=representation)
-- cannot see the row until the commissioner's team is also inserted, so
-- PostgREST reports the entire operation as a policy violation while the
-- row is silently written.
DROP POLICY IF EXISTS leagues_select_member ON public.leagues;

CREATE POLICY leagues_select_member ON public.leagues
  FOR SELECT TO authenticated
  USING (commissioner_id = auth.uid() OR public.user_in_league(id));
