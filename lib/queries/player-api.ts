import type { ApiResponse } from "@/lib/api-response";

export type PlayersListPayload = {
  items: Array<{
    id: number;
    name: string;
    club: string;
    club_short: string | null;
    position: string | null;
    form: string;
    total_points: number;
    injury_status: string;
    photo_url: string | null;
    shirt_number: number | null;
  }>;
  total: number;
};

// Player list fetcher used by the TanStack Query hook.
export async function fetchPlayersPage(params: {
  page: number;
  limit?: number;
  position?: string;
  q?: string;
  sort?: string;
}): Promise<PlayersListPayload> {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.position) search.set("position", params.position);
  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);

  const res = await fetch(`/api/players?${search.toString()}`, {
    credentials: "include",
  });
  const json = (await res.json()) as ApiResponse<PlayersListPayload>;
  if (!res.ok || json.error || !json.data) {
    throw new Error(json.error ?? "Failed to load players");
  }
  return json.data;
}
