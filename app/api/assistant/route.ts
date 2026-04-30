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

// Coach is the in-app fantasy football assistant. The model is routed through
// the Vercel AI Gateway by passing a "provider/model" string — no SDK glue
// needed beyond the env key. We give the model a small toolbox and let it
// decide what to call.
const MODEL = "openai/gpt-5.4-mini";

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 30 messages / 5 minutes is plenty for normal use and cuts off any client
  // stuck in a loop before it racks up gateway charges.
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
    // Up to 5 tool-calling steps before we stop the loop. Most useful answers
    // need 1-3 (e.g. getMyLeagues → getMyTeam → suggestCaptain).
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
