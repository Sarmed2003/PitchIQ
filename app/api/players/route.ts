import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fail, ok, type ApiResponse } from "@/lib/api-response";
import { getRedis } from "@/lib/upstash";
import { logger } from "@/lib/logger";

type PlayerRow = {
  id: number;
  name: string;
  club: string;
  club_short: string | null;
  position: string | null;
  form: number | null;
  total_points: number | null;
  injury_status: string | null;
  photo_url: string | null;
  shirt_number: number | null;
};

function parseParams(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "24")));
  const position = searchParams.get("position") ?? undefined;
  const club = searchParams.get("club") ?? undefined;
  const q = searchParams.get("q")?.trim() ?? "";
  const sort = searchParams.get("sort") ?? "name";
  return { page, limit, position, club, q, sort };
}

function cacheKey(parts: Record<string, string | number | undefined>) {
  return `players:${JSON.stringify(parts)}`;
}

// Authenticated player list with cursor pagination + filters.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const body: ApiResponse<null> = fail("Unauthorized", 401);
      return NextResponse.json(body, { status: 401 });
    }

    const params = parseParams(request.nextUrl.searchParams);
    const redis = getRedis();
    const key = cacheKey(params);

    if (redis) {
      try {
        const cached = await redis.get<string>(key);
        if (cached) {
          const parsed = JSON.parse(cached) as ApiResponse<{ items: PlayerRow[]; total: number }>;
          return NextResponse.json(parsed, { status: parsed.status });
        }
      } catch (e) {
        logger.warn("Redis get failed", e);
      }
    }

    let query = supabase
      .from("players")
      .select(
        "id, name, club, club_short, position, form, total_points, injury_status, photo_url, shirt_number",
        { count: "exact" },
      );

    if (params.position) {
      query = query.eq("position", params.position);
    }
    if (params.club) {
      query = query.ilike("club", `%${params.club}%`);
    }
    if (params.q) {
      query = query.ilike("name", `%${params.q}%`);
    }

    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;

    switch (params.sort) {
      case "form":
        query = query.order("form", { ascending: false, nullsFirst: false });
        break;
      case "points":
        query = query.order("total_points", { ascending: false });
        break;
      default:
        query = query.order("name", { ascending: true });
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      const body = fail(error.message, 500);
      return NextResponse.json(body, { status: 500 });
    }

    const payload = ok({
      items: (data ?? []) as PlayerRow[],
      total: count ?? 0,
    });

    if (redis) {
      try {
        await redis.set(key, JSON.stringify(payload), { ex: 120 });
      } catch (e) {
        logger.warn("Redis set failed", e);
      }
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (e) {
    logger.error(e);
    const body = fail("Internal error", 500);
    return NextResponse.json(body, { status: 500 });
  }
}
