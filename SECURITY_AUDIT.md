# PitchIQ Security Audit

Written to answer, honestly, the question the senior-project spec sets out to answer: which security assertions hold in the shipped code, which don't, and where does the evidence live in the repo. This file is the source of truth alongside `LIMITATIONS.md`, which lists product features that are explicitly out of scope.

Verified against commit `HEAD` on `main` on **2026-07-10**.

## 1. Row-Level Security (RLS)

Every table in `public` has `rls_enabled = true`. Verified via `pg_class.relrowsecurity` on the live Supabase project.

| Table | RLS | Policies present | Notes |
|---|---|---|---|
| `profiles` | ✅ | SELECT, INSERT, UPDATE | Users can only insert/update their own row (`id = auth.uid()`). Read is open to authenticated so we can render other managers' display names in league standings. |
| `leagues` | ✅ | SELECT, INSERT, UPDATE | SELECT covers `commissioner_id = auth.uid() OR user_in_league(id)` — fixed 2026-07-10 (previous version broke create-league). INSERT requires `commissioner_id = auth.uid()`. UPDATE is commissioner-only. |
| `teams` | ✅ | SELECT, INSERT, UPDATE | INSERT enforces both `user_id = auth.uid()` and either commissioner-owned or seat available. |
| `roster_slots` | ✅ | SELECT, INSERT, UPDATE, DELETE | Owner-only writes; league-wide reads. |
| `lineups` | ✅ | ALL (owner), SELECT (league) | Owner has full CRUD; league members can read. |
| `draft_sessions` | ✅ | SELECT, INSERT, UPDATE | UPDATE gated to the commissioner. |
| `draft_picks` | ✅ | SELECT, INSERT | Picks are append-only by design; no UPDATE/DELETE policy on purpose (mitigates history rewriting). |
| `trades` | ✅ | SELECT, INSERT, UPDATE | Read by proposer/receiver/commissioner only. Accept goes through the transactional `accept_trade` RPC (see §6). |
| `trade_assets` | ✅ | SELECT, INSERT, DELETE | Writable while parent trade is `pending`; readable by trade parties + commissioner. |
| `waiver_claims` | ✅ | SELECT, INSERT, UPDATE, DELETE | Owner-only writes; league-wide read for transparency. |
| `player_match_stats` | ✅ | SELECT | Read-only from the app's perspective; only the daily sync (service role) writes it. |
| `players` | ✅ | SELECT | Same shape as above. |
| `scoring_audit` | ✅ | SELECT | Members-only read. Rows are written by the scoring engine via service role, never by the client. |
| `gameweek_scores` | ✅ | SELECT | Read via team ownership; writes are service-role only. |
| `league_prizes` | ✅ | ALL (commissioner), SELECT (members) | Only the commissioner can define league prizes. |
| `notifications` | ✅ | ALL (owner) | Users can only see their own notifications. |
| `idempotency_keys` | ✅ | ALL (owner) | See §7. |
| `ai_conversations` | ✅ | ALL (owner) | The Coach thread table. |

**Evidence:** `pg_policies` returned 39 policies across 18 tables. Zero tables have RLS disabled. There is no `FORCE ROW LEVEL SECURITY` (so postgres/service-role bypasses RLS as intended for admin operations).

The spec's OWASP A01 mitigation ("a query without a tenant filter still returns zero rows because the engine enforces isolation") is achieved by making every RLS predicate go through either `auth.uid()` or the `user_in_league(uuid)` helper.

## 2. JWT storage

Sessions are stored in HTTP-only cookies via `@supabase/ssr`. There is no explicit `localStorage.setItem` for auth tokens anywhere in the codebase.

The only `localStorage` writes in the app are:

- [pitchiq/lib/draft/queue.ts](pitchiq/lib/draft/queue.ts): per-team pre-pick queue (a UI preference, not a credential).
- [pitchiq/lib/draft/queue.test.ts](pitchiq/lib/draft/queue.test.ts): stubbed storage for the unit test.

