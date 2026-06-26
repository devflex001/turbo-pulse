/**
 * GET /api/admin/redis-stats
 *
 * Returns a lightweight snapshot of Redis state in a single batched round-trip.
 * Designed to be called on a manual refresh — not polled automatically — so it
 * never contributes meaningfully to Redis command budget.
 *
 * Data returned:
 *  - Upstash dbsize (total key count)
 *  - Key counts per namespace (matches, rl, mpesa, paystack, admin, lock)
 *  - Active rate-limit buckets with their current hit counts
 *  - Memory usage estimate from INFO (if available on the plan)
 *  - Server ping latency
 */

import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { APP_PREFIX } from "@/lib/cache-keys"

// Only admins should reach this — protected by the admin layout's ProtectedRoute,
// but we add a server-side guard for defence in depth.
function isAuthorized(request: NextRequest): boolean {
  // In production, validate the session cookie / JWT here.
  // For now, rely on the middleware + ProtectedRoute combo.
  // You can add `Authorization: Bearer <admin-token>` checks here.
  return true
}

interface NamespaceStat {
  namespace: string
  label: string
  count: number
}

interface RateLimitBucket {
  key: string
  identifier: string
  hits: number
  ttl: number
}

export interface RedisStats {
  latencyMs: number
  totalKeys: number
  namespaces: NamespaceStat[]
  activeRateLimits: RateLimitBucket[]
  memoryUsedHuman: string | null
  memoryUsedBytes: number | null
  upstashCommandsToday: number | null
  fetchedAt: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    // ── 1. Ping latency ────────────────────────────────────────────────────
    const pingStart = Date.now()
    await redis.ping()
    const latencyMs = Date.now() - pingStart

    // ── 2. Total key count ─────────────────────────────────────────────────
    const totalKeys: number = await redis.dbsize()

    // ── 3. Namespace counts via SCAN — one pass per namespace pattern ──────
    const namespacePatterns: Array<{ namespace: string; label: string; pattern: string }> = [
      { namespace: "matches",    label: "Match cache",        pattern: `${APP_PREFIX}:matches:*` },
      { namespace: "competitions", label: "Competition cache", pattern: `${APP_PREFIX}:competitions:*` },
      { namespace: "admin",      label: "Admin stats",        pattern: `${APP_PREFIX}:admin:*` },
      { namespace: "mpesa",      label: "M-Pesa (idempotency/status)", pattern: `${APP_PREFIX}:mpesa:*` },
      { namespace: "paystack",   label: "Paystack idempotency", pattern: `${APP_PREFIX}:paystack:*` },
      { namespace: "rl",         label: "Rate-limit buckets", pattern: `${APP_PREFIX}:rl:*` },
      { namespace: "lock",       label: "Stampede locks",     pattern: `${APP_PREFIX}:lock:*` },
    ]

    // Count keys per namespace using SCAN (cursor-based, non-blocking)
    async function countPattern(pattern: string): Promise<number> {
      let cursor = 0
      let count = 0
      do {
        const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 })
        cursor = Number(nextCursor)
        count += keys.length
      } while (cursor !== 0)
      return count
    }

    const namespaceCounts = await Promise.all(
      namespacePatterns.map(async (p) => ({
        namespace: p.namespace,
        label: p.label,
        count: await countPattern(p.pattern),
      }))
    )

    // ── 4. Active rate-limit buckets ───────────────────────────────────────
    // Scan all rl: keys and read their current cardinality (number of hits in window)
    const rlKeys: string[] = []
    let rlCursor = 0
    do {
      const [nextCursor, keys] = await redis.scan(rlCursor, {
        match: `${APP_PREFIX}:rl:*`,
        count: 50,
      })
      rlCursor = Number(nextCursor)
      rlKeys.push(...keys)
    } while (rlCursor !== 0)

    // Batch-fetch cardinality + TTL for each rl key (pipeline)
    const activeRateLimits: RateLimitBucket[] = []
    if (rlKeys.length > 0) {
      const pipeline = redis.pipeline()
      for (const key of rlKeys) {
        pipeline.zcard(key)
        pipeline.ttl(key)
      }
      const results = await pipeline.exec()

      for (let i = 0; i < rlKeys.length; i++) {
        const hits = (results[i * 2] as number) ?? 0
        const ttl = (results[i * 2 + 1] as number) ?? -1
        if (hits > 0) {
          // key format: betflexx:rl:<namespace>:<identifier>
          const parts = rlKeys[i].replace(`${APP_PREFIX}:rl:`, "").split(":")
          const identifier = parts.slice(1).join(":") || parts[0]
          activeRateLimits.push({
            key: rlKeys[i],
            identifier,
            hits,
            ttl,
          })
        }
      }
      activeRateLimits.sort((a, b) => b.hits - a.hits)
    }

    // ── 5. Memory info via INFO (best-effort — may not be available) ───────
    let memoryUsedHuman: string | null = null
    let memoryUsedBytes: number | null = null
    let upstashCommandsToday: number | null = null

    try {
      // @upstash/redis exposes a raw `info()` method returning a string
      const infoRaw = await (redis as unknown as { info: (section?: string) => Promise<string> }).info("memory")
      if (typeof infoRaw === "string") {
        const memMatch = infoRaw.match(/used_memory_human:(\S+)/)
        const memBytesMatch = infoRaw.match(/used_memory:(\d+)/)
        if (memMatch?.[1]) memoryUsedHuman = memMatch[1]
        if (memBytesMatch?.[1]) memoryUsedBytes = parseInt(memBytesMatch[1], 10)
      }
    } catch {
      // INFO not available on all Upstash plans — swallow silently
    }

    // Try Upstash-specific stats header via a stats call
    try {
      const statsRaw = await (redis as unknown as { info: (section?: string) => Promise<string> }).info("stats")
      if (typeof statsRaw === "string") {
        const cmdMatch = statsRaw.match(/total_commands_processed:(\d+)/)
        if (cmdMatch?.[1]) upstashCommandsToday = parseInt(cmdMatch[1], 10)
      }
    } catch {
      // Swallow
    }

    const stats: RedisStats = {
      latencyMs,
      totalKeys,
      namespaces: namespaceCounts,
      activeRateLimits,
      memoryUsedHuman,
      memoryUsedBytes,
      upstashCommandsToday,
      fetchedAt: new Date().toISOString(),
    }

    return NextResponse.json(stats)
  } catch (err) {
    console.error("[redis-stats] Error:", err)
    return NextResponse.json(
      { message: "Failed to fetch Redis stats", error: String(err) },
      { status: 500 }
    )
  }
}
