import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

// Lightweight idempotency layer. If the client sends an Idempotency-Key header
// twice (flaky network, duplicate tap, etc.), we read the cached result on the
// second call instead of re-running the mutation. PK is (user_id, key) so
// concurrent retries collide cleanly.

type DB = SupabaseClient<Database>;

export async function readIdempotent(
  supabase: DB,
  userId: string,
  key: string,
): Promise<Json | null> {
  const { data } = await supabase
    .from("idempotency_keys")
    .select("result")
    .eq("user_id", userId)
    .eq("key", key)
    .maybeSingle();
  return data?.result ?? null;
}

export async function writeIdempotent(
  supabase: DB,
  userId: string,
  key: string,
  result: Json,
): Promise<void> {
  await supabase
    .from("idempotency_keys")
    .upsert(
      { user_id: userId, key, result },
      { onConflict: "user_id,key" },
    );
}

export async function withIdempotency<T extends Json>(
  supabase: DB,
  userId: string,
  key: string | null | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  if (!key) return fn();
  const cached = await readIdempotent(supabase, userId, key);
  if (cached !== null) return cached as T;
  const result = await fn();
  await writeIdempotent(supabase, userId, key, result);
  return result;
}