Neither touches the Supabase session. OWASP A07 exposure via XSS-readable tokens is closed.

## 3. Service-role key isolation

`SUPABASE_SERVICE_ROLE_KEY` is imported in exactly three places:

- [pitchiq/lib/supabase/admin.ts](pitchiq/lib/supabase/admin.ts) — server-only helper. All API routes that need it import from here.
- [pitchiq/supabase/functions/sync-players/index.ts](pitchiq/supabase/functions/sync-players/index.ts) — Deno Edge Function (runs on Supabase, not the client).
- [pitchiq/supabase/functions/sync-gameweek/index.ts](pitchiq/supabase/functions/sync-gameweek/index.ts) — same.

The key is never returned in an API response body, never logged, never present in any client bundle. It is not read from `NEXT_PUBLIC_*` and cannot leak through Next's environment-variable exposure model.

## 4. Cron secret enforcement

Every route under `app/api/cron/*` validates the `Authorization: Bearer $CRON_SECRET` header before doing any work. If `CRON_SECRET` is unset the routes return 401 rather than falling open.

- [pitchiq/app/api/cron/lock-lineups/route.ts](pitchiq/app/api/cron/lock-lineups/route.ts) — lines 12-16
- [pitchiq/app/api/cron/process-waivers/route.ts](pitchiq/app/api/cron/process-waivers/route.ts) — lines 13-17

`app/api/sync/players/route.ts` additionally requires a commissioner-owned league plus Upstash rate limit before touching the Football API (see §5).

## 5. Rate limiting

Enforced via Upstash's edge-friendly HTTP client. All limits are sliding-window and keyed per user. Actual limits in code (may differ from the spec's targets; documented here rather than glossed over):

| Endpoint | Key | Limit | Window | Location |
|---|---|---|---|---|
| `POST /api/assistant` (Coach chat) | `assistant` | 30 req | 300 s | [pitchiq/app/api/assistant/route.ts](pitchiq/app/api/assistant/route.ts) |
| `PUT /api/lineups/[teamId]` | `lineup-edit` | 30 req | 300 s | [pitchiq/app/api/lineups/[teamId]/route.ts](pitchiq/app/api/lineups/[teamId]/route.ts) |
| `POST /api/waivers` | `waiver-claim` | 20 req | 3600 s | [pitchiq/app/api/waivers/route.ts](pitchiq/app/api/waivers/route.ts) |
| `POST /api/sync/players` | `sync:players` | 2 req | 86400 s | [pitchiq/app/api/sync/players/route.ts](pitchiq/app/api/sync/players/route.ts) |

The `checkRateLimit` helper fails **open** (returns `success: true`) when Upstash isn't configured. That's intentional for local dev; production is configured. See [pitchiq/lib/upstash.ts](pitchiq/lib/upstash.ts).

Endpoints that the spec called out but aren't rate-limited in code: `draft/pick` — the pick server itself enforces "is this your turn" against `draft_state.current_pick`, which naturally throttles a manager to at most one successful pick per turn. Adding an Upstash limit here is a documented follow-up.

## 6. Trade atomicity

Prior to 2026-07-10 the trade-accept path ran two separate `roster_slots` mutations per asset from the application layer with no transaction. A mid-swap failure could have left one team richer and the other poorer.

**Fix:** [pitchiq/supabase/migrations/20260710040000_accept_trade_rpc.sql](pitchiq/supabase/migrations/20260710040000_accept_trade_rpc.sql) introduces `public.accept_trade(uuid)` — a plpgsql `SECURITY DEFINER` function that:

1. Verifies the caller is the receiving manager or the league commissioner.
2. Locks the parent trade row (`FOR UPDATE`).
3. Loops through every `trade_assets` row and applies the delete/insert on `roster_slots`.
4. Updates the trade status.

All of this happens inside a single implicit transaction so an error in step 3 rolls back everything cleanly. The Next.js route now calls this via `.rpc()` and no longer performs any roster writes itself.

- [pitchiq/app/api/trade/respond/route.ts](pitchiq/app/api/trade/respond/route.ts)

