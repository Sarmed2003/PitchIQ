import { cn } from "@/lib/utils";

type GlassBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "accent" | "warn" | "danger";
};

const variants: Record<NonNullable<GlassBadgeProps["variant"]>, string> = {
  default: "border-[var(--color-glass-border)] bg-[var(--color-glass)] text-[var(--color-text-primary)]",
  accent: "border-[var(--color-accent)]/45 bg-[var(--color-accent)]/12 text-[var(--color-accent)]",
  warn: "border-[var(--color-accent-warn)]/45 bg-[var(--color-accent-warn)]/12 text-[var(--color-accent-warn)]",
  danger: "border-[var(--color-accent-danger)]/45 bg-[var(--color-accent-danger)]/12 text-[var(--color-accent-danger)]",
};

export function GlassBadge({
  className,
  variant = "default",
  ...props
}: GlassBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-xs font-medium transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-[0_0_12px_rgba(46,230,192,0.15)]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
