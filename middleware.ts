/**
 * Next.js Edge Middleware — API route rate limiting
 *
 * Runs at the Edge before any API handler, adding a first line of defence
 * against abuse across all /api routes. Per-route limits are enforced again
 * inside the handlers themselves (defence in depth), but this middleware
 * stops obvious floods before they even touch Node.js.
 *
 * Protections applied here:
 *  - All /api/* routes: 120 req / 60 s per IP (coarse global limit)
 *  - /api/mpesa/initiate-stk:  5 req / 60 s per IP
 *  - /api/paystack/initialize: 10 req / 60 s per IP
 *  - /api/paystack/verify:     20 req / 60 s per IP
 *  - /api/mpesa/query-status:  30 req / 60 s per IP
 *
 * The Edge Runtime cannot import Node.js modules, so we use @upstash/redis
 * directly (it is Edge-compatible via the REST API).
 */

import { NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// ---------------------------------------------------------------------------
// Route-specific limits  [limit, windowSeconds]
// ---------------------------------------------------------------------------
const ROUTE_LIMITS: Array<{
  matcher: RegExp
  namespace: string
  limit: number
  window: number
}> = [
  {
    matcher: /^\/api\/mpesa\/initiate-stk/,
    namespace: "mw:mpesa-stk",
    limit: 5,
    window: 60,
  },
  {
    matcher: /^\/api\/paystack\/initialize/,
    namespace: "mw:paystack-init",
    limit: 10,
    window: 60,
  },
  {
    matcher: /^\/api\/paystack\/verify/,
    namespace: "mw:paystack-verify",
    limit: 20,
    window: 60,
  },
  {
    matcher: /^\/api\/mpesa\/query-status/,
    namespace: "mw:mpesa-status",
    limit: 30,
    window: 60,
  },
  // Global API fallback — must be last
  {
    matcher: /^\/api\//,
    namespace: "mw:api-global",
    limit: 120,
    window: 60,
  },
]

// ---------------------------------------------------------------------------
// Lazy Redis client — only instantiated when the middleware actually runs
// ---------------------------------------------------------------------------
let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}

// ---------------------------------------------------------------------------
// Sliding-window check (mirrors lib/rate-limit.ts but inlined for Edge)
// ---------------------------------------------------------------------------
async function checkRateLimit(
  redis: Redis,
  namespace: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const key = `betflexx:rl:${namespace}:${identifier}`
  const now = Date.now()
  const windowStart = now - windowSeconds * 1000

  try {
    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(key, 0, windowStart)
    pipeline.zadd(key, { score: now, member: now.toString() })
    pipeline.zcard(key)
    pipeline.zrange(key, 0, 0, { withScores: true })
    pipeline.expire(key, windowSeconds)

    const results = await pipeline.exec()
    const current = (results[2] as number) ?? 1
    const oldestEntry = results[3] as Array<string | number> | null
    const oldestScore =
      Array.isArray(oldestEntry) && oldestEntry.length >= 2
        ? Number(oldestEntry[1])
        : now

    const retryAfter = Math.max(
      0,
      Math.ceil((oldestScore + windowSeconds * 1000 - now) / 1000)
    )

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      retryAfter: current > limit ? retryAfter : 0,
    }
  } catch {
    // Fail open — Redis unavailability must not block requests
    return { allowed: true, remaining: limit, retryAfter: 0 }
  }
}

// ---------------------------------------------------------------------------
// Client IP extraction
// ---------------------------------------------------------------------------
function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

// ---------------------------------------------------------------------------
// Middleware entry point
// ---------------------------------------------------------------------------
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only apply to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Skip the internal cache invalidation endpoint from rate limiting
  // (it's already protected by the shared secret)
  if (pathname.startsWith("/api/cache/invalidate")) {
    return NextResponse.next()
  }

  const redis = getRedis()

  // If Redis is not configured, pass through without rate limiting
  if (!redis) {
    console.warn("[Middleware] Redis not configured — rate limiting disabled")
    return NextResponse.next()
  }

  const ip = getIp(request)

  // Find the most specific matching rule
  const rule = ROUTE_LIMITS.find((r) => r.matcher.test(pathname))
  if (!rule) return NextResponse.next()

  const result = await checkRateLimit(
    redis,
    rule.namespace,
    ip,
    rule.limit,
    rule.window
  )

  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({
        message: "Too many requests. Please slow down.",
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": rule.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "Retry-After": result.retryAfter.toString(),
        },
      }
    )
  }

  // Pass through and attach rate limit info headers for observability
  const response = NextResponse.next()
  response.headers.set("X-RateLimit-Limit", rule.limit.toString())
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString())
  return response
}

export const config = {
  matcher: ["/api/:path*"],
}
