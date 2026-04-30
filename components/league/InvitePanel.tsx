"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { motion, useReducedMotion } from "framer-motion";
import { Copy, QrCode, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";

type InvitePanelProps = {
  leagueName: string;
  inviteCode: string;
  appUrl?: string;
  className?: string;
};

// Invite UI: copy code, copy link, native share-sheet, QR, email. Designed
// mobile-first so big buttons are easy to thumb-press. The QR is handy when
// the whole league is in the same room.
export function InvitePanel({
  leagueName,
  inviteCode,
  appUrl,
  className,
}: InvitePanelProps) {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [showQR, setShowQR] = useState(false);

  const baseUrl = useMemo(() => {
    if (appUrl) return appUrl.replace(/\/$/, "");
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }, [appUrl]);

  const joinUrl = `${baseUrl}/join/${encodeURIComponent(inviteCode)}`;

  useEffect(() => {
    if (!showQR || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, joinUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 220,
      color: {
        dark: "#f4f6fb",
        light: "#0d1320",
      },
    }).catch(() => {});
  }, [showQR, joinUrl]);

  async function copy(value: string, kind: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    const text = `Join my fantasy Premier League — "${leagueName}" on PitchIQ.`;
    const url = joinUrl;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: `Join ${leagueName} on PitchIQ`, text, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await copy(url, "link");
  }

  return (
    <GlassCard className={cn("relative overflow-hidden p-5 sm:p-6", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/55 to-transparent" />
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
          Invite managers
        </p>
        <h2 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
          Build the table.
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Share <span className="text-[var(--color-text-primary)]">{leagueName}</span> with
          friends — they can join with one tap.
        </p>
      </div>

      {/* Code + link */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => copy(inviteCode, "code")}
          className="tap-target group flex items-center justify-between rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 py-2.5 text-left transition-colors hover:border-[var(--color-accent)]/45"
          aria-label="Copy invite code"
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Invite code
            </p>
            <p className="truncate font-mono text-base font-semibold tracking-[0.18em] text-[var(--color-accent)]">
              {inviteCode.toUpperCase()}
            </p>
          </div>
          {copied === "code" ? (
            <Check className="size-4 text-[var(--color-accent-2)]" />
          ) : (
            <Copy className="size-4 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent)]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => copy(joinUrl, "link")}
          className="tap-target group flex items-center justify-between rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 py-2.5 text-left transition-colors hover:border-[var(--color-accent)]/45"
          aria-label="Copy join link"
        >
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Join link
            </p>
            <p className="truncate font-mono text-xs text-[var(--color-text-primary)]">
              {joinUrl.replace(/^https?:\/\//, "")}
            </p>
          </div>
          {copied === "link" ? (
            <Check className="size-4 text-[var(--color-accent-2)]" />
          ) : (
            <Copy className="size-4 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent)]" />
          )}
        </button>
      </div>

      {/* Action row */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button
          type="button"
          onClick={nativeShare}
          className="tap-target gap-2"
          aria-label="Share invite"
        >
          <Share2 className="size-4" /> Share
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowQR((s) => !s)}
          className="tap-target gap-2 border-[var(--color-glass-border)]"
          aria-pressed={showQR}
        >
          <QrCode className="size-4" /> {showQR ? "Hide QR" : "QR code"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => copy(joinUrl, "link")}
          className="tap-target col-span-2 gap-2 border-[var(--color-glass-border)] sm:col-span-1"
        >
          <Copy className="size-4" /> Copy link
        </Button>
      </div>

      {/* QR drawer */}
      {showQR ? (
        <motion.div
          initial={reduce ? undefined : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 overflow-hidden"
        >
          <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-pitch)] p-4">
            <canvas ref={canvasRef} className="rounded-lg" />
            <p className="text-center text-xs text-[var(--color-text-muted)]">
              Scan to open the join screen on another device.
            </p>
          </div>
        </motion.div>
      ) : null}

    </GlassCard>
  );
}
