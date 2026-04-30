import type { Position } from "./constants";

export function positionLabel(p: string): string {
  switch (p) {
    case "GK":
      return "Goalkeeper";
    case "DEF":
      return "Defender";
    case "MID":
      return "Midfielder";
    case "FWD":
      return "Forward";
    default:
      return p;
  }
}

export function isPosition(value: string): value is Position {
  return value === "GK" || value === "DEF" || value === "MID" || value === "FWD";
}
