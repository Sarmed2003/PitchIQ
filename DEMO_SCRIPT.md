# PitchIQ — Live Demo Script

**URL:** https://pitchiq-gilt.vercel.app  
**Repo:** https://github.com/Sarmed2003/PitchIQ  
**Duration:** ~6–8 minutes  
**Setup:** Two browser windows side-by-side — Window 1 = Commissioner, Window 2 = Invited Manager (incognito)

---

## Pre-demo checklist

- [ ] Window 1: logged in as commissioner (`sarmedmahmood91903@gmail.com`)
- [ ] Window 2: fresh incognito, ready to sign up as a second manager
- [ ] Terminal pre-warmed with: `curl -i https://pitchiq-gilt.vercel.app/api/cron/process-waivers`
- [ ] Optional: DevTools → Application → Cookies open in a background tab for Scene 2

---

## Scene 1 — Landing (0:00)

| | |
|---|---|
| **Where** | `https://pitchiq-gilt.vercel.app` |
| **Click** | **Start for free** in the hero card |
| **Say** | "This is PitchIQ — a Fantasy Premier League draft platform I built end-to-end on Next.js 16, Supabase, and Vercel. Every request you'll see in the next six minutes hits a real Postgres cluster with row-level security enforced by the database engine itself. The app can't leak data even if I write a bad query." |

---

## Scene 2 — Signup & JWT storage (0:30)

| | |
|---|---|
| **Where** | `/signup` (Window 2 for the second manager) |
| **Click** | Fill email, password, confirm → **Sign up**. Briefly switch to DevTools → Application → Cookies. |
| **Say** | "Auth is Supabase Auth over `@supabase/ssr`. The session JWT lands in an HTTP-only cookie — JavaScript on the page cannot read it. If it were in localStorage, an XSS bug could exfiltrate it. That's OWASP A07 mitigated at the storage layer." |

---

## Scene 3 — Onboarding (1:00)

| | |
|---|---|
| **Where** | `/onboarding` |
| **Click** | Username, display name, favorite club (Arsenal) → submit |
| **Say** | "The profile row is keyed to the immutable Supabase Auth UUID. The client can't spoof `user_id` — the trigger derives it from `auth.uid()` inside the transaction." |

---

## Scene 4 — Create league (1:30)

| | |
|---|---|
| **Where** | `/dashboard` → sidebar **Leagues** → **Create league** |
| **Click** | Name: **The Champions**, max teams 10, roster 15, snake, live draft → submit |
| **Say** | "League creation goes through `POST /api/league`. The `commissioner_id` is stamped server-side from the cookie session — not from any client field. RLS on `leagues` means this league is visible only to me until managers join. A query with no tenant filter returns zero rows for everyone else." |

---

## Scene 5 — Invite a manager (2:00) — two-browser moment

| | |
|---|---|
| **Where (W1)** | League hub → **the champions** |
| **Click (W1)** | **Copy join link** or **Share** |
| **Say (W1)** | "The invite code is an 8-char slice of the league UUID. In production we'd also fire a Resend email from a verified sending domain with SPF and DKIM — designed, not deployed for this demo." |
| **Where (W2)** | Incognito → `/signup` → new account → paste join link |
| **Click (W2)** | Enter team name → **Join league** |
| **Say (W2)** | "`POST /api/league/join` looks up the invite code, verifies the league isn't full, and inserts a `teams` row with `user_id = auth.uid()`. If I tampered with `user_id` in DevTools, RLS rejects it — the WITH CHECK clause requires the session UUID." |

---

## Scene 6 — Live snake draft (2:45)

| | |
|---|---|
| **Where (W1)** | League hub → **Draft room** → **Start draft** |
| **Click** | When on the clock, pick a top projected player. Watch W2 update in real time. |
| **Say** | "Three things happen on every pick. First, Upstash rate-limits at the edge — one request per three seconds — so a script can't machine-gun picks. Second, the server re-reads `draft_state.current_pick` and refuses the write if it's not my turn. Third, the Realtime channel is RLS-gated — a spectator who guessed the league UUID gets zero data, same as a direct query would." |

---

## Scene 7 — Lineup editor (3:45)

| | |
|---|---|
| **Where (W1)** | `/team/[teamId]/lineup` (after draft completes) |
| **Click** | Tap a bench player to swap onto the pitch → toggle **Captain** → **Save lineup** |
| **Say** | "The client validates formation for UX, but `PUT /api/lineups/[teamId]` re-runs every check server-side — positional constraints, gameweek deadline, roster locked flag. A Vercel Cron at deadline sets `rosters.locked = true`, so even a bypassed client check leaves the row unchanged after lockout." |

