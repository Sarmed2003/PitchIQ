"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { getClubPalette } from "@/lib/clubs/palette";

export type JerseyState =
  | "default"
  | "captain"
  | "vice"
  | "bench"
  | "injured"
  | "suspended"
  | "goal";

type JerseySize = "xs" | "sm" | "md" | "lg";

type JerseyTokenProps = {
  club?: string | null;
  // Last name across the shoulders; number underneath. GK uses the keeper
  // colorway (desaturated + reversed accent).
  name?: string | null;
  number?: number | string | null;
  isGoalkeeper?: boolean;
  state?: JerseyState;
  size?: JerseySize;
  className?: string;
  title?: string;
};

const SIZES: Record<JerseySize, { box: number; nameSize: number; numSize: number; trim: number }> = {
  xs: { box: 28, nameSize: 4.5, numSize: 12, trim: 1.5 },
  sm: { box: 44, nameSize: 6, numSize: 18, trim: 1.8 },
  md: { box: 64, nameSize: 8, numSize: 26, trim: 2.4 },
  lg: { box: 160, nameSize: 16, numSize: 64, trim: 3.6 },
};

// Player avatar styled like a TV broadcast jersey. Inline SVG so it scales
// without aliasing and we can recolor it per club at runtime.
function JerseyTokenInner({
  club,
  name,
  number,
  isGoalkeeper = false,
  state = "default",
  size = "md",
  className,
  title,
}: JerseyTokenProps) {
  const palette = getClubPalette(club);
  const dims = SIZES[size];

  // GK kit inverts colors (broadcast convention: keeper stands out).
  const primary = isGoalkeeper ? palette.secondary : palette.primary;
  const secondary = isGoalkeeper ? palette.primary : palette.secondary;
  const textColor = palette.text;

  const lastName = (name ?? "").split(/\s+/).slice(-1)[0]?.toUpperCase() ?? "";
  const num = number != null && number !== "" ? String(number) : "";

  const desaturate = state === "bench";
  const ariaLabel =
    title ?? `${palette.name} jersey${num ? `, number ${num}` : ""}${lastName ? `, ${lastName}` : ""}`;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        desaturate && "opacity-60 saturate-0",
        className,
      )}
      style={{ width: dims.box, height: dims.box }}
      aria-label={ariaLabel}
      role="img"
    >
      <svg
        viewBox="0 0 100 110"
        width={dims.box}
        height={dims.box}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`shirt-grad-${club ?? "x"}-${size}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primary} stopOpacity="1" />
            <stop offset="100%" stopColor={primary} stopOpacity="0.86" />
          </linearGradient>
          <filter id={`shirt-shadow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.6" stdDeviation="0.7" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Shirt silhouette (with sleeves + collar notch) */}
        <path
          d="M20 18 L40 8 Q50 14 60 8 L80 18 L92 30 L82 40 L74 36 L74 96 Q74 100 70 100 L30 100 Q26 100 26 96 L26 36 L18 40 L8 30 Z"
          fill={`url(#shirt-grad-${club ?? "x"}-${size})`}
          stroke={secondary}
          strokeWidth={dims.trim * 0.45}
          filter={`url(#shirt-shadow-${size})`}
        />

        {/* Sleeve trim */}
        <path
          d="M8 30 L18 40 L26 36 M92 30 L82 40 L74 36"
          fill="none"
          stroke={secondary}
          strokeWidth={dims.trim * 0.7}
          strokeLinecap="round"
        />

        {/* Collar (subtle V) */}
        <path
          d="M40 8 Q50 18 60 8"
          fill="none"
          stroke={secondary}
          strokeWidth={dims.trim * 0.7}
          strokeLinecap="round"
        />

        {/* Last name across shoulders */}
        {lastName ? (
          <text
            x="50"
            y="46"
            textAnchor="middle"
            fill={textColor}
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"
            fontWeight="700"
            fontSize={dims.nameSize}
            letterSpacing="0.1"
            opacity="0.94"
          >
            {lastName.length > 9 ? lastName.slice(0, 9) : lastName}
          </text>
        ) : null}

        {/* Shirt number */}
        {num ? (
          <text
            x="50"
            y={lastName ? 78 : 70}
            textAnchor="middle"
            fill={textColor}
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"
            fontWeight="800"
            fontSize={dims.numSize}
            letterSpacing="-0.02em"
          >
            {num}
          </text>
        ) : null}

        {/* Captain / vice patch */}
        {state === "captain" ? (
          <g>
            <circle cx="78" cy="48" r="6" fill="#d4b676" stroke="#0a0e18" strokeWidth="0.5" />
            <text x="78" y="50.4" textAnchor="middle" fill="#0a0e18" fontWeight="800" fontSize="6">
              C
            </text>
          </g>
        ) : null}
        {state === "vice" ? (
          <g>
            <circle cx="78" cy="48" r="6" fill="#93a0b6" stroke="#0a0e18" strokeWidth="0.5" />
            <text x="78" y="50.4" textAnchor="middle" fill="#0a0e18" fontWeight="800" fontSize="6">
              V
            </text>
          </g>
        ) : null}

        {/* Injury / suspension overlays */}
        {state === "injured" ? (
          <g>
            <line x1="34" y1="62" x2="66" y2="62" stroke="#ef4f5e" strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="46" x2="50" y2="78" stroke="#ef4f5e" strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : null}
        {state === "suspended" ? (
          <line
            x1="22"
            y1="22"
            x2="78"
            y2="92"
            stroke="#ef4f5e"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.85"
          />
        ) : null}

        {/* Goal moment: pulsing emerald outline */}
        {state === "goal" ? (
          <path
            d="M20 18 L40 8 Q50 14 60 8 L80 18 L92 30 L82 40 L74 36 L74 96 Q74 100 70 100 L30 100 Q26 100 26 96 L26 36 L18 40 L8 30 Z"
            fill="none"
            stroke="#2ee6b3"
            strokeWidth="2.2"
            opacity="0.9"
          >
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" values="1.5;3;1.5" dur="1.4s" repeatCount="indefinite" />
          </path>
        ) : null}
      </svg>
    </span>
  );
}

export const JerseyToken = memo(JerseyTokenInner);
