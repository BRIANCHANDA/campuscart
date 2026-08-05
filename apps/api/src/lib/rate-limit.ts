import type { MiddlewareHandler } from "hono";
import { env } from "../env";
import { AppError } from "./errors";
import { logger } from "./logger";

/**
 * Rate limiting behind a store interface.
 *
 * - `InMemoryRateLimitStore` (default): sliding window, perfect for the
 *   single-instance docker-compose deployment.
 * - `RedisRateLimitStore` (when REDIS_URL is set): fixed window via
 *   INCR + PEXPIRE — one shared counter across every API replica. Fixed
 *   windows admit brief bursts at boundaries, an acceptable trade for an
 *   atomic, dependency-light implementation on brute-force endpoints.
 *
 * The middleware never fails open silently on store errors EXCEPT for
 * infrastructure failures (Redis down), where availability of login beats
 * strictness — logged loudly either way.
 */
export interface RateLimitStore {
  /** Register a hit; report whether it's allowed and when to retry if not. */
  hit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; retryAfterSec: number }>;
}

// ---------------------------------------------------------------------------
export class InMemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, number[]>();
  private lastGc = Date.now();
  private static GC_INTERVAL_MS = 10 * 60 * 1000;

  async hit(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    this.gc(windowMs, now);
    const timestamps = (this.buckets.get(key) ?? []).filter((t) => now - t < windowMs);
    if (timestamps.length >= limit) {
      const oldest = timestamps[0] ?? now;
      this.buckets.set(key, timestamps);
      return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)) };
    }
    timestamps.push(now);
    this.buckets.set(key, timestamps);
    return { allowed: true, retryAfterSec: 0 };
  }

  private gc(windowMs: number, now: number): void {
    if (now - this.lastGc < InMemoryRateLimitStore.GC_INTERVAL_MS) return;
    this.lastGc = now;
    for (const [key, ts] of this.buckets) {
      const live = ts.filter((t) => now - t < windowMs);
      if (live.length === 0) this.buckets.delete(key);
      else this.buckets.set(key, live);
    }
  }

  /** Test helper. */
  reset(): void {
    this.buckets.clear();
  }
}

// ---------------------------------------------------------------------------
type RedisLike = {
  incr(key: string): Promise<number>;
  send(command: string, args: string[]): Promise<unknown>;
};

export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly client: RedisLike) {}

  async hit(key: string, limit: number, windowMs: number) {
    const redisKey = `rl:${key}`;
    const n = await this.client.incr(redisKey);
    if (n === 1) await this.client.send("PEXPIRE", [redisKey, String(windowMs)]);
    if (n <= limit) return { allowed: true, retryAfterSec: 0 };
    const pttl = Number(await this.client.send("PTTL", [redisKey]));
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((pttl > 0 ? pttl : windowMs) / 1000)) };
  }
}

// ---------------------------------------------------------------------------
// Default store: Redis when configured, in-memory otherwise
async function buildDefaultStore(): Promise<RateLimitStore> {
  if (env.REDIS_URL) {
    try {
      const { RedisClient } = await import("bun");
      const store = new RedisRateLimitStore(new RedisClient(env.REDIS_URL));
      logger.info("rate_limit.store", { kind: "redis" });
      return store;
    } catch (err) {
      logger.error("rate_limit.redis_unavailable", { message: String(err) });
    }
  }
  return new InMemoryRateLimitStore();
}
const defaultStorePromise = buildDefaultStore();

export function rateLimit(options: {
  limit: number;
  windowMs: number;
  /** Extracts the per-request discriminator (e.g. email from the body). */
  keyFrom?: (body: unknown) => string;
  /** Injectable for tests. */
  store?: RateLimitStore;
}): MiddlewareHandler {
  return async (c, next) => {
    const store = options.store ?? (await defaultStorePromise);

    const ip =
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
      c.req.header("X-Real-IP") ??
      "unknown";

    let discriminator = "";
    if (options.keyFrom) {
      const body = await c.req.json().catch(() => null); // hono caches the parse
      discriminator = options.keyFrom(body);
    }
    const key = `${c.req.path}:${ip}:${discriminator}`;

    let verdict: { allowed: boolean; retryAfterSec: number };
    try {
      verdict = await store.hit(key, options.limit, options.windowMs);
    } catch (err) {
      // Store infrastructure failure: fail open, but never quietly
      logger.error("rate_limit.store_error", { message: String(err) });
      verdict = { allowed: true, retryAfterSec: 0 };
    }

    if (!verdict.allowed) {
      logger.warn("rate_limit.hit", { path: c.req.path, ip });
      c.header("Retry-After", String(verdict.retryAfterSec));
      throw new AppError(429, "RATE_LIMITED", "Too many attempts — try again shortly");
    }
    await next();
  };
}
