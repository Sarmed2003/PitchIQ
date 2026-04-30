# PitchIQ

PitchIQ is a fantasy Premier League draft app. It does the things FPL's draft mode does — snake drafts, weekly lineups with a captain, head-to-head matchups, waivers, trades — but with a UI that actually feels like watching the sport instead of filling out a tax return.

The app is mobile-first and installs as a PWA, so you can add it to your home screen and run a league from your phone.

## What it does

- **Run a league.** Create a league, send invite links (or QR codes when everyone's in the same room), pick a snake-draft date, and you're set.
- **Draft.** Live draft room with a clock, presence dots showing who's actually online, a pre-pick queue/watchlist, audio cues when it's your turn, and an auto-pick that respects your queue.
- **Set a lineup.** Tap-to-swap pitch UI with formation picker, captain and vice toggles, and chip activation. Locks at the league deadline.
- **Score.** Configurable FPL-style scoring engine. Every point a player gets is logged with a reason so disputes have a paper trail.
- **Waivers.** Add/drop claims with reverse-standings priority by default, FAAB optional. A cron processes them on Wednesday morning.
- **Trades.** Propose trades, the other manager accepts or rejects, league members can see what's pending.
- **Live.** A persistent ticker across the app shows what's happening in matches that affect your team.

## What's still on the roadmap

- AI draft assistant (suggest picks based on your queue, league trends, and projections).
- Stripe-backed prize pools.
- Real Web Push notifications (the plumbing is in place, the VAPID side isn't).
- Native iOS / Android wrappers — the PWA covers most of this for now.

## Tech stack and why

A short note on each piece and what it earns its keep doing:

### Framework

- **Next.js 16 (App Router) + React 19** — Server Components keep the heavy data fetching off the client, and the App Router's route handlers give us our API without a second server. Streaming + partial prerendering are useful when match data is rolling in.
- **TypeScript** — non-negotiable on a project where the data shape (players, lineups, scoring rules) is the whole product.
- **Tailwind CSS v4 + shadcn/ui + Radix UI** — Tailwind for everything, shadcn for the unstyled-but-accessible primitives. Radix handles the focus traps, ARIA wiring, keyboard nav. We compose, we don't pull in a heavy component library.
- **Framer Motion** — animations, page transitions, the cinematic auth handoff. Works with `prefers-reduced-motion` so we don't make people seasick.
- **TanStack Query** — client cache and revalidation for player browsing and draft state. Keeps the server round-trips honest.
- **Zod + React Hook Form** — schema validation we can share between the API and the form, so the form errors and the route errors stay in sync.

### Backend / data

- **Supabase (Postgres + Auth + Realtime)** — our source of truth. All durable state lives in Postgres. Auth is Supabase auth (email + magic link). Realtime channels power the draft room presence and the live scoring fan-out.
- **Postgres + Row Level Security** — every table has RLS policies. League members can read what they should, commissioners can write what they should, nobody else gets to peek. The scoring engine and cron jobs use the service-role key, but only on the server.
- **Upstash Redis** — fast key-value store for rate limiting (per-user lineup edits, sync calls, waiver claims) and as a regional cache for read-heavy match-day endpoints. We picked it because it's HTTP-based, so it works from edge runtimes.
- **api-football (api-sports.io)** — the football data feed. We hit it from a commissioner-triggered sync route and a cron, never from the client. The provider lives behind an interface in `lib/football/provider.ts` so we can swap to Sportmonks or Stats Perform without touching anything else.
- **Resend** — transactional email for league invites and notifications. Cheap, has a usable React-email-ish API, plays well with Vercel.

### Infra / ops

- **Vercel** — hosting, edge middleware, and Vercel Cron for the lineup-lock job (every 5 minutes during a gameweek) and the weekly waiver run.
- **Sentry** — error and performance monitoring. Wired up in `instrumentation.ts` so it catches both serverless and edge runtimes. No-ops without a DSN, so dev stays quiet.
- **PostHog** — product analytics. Helps us see whether anyone actually uses the queue feature, where people bail in the create-league flow, etc.
- **GitHub Actions** — CI runs lint, typecheck, unit tests, build, and Playwright E2E on every PR.
- **Vitest + Playwright + k6** — Vitest for unit tests (scoring engine and lineup schema are the most critical), Playwright for E2E, k6 for the matchday load script that ramps to 5,000 concurrent users.

### PWA

- Service worker, web app manifest, maskable icons, safe-area handling for the iPhone home indicator. The shell is cache-first, the API is network-first — we never want to serve stale draft state.

## Getting it running

You'll need a Supabase project, the football and Resend keys, and an Upstash Redis instance. There's a `.env.local.example` with everything that needs to be set.

```bash
cd pitchiq
npm install
cp .env.local.example .env.local   # fill in the keys
npm run dev
```

Open `http://localhost:3000`.

To see what's there end to end without manually clicking through:

```bash
# unit tests (scoring engine, lineup schema, draft queue)
npm test

# build + start (catches type errors and missing env)
npm run build
npm run start

# E2E smoke test against the dev server
npm run test:e2e

# matchday load profile (needs k6 installed locally + a deployed URL)
k6 run -e BASE_URL=https://your-deploy.vercel.app tests/load/matchday.k6.js
```

## Database

Migrations live in `supabase/migrations`. After linking a Supabase project:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

If `db push` complains about existing tables, mark the early migrations as already applied:

```bash
supabase migration list
supabase migration repair --status applied <timestamp>
```

## Repository layout

```
pitchiq/
  app/                  # Next.js App Router
    (app)/              # authenticated routes
    (auth)/             # sign-in / sign-up
    api/                # route handlers (REST + cron + auth callback)
  components/
    draft/              # draft room
    glass/              # frosted-glass primitives
    layout/             # sidebar, mobile tab bar, top nav
    league/             # invite panel, settings, sync
    players/            # jersey token, player card
    team/               # pitch visualizer, lineup editor
    waivers/            # waiver claim list / button
  hooks/                # presence, turn alerts
  lib/
    clubs/              # PL club color palettes
    draft/              # snake draft engine, scoring, queue
    football/           # provider abstraction (api-football today)
    lineup/             # zod schema + formation rules
    notifications/      # in-app + email fan-out
    queries/            # TanStack Query fetchers
    supabase/           # browser, server, admin, middleware clients
    upstash.ts          # cache + rate limiting
  supabase/migrations/  # SQL migrations
  tests/
    e2e/                # Playwright
    load/               # k6
  public/               # PWA manifest, icons, service worker
```

## Conventions

- All mutating routes accept an `Idempotency-Key` header; we de-dupe retries via `idempotency_keys`.
- Anything that can be hammered (lineup save, waiver claim, sync) is rate-limited per user via Upstash.
- Cron routes require a `CRON_SECRET` bearer token.
- No service-role key on the client. Ever.

## License

Private project for now.