## 7. Idempotency

All mutating routes accept an `Idempotency-Key` request header. The `idempotency_keys` table (owner-scoped RLS) caches the response body so retries are safe. See [pitchiq/lib/idempotency.ts](pitchiq/lib/idempotency.ts).

## 8. Server-authoritative deadlines and turn order

- **Draft turn**: [pitchiq/app/api/draft/pick/route.ts](pitchiq/app/api/draft/pick/route.ts) reads `draft_sessions.current_pick` from the DB, computes the expected team via `teamIdForPick(currentPick, teamCount, snakeOrder)`, and rejects any pick that doesn't come from the on-clock manager or the commissioner. No client-supplied turn value is trusted.
- **Lineup deadline**: [pitchiq/app/api/lineups/[teamId]/route.ts](pitchiq/app/api/lineups/[teamId]/route.ts) reads the gameweek deadline from `leagues.settings` on every save and refuses writes if `locked_at` is set or the deadline has passed. In parallel, `/api/cron/lock-lineups` stamps `locked_at` at the deadline. Two independent enforcement layers, as the spec requires.
- **Trade acceptance**: `accept_trade` RPC verifies the trade is still `pending` before mutating anything.

## 9. Scoring audit trail

Every points award writes a row into `scoring_audit` with `player_id`, `team_id`, `league_id`, `gameweek`, `fixture_id`, `base_points`, `multiplier`, `final_points`, and a per-event `breakdown` JSON. The aggregate on `gameweek_scores` is derived from these rows, never written independently. Managers can therefore reconstruct exactly how any total was produced.

## 10. Input validation

Every POST/PUT endpoint parses its body through a Zod schema before touching the DB. Schemas live next to the routes and are shared with the client forms so error messages stay consistent.

## 11. Accessibility (WCAG 2.1 AA quick wins done 2026-07-10)

- Skip-to-content link added in [pitchiq/app/layout.tsx](pitchiq/app/layout.tsx). Only visible on keyboard focus.
- `prefers-reduced-motion` now honored globally via `<MotionConfig reducedMotion="user">` in [pitchiq/components/providers/motion-provider.tsx](pitchiq/components/providers/motion-provider.tsx).
- The Coach message container has `aria-live="polite" aria-atomic="false"` so screen readers announce streaming responses ([pitchiq/components/assistant/Assistant.tsx](pitchiq/components/assistant/Assistant.tsx)).
- Zero `<div onClick>` handlers exist in the codebase — every interactive control is a semantic `<button>`.

Remaining WCAG gaps are enumerated in `LIMITATIONS.md`.

## 12. What was broken and is now fixed

- **Create-league round-trip failure** — `POST /api/league` was silently returning "Could not create league" for every attempt. Root cause: the `leagues` SELECT policy required team membership, but Supabase-JS's `.insert(...).select()` uses `Prefer: return=representation` which triggers a SELECT-after-INSERT before any team exists. Fixed via [pitchiq/supabase/migrations/20260710030000_leagues_commissioner_select.sql](pitchiq/supabase/migrations/20260710030000_leagues_commissioner_select.sql). Verified end-to-end against production PostgREST as user `d8dee0fe`.
- **Trade acceptance non-atomic** — see §6.
- **Orphan `/api/league/invite-email/` directory** — leftover from Resend removal. Deleted.

## 13. Testing this yourself

```bash
# Sign in as any registered user
curl -s -X POST "https://nvzuljyfwkonanfgkxfr.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"..."}'

# Try to insert a league as someone else (should fail with 42501)
curl -X POST "$SUPABASE_URL/rest/v1/leagues?select=*" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"name":"pwn","commissioner_id":"SOMEONE-ELSES-UUID"}'
# → {"code":"42501","message":"new row violates row-level security policy for table \"leagues\""}

# Hit the cron endpoint without the secret (should 401)
curl -sS "https://pitchiq-gilt.vercel.app/api/cron/lock-lineups"
# → {"error":"Unauthorized"}
```
