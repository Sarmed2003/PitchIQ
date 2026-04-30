import { sendTransactionalEmail } from "@/lib/resend";
import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type NotifyArgs = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
  email?: {
    to: string;
    subject: string;
    html: string;
  };
};

// One place to fan out a notification to all channels (in-app row, optional
// email). Web Push will plug in here once we ship it. Email is best-effort:
// if Resend is down the in-app row still goes through.
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
  }

  if (args.email) {
    try {
      const r = await sendTransactionalEmail(args.email);
      if (!r.ok) logger.warn("notify: email failed", r.error);
    } catch (e) {
      logger.warn("notify: email threw", e);
    }
  }

  return { ok: !insertErr };
}
