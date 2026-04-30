import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { JoinForm } from "@/components/league/JoinForm";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ code: string }> };

export default async function JoinPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createServerSupabaseClient();

  // Look up league via existing invite-resolver RPC; tolerate misses.
  const { data: rows } = await supabase.rpc("get_league_by_invite", {
    code: code.trim(),
  });
  const league = rows?.[0];
  if (!league) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is logged out, send them to sign up first; preserve the deep link.
  if (!user) {
    const next = `/join/${encodeURIComponent(code)}`;
    redirect(`/signup?next=${encodeURIComponent(next)}`);
  }

  // Already a member? Bounce straight to the league hub.
  const { data: existing } = await supabase
    .from("teams")
    .select("id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    redirect(`/league/${league.id}`);
  }

  const { count: teamCount } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true })
    .eq("league_id", league.id);

  const seatsLeft = Math.max(0, (league.max_teams ?? 10) - (teamCount ?? 0));

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--color-pitch)] p-4">
      <div className="pointer-events-none absolute inset-0 hero-mesh opacity-80" aria-hidden />
      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mb-4 inline-flex font-display text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
        >
          ← PitchIQ
        </Link>
        <GlassCard className="relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent" />
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Invitation
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Join {league.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Season {league.season ?? "2025-26"} · {league.draft_type ?? "snake"} draft ·{" "}
            <span className="text-[var(--color-accent-2)]">
              {seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left
            </span>
          </p>

          <div className="luxury-divider my-5" aria-hidden />

          {seatsLeft <= 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-text-muted)]">
                This league is full. Ask your commissioner to raise the limit, or head back to your dashboard.
              </p>
              <Link
                href="/dashboard"
                className={cn(buttonVariants(), "tap-target inline-flex w-full justify-center")}
              >
                Back to dashboard
              </Link>
            </div>
          ) : (
            <JoinForm inviteCode={code} leagueName={league.name} />
          )}
        </GlassCard>
      </div>
    </div>
  );
}
