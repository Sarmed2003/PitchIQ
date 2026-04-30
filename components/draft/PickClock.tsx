"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  deadlineIso: string | null;
  onExpire?: () => void;
};

export function PickClock({ deadlineIso, onExpire }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const { left, total } = useMemo(() => {
    if (!deadlineIso) return { left: 0, total: 90 };
    const end = new Date(deadlineIso).getTime();
    const leftSec = Math.max(0, Math.ceil((end - now) / 1000));
    return { left: leftSec, total: 90 };
  }, [deadlineIso, now]);

  useEffect(() => {
    if (!deadlineIso || left > 0 || fired.current) return;
    fired.current = true;
    onExpire?.();
  }, [deadlineIso, left, onExpire]);

  useEffect(() => {
    fired.current = false;
  }, [deadlineIso]);

  const pct = total > 0 ? Math.min(100, (left / total) * 100) : 0;
  const color =
    left <= 10
      ? "var(--color-accent-danger)"
      : left <= 30
        ? "var(--color-accent-warn)"
        : "var(--color-accent)";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
        <circle
          cx="44"
          cy="44"
          r="38"
          fill="none"
          stroke="var(--color-glass-border)"
          strokeWidth="8"
        />
        <circle
          cx="44"
          cy="44"
          r="38"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${2 * Math.PI * 38}`}
          strokeDashoffset={`${2 * Math.PI * 38 * (1 - pct / 100)}`}
          transform="rotate(-90 44 44)"
          strokeLinecap="round"
        />
        <text
          x="44"
          y="48"
          textAnchor="middle"
          className="fill-[var(--color-text-primary)] font-mono text-sm font-semibold"
        >
          {left}s
        </text>
      </svg>
    </div>
  );
}
