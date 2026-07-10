// debug + info are dev-only; warn + error log in all environments.
const isDev = process.env.NODE_ENV === "development";

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug("[pitchiq]", ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info("[pitchiq]", ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn("[pitchiq]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[pitchiq]", ...args);
  },
};
