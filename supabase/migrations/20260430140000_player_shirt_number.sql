-- shirt_number drives the jersey tokens. Backfilled deterministically (hash
-- of name+club mod 99 + 1) so existing rows aren't blank.

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS shirt_number SMALLINT;

UPDATE public.players
SET shirt_number = ((abs(hashtext(name || coalesce(club_short, club))) % 99) + 1)::smallint
WHERE shirt_number IS NULL;

CREATE INDEX IF NOT EXISTS idx_players_shirt_number
  ON public.players (shirt_number);
