"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

const QUICK_PROMPTS = [
  "Who should I captain this week?",
  "Top free agents at midfield?",
  "How do waivers work?",
  "What's a snake draft?",
];

// Floating Coach bubble. Sits bottom-right, just above the mobile tab bar,
// and stays mounted across navigations so the chat history survives moving
// between pages. Closed = a small avatar; open = a glass panel with the
// chat thread inside.
export function Assistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/assistant" }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <>
      <motion.button
        type="button"
        aria-label={open ? "Close Coach" : "Open Coach"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed z-40 size-14 rounded-full border border-[var(--color-glass-border)]",
          "bg-[var(--color-pitch)]/85 shadow-[0_18px_45px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl",
          "transition-all hover:scale-105 hover:border-[var(--color-accent)]/55",
          "right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)]",
          "lg:right-6 lg:bottom-6",
        )}
        initial={reduce ? undefined : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease, delay: 0.1 }}
        whileTap={{ scale: 0.94 }}
      >
        <Image
          src="/assistant/coach.png"
          alt=""
          width={56}
          height={56}
          className="size-full rounded-full object-contain p-1"
          priority={false}
        />
        <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-pitch)]">
          <Sparkles className="size-2.5" strokeWidth={2.6} />
        </span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="coach-panel"
            initial={reduce ? undefined : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.32, ease }}
            className={cn(
              "fixed z-40 flex flex-col overflow-hidden rounded-2xl border border-[var(--color-glass-border)]",
              "bg-[var(--color-surface)]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl",
              "right-3 left-3 bottom-[calc(env(safe-area-inset-bottom,0px)+9rem)]",
              "max-h-[min(70dvh,560px)]",
              "lg:left-auto lg:right-6 lg:bottom-24 lg:w-[400px] lg:max-h-[600px]",
            )}
            role="dialog"
            aria-label="Coach assistant"
          >
            <header className="flex items-center justify-between gap-3 border-b border-[var(--color-glass-border)]/70 px-4 py-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/assistant/coach.png"
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 rounded-full"
                />
                <div className="leading-tight">
                  <p className="font-display text-sm font-semibold text-[var(--color-text-primary)]">
                    Coach
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Your fantasy companion
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="tap-target rounded-full p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-glass)] hover:text-[var(--color-text-primary)]"
              >
                <X className="size-4" />
              </button>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm"
            >
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-[var(--color-text-muted)]">
                    Hey — I&apos;m Coach. Ask me anything about your team, the
                    rules, or what to do this week.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => submit(p)}
                        className="rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-3 py-2 text-left text-xs text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)]/45 hover:bg-[var(--color-glass)]/80"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[88%] rounded-2xl px-3.5 py-2 leading-relaxed",
                    m.role === "user"
                      ? "ml-auto bg-[var(--color-accent)]/85 text-[var(--color-pitch)]"
                      : "mr-auto bg-[var(--color-glass)] text-[var(--color-text-primary)]",
                  )}
                >
                  {m.parts.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <span key={i} className="whitespace-pre-wrap">
                          {part.text}
                        </span>
                      );
                    }
                    if (part.type.startsWith("tool-")) {
                      return (
                        <span
                          key={i}
                          className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]"
                        >
                          · checking {part.type.replace("tool-", "")}
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              ))}

              {status === "submitted" ? (
                <div className="mr-auto max-w-[60%] rounded-2xl bg-[var(--color-glass)] px-3.5 py-2 text-[var(--color-text-muted)]">
                  <span className="inline-flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
                  </span>
                </div>
              ) : null}

              {error ? (
                <div className="mr-auto rounded-xl bg-[var(--color-accent-danger)]/15 px-3 py-2 text-xs text-[var(--color-accent-danger)]">
                  Something went sideways. Try again in a sec.
                </div>
              ) : null}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex items-center gap-2 border-t border-[var(--color-glass-border)]/70 px-3 py-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Coach…"
                disabled={busy}
                className="flex-1 rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass)] px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]/55"
                aria-label="Message Coach"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Send"
                className="tap-target inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-pitch)] transition disabled:opacity-50"
              >
                <Send className="size-4" strokeWidth={2.4} />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
