import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Returns null when Upstash env vars are missing so local dev works without
// a Redis instance. Supports both native Upstash names and Vercel KV integration.
export function getRedis(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const limiters = new Map<string, Ratelimit>();

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

// Fails open when Upstash isn't configured or Redis is unreachable.
export async function checkRateLimit(
  identifier: string,
  options: { key: string; limit: number; windowSeconds: number },
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  const limiter = getRateLimiter(options.key, options.limit, options.windowSeconds);
  if (!limiter) return { success: true };
  try {
    const res = await limiter.limit(identifier);
    return { success: res.success, remaining: res.remaining, reset: res.reset };
  } catch (err) {
    console.error("[upstash] rate limit check failed, failing open:", err);
    return { success: true };
  }
}
