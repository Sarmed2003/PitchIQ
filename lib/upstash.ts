import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Returns null when Upstash isn't configured — most call sites fall back to
// "no cache, no rate limit" so dev keeps working.
export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const limiters = new Map<string, Ratelimit>();

// Sliding-window limiter, cached per (key, limit, window) so we don't rebuild
// the Upstash client on every request.
export function getRateLimiter(
  key: string,
  limit: number,
  windowSeconds: number,
): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const cacheKey = `${key}:${limit}:${windowSeconds}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: true,
    prefix: `pitchiq:rl:${key}`,
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

// If Upstash isn't wired we just return success — the goal is "fail open" in
// dev, not "block everything because env is missing."
export async function checkRateLimit(
  identifier: string,
  options: { key: string; limit: number; windowSeconds: number },
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  const limiter = getRateLimiter(options.key, options.limit, options.windowSeconds);
  if (!limiter) return { success: true };
  const res = await limiter.limit(identifier);
  return { success: res.success, remaining: res.remaining, reset: res.reset };
}
