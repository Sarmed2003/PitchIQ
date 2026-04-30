import { GlassCard } from "@/components/glass/GlassCard";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AsyncDraftPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return (
    <GlassCard className="max-w-xl p-6">
      <h1 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
        Async draft
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        League {roomId.slice(0, 8)}… uses the same board as the live room with a longer
        clock and email reminders — open the live draft view for now to make picks.
      </p>
      <Link
        href={`/draft/${roomId}`}
        className={cn(buttonVariants(), "mt-6 inline-flex justify-center")}
      >
        Open draft board
      </Link>
    </GlassCard>
  );
}
