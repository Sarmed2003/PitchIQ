# Documented Limitations

Things the senior-project spec commits to but the shipped app doesn't implement. Each one is here so a reviewer can point at it and get a straight answer rather than a hand-wave. Companion doc to `SECURITY_AUDIT.md`.

## Product features not implemented

- **Stripe Connect prize pools + `/api/stripe/webhook`.** Out of scope for v1. No real money in the demo league. Because the endpoint doesn't exist, PCI SAQ-A scoping is moot — the app never sees a card number regardless.
- **Resend transactional email + `pitchiq.app` sending domain with SPF/DKIM.** Invites use link + QR + native share instead. The `notify()` helper is wired for an email channel; the send path is intentionally not connected.
- **VAPID web push notifications.** Manifest and service worker exist ([pitchiq/public/manifest.webmanifest](pitchiq/public/manifest.webmanifest), [pitchiq/public/sw.js](pitchiq/public/sw.js)), plumbing for `push_subscriptions` rows is in the schema, but there are no VAPID keys, no `web-push` server code, and no subscription registration UI.
- **Google OAuth sign-in.** Email + password only. Adding Google is a Supabase dashboard toggle plus one button in [pitchiq/app/(auth)/login/](pitchiq/app/(auth)/login/); not enabled here.
- **Async draft mode with 12-hour pick windows.** Live snake draft only. Migration and API surface for `draft_mode = 'async'` exists but no background worker sends "your pick" emails or auto-picks on window expiry.
- **AI Coach on Claude `claude-sonnet-4-6`.** Coach runs on `openai/gpt-5.4-mini` through the Vercel AI Gateway. Swapping model is a one-line change (`const MODEL = "..."` in [pitchiq/app/api/assistant/route.ts](pitchiq/app/api/assistant/route.ts)) precisely because the Gateway abstracts providers — spec target was aspirational, current model is the actual production one.
- **Coach tool set of exactly six functions matching the spec (`get_roster`, `get_fixtures`, `get_standings`, `get_waiver_wire`, `get_trade_proposals`, `get_scoring_rules`).** Implemented set: `getMyLeagues`, `getMyTeam`, `getFreeAgents`, `getLeagueStandings`, `suggestCaptain`, `explainRules` — same shape, different names, plus `explainRules` instead of `get_fixtures` because fixture data isn't fully hydrated in the demo season.
- **Separate AI projection job at 08:00 UTC.** Player projections field (`predicted_points_next_gw`) exists in `players` but is not being populated on a cron.
- **Playoff bracket.** Season terminates at final standings.

## Infrastructure not deployed

- **PgBouncer transaction-mode pool size 60.** Running on Supabase's default `Small` compute with the default connection settings.
- **Supabase read replica for `league standings` + `players` browser.** Single primary.
- **Compute tier `Medium` per spec target.** Still `Small`.
- **10,000 VU / 15 min k6 profile with p95 < 1 s.** Actual k6 profile in [pitchiq/tests/load/matchday.k6.js](pitchiq/tests/load/matchday.k6.js) ramps to ~5,000 VU. Never run against a Medium-tier / PgBouncer configuration.
- **EU multi-region deployment.** Single-region on Vercel. EU users pay one extra round trip to the US database.

## Test coverage vs 48-test target

The spec commits to a 48-test Playwright suite + axe-core 4.9.1. Actual coverage:

- Vitest unit tests: scoring engine, lineup schema, draft queue (see [pitchiq/lib/draft/queue.test.ts](pitchiq/lib/draft/queue.test.ts), [pitchiq/lib/draft/scoring.test.ts](pitchiq/lib/draft/scoring.test.ts), [pitchiq/lib/lineup/schema.test.ts](pitchiq/lib/lineup/schema.test.ts)).
- Playwright e2e: a smaller subset covering auth + landing.
- No axe-core integration.

## Accessibility gaps still open (WCAG 2.1 AA)

- Mobile bench-slot touch targets in the lineup editor measure ~40 px against the 44 px WCAG recommendation.
- The on-clock indicator in the draft room communicates state through color plus a "You're on the clock" text label. It doesn't have a supplementary icon shape distinguishing it for users with color vision deficiency who might miss the text scale.
- Focus trap on modal dialogs relies on Radix defaults; hasn't been audited for every route (waiver confirm, trade confirm are the two most-visible dialogs).
- No manual screen-reader walk-through has been recorded.

## Security items acknowledged in the spec as accepted limitations

Reproducing here because they belong in one place:

- **No per-key ACL on the Upstash cache layer.** A theoretical key collision could expose one user's projection data to another. Mitigated in code by prefixing every cache key with `pitchiq:` and by keeping projection data non-PII.
- **No rate limiting on the sign-up endpoint.** Supabase Auth has server-side quotas but the app doesn't add its own limit, so an attacker can probe which usernames are taken.
- **VAPID keys** don't exist yet, so the "rotate every 90 days" policy doesn't apply.
- **Prize pool** has no escrow / dispute resolution. Not applicable while Stripe is out of scope.
- **AI projections** are missing a real-time injury / confirmed-lineup feed. The public `players.injury_status` field is only refreshed at daily sync cadence.

## Anything else worth flagging

- The `.env.local` values used during development contain real tokens (Supabase anon, service-role, Football API, Upstash, AI Gateway). The file is gitignored. Rotate everything that has been shared during the demo before adding public collaborators to the repo.
- Sentry and PostHog are wired via `NEXT_PUBLIC_*` DSNs but no-op silently when unset. In production they are configured; in local dev they stay quiet by design.
