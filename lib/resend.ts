import { Resend } from "resend";
import { logger } from "@/lib/logger";

// Real send when RESEND_API_KEY is set, otherwise just logs the payload so
// dev doesn't need a configured Resend account.
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!key) {
    logger.info("Resend skipped (no RESEND_API_KEY)", params.subject, params.to);
    return { ok: true };
  }

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      logger.error("Resend error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    logger.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}
