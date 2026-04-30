-- Enable Realtime for draft tables (idempotent-safe for local dev)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.draft_picks;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.draft_sessions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
