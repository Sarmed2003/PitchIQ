import { GlassPanel } from "@/components/glass/GlassPanel";

export function DraftAssistantPlaceholder() {
  return (
    <GlassPanel className="flex h-full min-h-0 flex-col p-4">
      <p className="font-display text-sm font-medium text-[var(--color-text-primary)]">
        Draft assistant
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
        AI-powered pick chat and comparisons ship in a later release. For now, trust
        the tape: form, fixtures, and minutes drive the board.
      </p>
    </GlassPanel>
  );
}
