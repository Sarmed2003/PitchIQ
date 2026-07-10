import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/upstash";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { buildAssistantTools } from "@/lib/ai/tools";

export const runtime = "nodejs";
export const maxDuration = 30;

// Routed through the Vercel AI Gateway via a "provider/model" string.
const MODEL = "openai/gpt-5.4-mini";

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rl = await checkRateLimit(user.id, {
    key: "assistant",
    limit: 30,
    windowSeconds: 300,
  });
  if (!rl.success) {
    return new Response("Slow down — try again in a minute.", { status: 429 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: buildAssistantTools(supabase, user.id),
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
