import { cn } from "@/lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement>;

// Frosted-glass card. Used as the default container for everything that
// sits on top of the pitch backdrop.
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
