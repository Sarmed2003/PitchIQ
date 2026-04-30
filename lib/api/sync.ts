import type { Json } from "@/types/database.types";

// Coerces whatever the provider hands us into something Postgres-safe so
// player_match_stats.raw_stats can store it as JSONB.
export function normalizeRawStats(payload: unknown): Json {
  if (
    payload === null ||
    typeof payload === "string" ||
    typeof payload === "number" ||
    typeof payload === "boolean"
  ) {
    return payload;
  }
  if (Array.isArray(payload)) {
    return payload.map((x) => normalizeRawStats(x)) as Json;
  }
  if (typeof payload === "object") {
    const out: Record<string, Json> = {};
    for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
      out[k] = normalizeRawStats(v) as Json;
    }
    return out;
  }
  return String(payload);
}
