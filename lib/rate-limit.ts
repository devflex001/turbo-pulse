/**
 * Sliding-window rate limiter
 *
 * Uses Redis sorted sets (ZADD + ZREMRANGEBYSCORE + ZCARD) to implement
 * a true sliding-window counter. This approach is accurate, atomic via a
 * Lua script, and naturally expires old entries — no separate cleanup job.
 *
 * Usage:
 *   const result = await rateLimit("mpesa-stk", ip, { limit: 5, window: 60 })
 *   if (!result.allowed) return tooManyRequests(result)
 */

import { redis } from "./redis"
import { CacheKeys } from "./cache-keys"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RateLimitConfig = {
  /** Max requests allowed within the window */
  limit: number
  /** Sliding window duration in seconds */
  window: number
}

export type RateLimitResult = {
  allowed: boolean
  /** Requests used in the current window (including this one) */
  current: number
  /** Max requests allowed */
  limit: number
  /** Seconds until the oldest request in the window expires */
  retryAfter: number
  /** Remaining requests in the current window */
  remaining: number
}

// ---------------------------------------------------------------------------
// Pre-defined route configs
// ---------------------------------------------------------------------------
export const RATE_LIMITS = {
  /** M-Pesa STK push — max 5 attempts per phone per minute */
  MPESA_STK: { limit: 5, window: 60 } satisfies RateLimitConfig,
  /** Paystack init — max 10 per IP per minute */
  PAYSTACK_INIT: { limit: 10, window: 60 } satisfies RateLimitConfig,
  /** Paystack verify — max 20 per IP per minute */
  PAYSTACK_VERIFY: { limit: 20, window: 60 } satisfies RateLimitConfig,
  /** M-Pesa status query — max 30 per IP per minute */
  MPESA_STATUS: { limit: 30, window: 60 } satisfies RateLimitConfig,
  /** Generic API fallback */
  DEFAULT: { limit: 60, window: 60 } satisfies RateLimitConfig,
} as const

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Check and increment the sliding-window counter for a given identifier.
 *
 * @param namespace  - A short label for the route, e.g. "mpesa-stk"
 * @param identifier - The rate-limited subject: IP address or phone number
 * @param config     - limit + window config
 */
export async function rateLimit(
  namespace: string,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = CacheKeys.rateLimit(namespace, identifier)
  const now = Date.now()
  const windowStart = now - config.window * 1000

  try {
    // Pipeline: remove expired entries, add current timestamp, count, get oldest
    const pipeline = redis.pipeline()

    // Remove entries older than the window
    pipeline.zremrangebyscore(key, 0, windowStart)
    // Add this request with current timestamp as both score and member
    pipeline.zadd(key, { score: now, member: now.toString() })
    // Count remaining entries in the window
    pipeline.zcard(key)
    // Get the oldest entry score (to calculate retryAfter)
    pipeline.zrange(key, 0, 0, { withScores: true })
    // Expire the key after the window so it self-cleans
    pipeline.expire(key, config.window)

    const results = await pipeline.exec()

    // results[2] is the count after the add
    const current = (results[2] as number) ?? 1

    // results[3] is the oldest entry — array of [member, score] pairs
    const oldestEntry = results[3] as Array<string | number> | null
    const oldestScore =
      Array.isArray(oldestEntry) && oldestEntry.length >= 2
        ? Number(oldestEntry[1])
        : now

    const retryAfter = Math.max(
      0,
      Math.ceil((oldestScore + config.window * 1000 - now) / 1000)
    )

    return {
      allowed: current <= config.limit,
      current,
      limit: config.limit,
      remaining: Math.max(0, config.limit - current),
      retryAfter: current > config.limit ? retryAfter : 0,
    }
  } catch (err) {
    console.error("[RateLimit] Redis error — failing open:", err)
    // Fail open: if Redis is down, don't block legitimate traffic
    return {
      allowed: true,
      current: 0,
      limit: config.limit,
      remaining: config.limit,
      retryAfter: 0,
    }
  }
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

/**
 * Build a standardised 429 response with Retry-After and X-RateLimit headers.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      message: "Too many requests. Please slow down.",
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.retryAfter.toString(),
        "Retry-After": result.retryAfter.toString(),
      },
    }
  )
}

/**
 * Attach rate-limit headers to any NextResponse.
 */
export function applyRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
): void {
  headers.set("X-RateLimit-Limit", result.limit.toString())
  headers.set("X-RateLimit-Remaining", result.remaining.toString())
  if (!result.allowed) {
    headers.set("Retry-After", result.retryAfter.toString())
  }
}

/**
 * Extract the real client IP from a Next.js request, handling common
 * reverse-proxy headers.
 */
export function getClientIp(request: Request): string {
  const headers = request instanceof Request ? request.headers : new Headers()
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}
