import { cn } from "@/lib/utils";

type GlassPanelProps = React.HTMLAttributes<HTMLDivElement>;

export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "hover-surface rounded-2xl border border-[var(--color-glass-border)]/90 bg-[color-mix(in_oklab,var(--color-surface)_78%,transparent)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
