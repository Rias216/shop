import "server-only";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

const globalForRateLimit = globalThis as unknown as {
  rateLimitStore?: Map<string, RateLimitBucket>;
};

const store = globalForRateLimit.rateLimitStore ?? new Map<string, RateLimitBucket>();
if (!globalForRateLimit.rateLimitStore) {
  globalForRateLimit.rateLimitStore = store;
}

function nowMs(): number {
  return Date.now();
}

export function rateLimit(options: RateLimitOptions): RateLimitResult {
  const current = nowMs();
  const existing = store.get(options.key);

  if (!existing || existing.resetAt <= current) {
    store.set(options.key, { count: 1, resetAt: current + options.windowMs });
    return {
      ok: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSec: Math.ceil(options.windowMs / 1000),
    };
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - current) / 1000)),
    };
  }

  existing.count += 1;
  store.set(options.key, existing);
  return {
    ok: true,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - current) / 1000)),
  };
}

export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
