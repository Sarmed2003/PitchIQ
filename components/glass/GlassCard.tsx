import { cn } from "@/lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement>;

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "hover-surface rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl backdrop-saturate-150",
        className,
      )}
      style={{ boxShadow: "var(--glass-shadow)" }}
      {...props}
    />
  );
}
