import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

function makeLimiter(prefix: string, requests: number, window: `${number} ${"s" | "m" | "h"}`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `kindred:${prefix}`,
    analytics: true,
  });
}

export const limiters = {
  verify: makeLimiter("verify", 10, "1 m"),
  post: makeLimiter("post", 3, "5 m"),
  comment: makeLimiter("comment", 5, "1 m"),
  authCallback: makeLimiter("auth-cb", 10, "1 m"),
} as const;

export type LimiterKey = keyof typeof limiters;

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; reason: string };

export async function checkRateLimit(
  key: LimiterKey,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = limiters[key];
  if (!limiter) return { ok: true };

  const { success, reset } = await limiter.limit(identifier);
  if (success) return { ok: true };

  const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return {
    ok: false,
    retryAfterSeconds,
    reason: `요청이 너무 잦아요. ${retryAfterSeconds}초 후 다시 시도해 주세요.`,
  };
}
