import { NextResponse } from "next/server";
import { ok } from "@/lib/api-response";

/** Mock live ticker payload until fixtures sync drives real data. */
export async function GET() {
  return NextResponse.json(
    ok({
      matches: [
        { home: "ARS", away: "TOT", homeScore: 1, awayScore: 1, minute: 72, live: true },
        { home: "LIV", away: "CHE", homeScore: 0, awayScore: 0, minute: 34, live: true },
      ],
      updatedAt: new Date().toISOString(),
    }),
    { status: 200 },
  );
}
