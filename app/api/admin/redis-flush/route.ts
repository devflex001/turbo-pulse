/**
 * POST /api/admin/redis-flush
 *
 * Scoped cache-flush endpoint for the admin dashboard.
 * Accepts a { scope } body and deletes only the matching key namespace.
 * Never flushes the entire Redis database — always scoped to betflexx: prefix.
 *
 * Scopes:
 *   "matches"      — all match/competition list caches
 *   "rate-limits"  — clears all sliding-window rl: buckets (useful after testing)
 *   "mpesa"        — idempotency + status keys
 *   "paystack"     — idempotency keys
 *   "admin"        — admin stats cache
 *   "locks"        — any stuck stampede locks
 *   "all"          — everything under betflexx: prefix
 */

import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { APP_PREFIX } from "@/lib/cache-keys"

type FlushScope =
  | "matches"
  | "rate-limits"
  | "mpesa"
  | "paystack"
  | "admin"
  | "locks"
  | "all"

const SCOPE_PATTERNS: Record<FlushScope, string> = {
  matches:     `${APP_PREFIX}:matches:*`,
  "rate-limits": `${APP_PREFIX}:rl:*`,
  mpesa:       `${APP_PREFIX}:mpesa:*`,
  paystack:    `${APP_PREFIX}:paystack:*`,
  admin:       `${APP_PREFIX}:admin:*`,
  locks:       `${APP_PREFIX}:lock:*`,
  all:         `${APP_PREFIX}:*`,
}

async function flushPattern(pattern: string): Promise<number> {
  let cursor = 0
  let deleted = 0
  do {
    const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 })
    cursor = Number(nextCursor)
    if (keys.length > 0) {
      await redis.del(...keys)
      deleted += keys.length
    }
  } while (cursor !== 0)
  return deleted
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { scope?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 })
  }

  const scope = body.scope as FlushScope | undefined
  if (!scope || !(scope in SCOPE_PATTERNS)) {
    return NextResponse.json(
      {
        message: "Invalid or missing scope",
        valid: Object.keys(SCOPE_PATTERNS),
      },
      { status: 400 }
    )
  }

  try {
    const pattern = SCOPE_PATTERNS[scope]
    const deleted = await flushPattern(pattern)

    console.warn(`[redis-flush] scope="${scope}" pattern="${pattern}" deleted=${deleted}`)

    return NextResponse.json({ success: true, scope, deleted })
  } catch (err) {
    console.error("[redis-flush] Error:", err)
    return NextResponse.json(
      { message: "Flush failed", error: String(err) },
      { status: 500 }
    )
  }
}
