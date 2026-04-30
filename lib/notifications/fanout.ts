import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type NotifyArgs = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
};

// Writes an in-app notification row. Email + Web Push will plug in here
// when we wire those channels up later.
export async function notify(
  supabase: SupabaseClient<Database>,
  args: NotifyArgs,
): Promise<{ ok: boolean; error?: string }> {
  const { error: insertErr } = await supabase.from("notifications").insert({
    user_id: args.userId,
    type: args.type,
    title: args.title,
    body: args.body ?? null,
    metadata: (args.metadata ?? {}) as Database["public"]["Tables"]["notifications"]["Insert"]["metadata"],
  });

  if (insertErr) {
    logger.warn("notify: insert failed", insertErr);
    return { ok: false, error: insertErr.message };
  }

  return { ok: true };
}
