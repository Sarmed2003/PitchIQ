"use client";

import { useEffect, useRef } from "react";

// One beep + flashing tab title on the rising edge of `active`.
export function useTurnAlert(active: boolean, label = "🟢 Your pick — PitchIQ") {
  const wasActive = useRef(false);
  const originalTitle = useRef<string | null>(null);
  const flashHandle = useRef<number | null>(null);

  useEffect(() => {
    if (active && !wasActive.current) {
      try {
        const ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.08;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.stop(ctx.currentTime + 0.4);
      } catch {
        // AudioContext unavailable (e.g. Safari pre-interaction).
      }

      if (originalTitle.current === null) originalTitle.current = document.title;
      let toggle = false;
      const interval = window.setInterval(() => {
        toggle = !toggle;
        document.title = toggle ? label : (originalTitle.current ?? "PitchIQ");
      }, 1100);
      flashHandle.current = interval;
    }

    if (!active && wasActive.current) {
      if (flashHandle.current !== null) {
        clearInterval(flashHandle.current);
        flashHandle.current = null;
      }
      if (originalTitle.current !== null) {
        document.title = originalTitle.current;
      }
    }

    wasActive.current = active;
    return () => {
      if (flashHandle.current !== null) {
        clearInterval(flashHandle.current);
        flashHandle.current = null;
      }
    };
  }, [active, label]);
}