---

## Scene 8 — Trades & atomicity (4:30)

| | |
|---|---|
| **Where (W1)** | Open the other manager's team → propose a trade |
| **Click (W1)** | Select give/receive players → submit. Switch to W2 → **Trades** → **Accept**. |
| **Say** | "Trade acceptance runs inside `public.accept_trade` — a SECURITY DEFINER Postgres function. It takes a `FOR UPDATE` lock, verifies status is still pending, swaps every asset atomically, and marks accepted — all in one transaction. The database cannot end up with one manager gaining a player without the other losing one." |

**Bonus — cancel a trade (W1):** Propose another trade → **Trades** → **Cancel** on a pending offer you sent.

---

## Scene 9 — AI Coach (5:15)

| | |
|---|---|
| **Where** | Any page |
| **Click** | Coach bubble (bottom-right) → quick prompt **"Who should I captain this week?"** |
| **Say** | "Coach uses the Vercel AI SDK with six tool functions — getMyLeagues, getMyTeam, getStandings, getWaiverWire, getTradeProposals, getScoringRules. Every claim is grounded in a live database query at inference time. Rate-limited to ten requests per sixty seconds. The system prompt never contains a manager's name, email, or payment data." |

---

## Scene 10 — CRUD cleanup & cron secrets (6:00)

| | |
|---|---|
| **Where (W1)** | Team page → **Leave league / delete team** → confirm. Then **Settings** → **Danger zone** → type league name → **Delete permanently**. |
| **Click** | Confirm both deletes |
| **Say** | "Deletes are RLS-gated — I can delete my own team, and delete a league only as commissioner. ON DELETE CASCADE walks through rosters, drafts, trades, and waivers cleanly." |

---

## Closing — Security & load testing (6:30)

| | |
|---|---|
| **Where** | Terminal |
| **Show** | `curl -i https://pitchiq-gilt.vercel.app/api/cron/process-waivers` → **401 Unauthorized** |
| **Say** | "Security testing was three layers. **Static:** CI greps for `localStorage` JWT storage, service-role keys in client bundles, and tables missing RLS. **Dynamic:** every API route has a Zod schema at its boundary — malformed requests die at parsing, not at the database. **Behavioral:** Supabase MCP lets me run SQL as a non-member and confirm RLS returns zero rows every time. For load, the design target is 10,000 concurrent users at p95 under one second with PgBouncer in transaction mode and a read replica for standings and the player browser — documented, scheduled post-demo because it burns real infrastructure spend." |

---

## Sidebar click map (reference)

| Label | Route | Notes |
|---|---|---|
| Dashboard | `/dashboard` | Your teams, notifications, quick actions |
| Leagues | `/league/create` | Create or manage leagues |
| Players | `/players` | Search/browse player pool |
| Trades | `/trades` | Pending + history; Cancel / Accept / Decline |
| Waivers | `/waivers` | File and cancel claims |
| Leaderboard | `/leaderboard` | Cross-league standings |
| My teams | `/dashboard` | Same as Dashboard (teams section) |

---

## Security controls implemented (quick reference)

| Control | Where | Demo moment |
|---|---|---|
| RLS on all 18 tables | Postgres engine | Scene 4, 5 |
| HTTP-only JWT cookies | `@supabase/ssr` middleware | Scene 2 |
| Service role server-only | `lib/supabase/admin.ts` | Closing |
| Cron secret validation | `/api/cron/*` | Closing curl |
| Edge rate limiting | Upstash on draft, waivers, lineup, coach | Scene 6, 9 |
| Atomic trade RPC | `public.accept_trade` | Scene 8 |
| Zod on API boundaries | Every `app/api/**/route.ts` | Closing |
| Idempotency keys | Mutating routes | Mention in closing |
| WCAG skip link + aria-live | `app/layout.tsx`, Coach | Optional mention |

---

## Known non-goals (say honestly if asked)

- Stripe Connect prize pools — designed, not deployed
- Resend invite emails — designed, not deployed
- VAPID web-push — designed, not deployed
- k6 10k-VU load test — scripted, not executed
- 48-test Playwright suite — partial coverage in CI
- PgBouncer + read replica — documented target
