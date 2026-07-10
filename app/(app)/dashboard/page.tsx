import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, UserPlus, Bell, ArrowRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPoints } from "@/lib/utils/format";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, favorite_club")
    .eq("id", user.id)
    .maybeSingle();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, team_name, league_id, total_points, gameweek_points, rank")
    .eq("user_id", user.id);

  const leagueIds = [...new Set((teams ?? []).map((t) => t.league_id).filter(Boolean))] as string[];
  const { data: leagues } =
    leagueIds.length > 0
      ? await supabase
          .from("leagues")
          .select("id, name, status, invite_code, max_teams, commissioner_id")
          .in("id", leagueIds)
      : { data: [] as Array<{ id: string; name: string; status: string; invite_code: string | null; max_teams: number; commissioner_id: string }> };

  const leagueById = new Map((leagues ?? []).map((l) => [l.id, l] as const));

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const unread = (notifications ?? []).filter((n) => !n.read).length;
  const name = profile?.display_name ?? profile?.username ?? user.email ?? "Manager";

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Hero / greeting */}
      <GlassCard className="relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent" />
        <div
          className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[var(--color-accent)]/10 blur-3xl"
          aria-hidden
        />
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Matchroom · {new Date().toLocaleDateString(undefined, { weekday: "long" })}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          Welcome back, {name.split(" ")[0]}.
        </h1>
        <p className="mt-1 max-w-prose text-sm text-[var(--color-text-muted)]">
          Your command room for live drafts, lineups, and matchday scores.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/league/create" className={cn(buttonVariants(), "tap-target gap-2")}>
            <Trophy className="size-4" /> New league
          </Link>
          <Link
            href="/league/join"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "tap-target gap-2 border-[var(--color-glass-border)]",
            )}
          >
            <UserPlus className="size-4" /> Join with code
          </Link>
        </div>
      </GlassCard>

      {/* Teams + notifications: 2-col on lg */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Teams */}
        <GlassCard className="p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                My squads
              </p>
              <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
                Your teams
              </h2>
            </div>
            <Link
              href="/league/create"
              className="text-xs font-medium text-[var(--color-accent)] hover:underline"
            >
              + New
            </Link>
          </div>
          {(teams ?? []).length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-[var(--color-glass-border)] p-6 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                No squads yet. Create a league or join one with an invite code.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/league/create" className={cn(buttonVariants({ size: "sm" }))}>
                  Create league
                </Link>
                <Link
                  href="/league/join"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }), "border-[var(--color-glass-border)]")}
                >
                  Join league
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {(teams ?? []).map((t) => {
                if (!t.league_id) return null;
                const league = leagueById.get(t.league_id);
                const isCommissioner = league?.commissioner_id === user.id;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/league/${t.league_id}`}
                      className="hover-surface block rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] p-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/14 font-broadcast text-[var(--color-accent)]">
                          {t.rank ?? "—"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-semibold text-[var(--color-text-primary)]">
                            {t.team_name}
                          </p>
                          <p className="truncate text-xs text-[var(--color-text-muted)]">
                            {league?.name ?? "League"}
                            {isCommissioner ? " · Commissioner" : ""}
                            {league?.status ? ` · ${league.status}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-broadcast text-base leading-none text-[var(--color-text-primary)]">
                            {formatPoints(t.total_points ?? 0)}
                          </p>
                          <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                            pts
                          </p>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-[var(--color-text-hint)]" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        {/* Notifications */}
        <GlassCard id="notifications" className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-[var(--color-accent)]" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Notifications
            </p>
            {unread > 0 ? (
              <span className="ml-auto rounded-full bg-[var(--color-accent-danger)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent-danger)]">
                {unread} new
              </span>
            ) : null}
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {(notifications ?? []).length === 0 ? (
              <li className="rounded-lg border border-dashed border-[var(--color-glass-border)] p-4 text-center text-xs text-[var(--color-text-muted)]">
                You are all caught up.
              </li>
            ) : (
              (notifications ?? []).map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "rounded-lg border border-[var(--color-glass-border)] px-3 py-2",
                    n.read ? "opacity-60" : "",
                  )}
                >
                  <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                    {n.title}
                  </span>
                  {n.body ? (
                    <p className="text-xs text-[var(--color-text-muted)]">{n.body}</p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </GlassCard>
      </div>

      {/* Invite-a-friend nudge — always visible, low-friction */}
      {(teams ?? []).length > 0 ? (
        <GlassCard className="relative overflow-hidden p-5 sm:p-6">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[var(--color-accent)]/12 to-transparent"
            aria-hidden
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Build the table
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-[var(--color-text-primary)]">
                Invite friends to your league
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Open any league and tap <span className="text-[var(--color-text-primary)]">Share</span> for a link, QR code, or email.
              </p>
            </div>
            <Link
              href={`/league/${(teams ?? [])[0]?.league_id}`}
              className={cn(buttonVariants({ size: "sm" }), "tap-target gap-2 self-start sm:self-auto")}
            >
              <UserPlus className="size-4" /> Open invite
            </Link>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
