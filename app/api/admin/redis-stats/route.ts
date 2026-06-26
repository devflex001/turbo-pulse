/**
 * GET /api/admin/redis-stats
 *
 * Efficient stats endpoint using direct REST API calls to Upstash:
 *  - INFO stats (commands, ops/sec, expired/evicted keys)
 *  - DBSIZE (total keys)
 *  - Namespace scanning for key distribution
 *  - Rate-limit bucket enumeration
 *
 * Note: Free tier Upstash doesn't expose memory or hit rates.
 * Those features require the paid "Monitor" add-on.
 */

import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { APP_PREFIX } from "@/lib/cache-keys"

// ---------------------------------------------------------------------------
// Exported types (consumed by the panel component)
// ---------------------------------------------------------------------------

export interface NamespaceStat {
  namespace: string
  label: string
  count: number
}

export interface RateLimitBucket {
  key: string
  hits: number
  ttl: number
}

export interface RedisStats {
  latencyMs: number
  totalKeys: number
  // Throughput (from INFO stats — free tier)
  totalCommandsProcessed: number
  opsPerSec: number
  maxOpsPerSec: number
  // Cache efficiency (from INFO stats — free tier)
  expiredKeys: number
  evictedKeys: number
  // Per-namespace
  namespaces: NamespaceStat[]
  // Rate limiters
  activeRateLimits: RateLimitBucket[]
  fetchedAt: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseInfo(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue
    const colon = line.indexOf(":")
    if (colon === -1) continue
    out[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
  }
  return out
}

function int(v: string | undefined, fallback = 0): number {
  const n = parseInt(v ?? "", 10)
  return isNaN(n) ? fallback : n
}

async function scanCount(pattern: string): Promise<number> {
  let cursor = 0
  let count = 0
  do {
    const [next, keys] = await redis.scan(cursor, { match: pattern, count: 100 })
    cursor = Number(next)
    count += keys.length
  } while (cursor !== 0)
  return count
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!restUrl || !restToken) {
    return NextResponse.json({ message: "Redis not configured" }, { status: 500 })
  }

  try {
    const pingStart = Date.now()

    // Fetch INFO stats + DBSIZE in parallel
    const [infoStatsRes, dbsizeRes, namespaceCounts] = await Promise.all([
      // INFO stats — contains commands, ops/sec, expired/evicted keys
      fetch(`${restUrl}/info/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${restToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }),

      // DBSIZE — total key count
      fetch(`${restUrl}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${restToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["DBSIZE"]),
        cache: "no-store",
      }),

      // Namespace SCAN passes — run in parallel
      Promise.all([
        { namespace: "matches", label: "Match cache", pattern: `${APP_PREFIX}:matches:*` },
        { namespace: "competitions", label: "Competition cache", pattern: `${APP_PREFIX}:competitions:*` },
        { namespace: "admin", label: "Admin stats", pattern: `${APP_PREFIX}:admin:*` },
        { namespace: "mpesa", label: "M-Pesa (idempotency/status)", pattern: `${APP_PREFIX}:mpesa:*` },
        { namespace: "paystack", label: "Paystack idempotency", pattern: `${APP_PREFIX}:paystack:*` },
        { namespace: "rl", label: "Rate-limit buckets", pattern: `${APP_PREFIX}:rl:*` },
        { namespace: "lock", label: "Stampede locks", pattern: `${APP_PREFIX}:lock:*` },
      ].map(async (p) => ({
        namespace: p.namespace,
        label: p.label,
        count: await scanCount(p.pattern),
      }))),
    ])

    const latencyMs = Date.now() - pingStart

    // Parse INFO stats
    let totalCommandsProcessed = 0
    let opsPerSec = 0
    let maxOpsPerSec = 0
    let expiredKeys = 0
    let evictedKeys = 0

    if (infoStatsRes.ok) {
      const infoStatsData = await infoStatsRes.json() as { result?: string }
      const statsInfo = parseInfo(infoStatsData.result ?? "")
      totalCommandsProcessed = int(statsInfo.total_commands_processed)
      opsPerSec = int(statsInfo.instantaneous_ops_per_sec)
      maxOpsPerSec = int(statsInfo.max_ops_per_sec)
      expiredKeys = int(statsInfo.expired_keys)
      evictedKeys = int(statsInfo.evicted_keys)
    }

    // Parse DBSIZE
    let totalKeys = 0
    if (dbsizeRes.ok) {
      const dbsizeData = await dbsizeRes.json() as { result?: number }
      totalKeys = dbsizeData.result ?? 0
    }

    // Rate-limit bucket details
    const rlKeys: string[] = []
    let rlCursor = 0
    do {
      const [nextCursor, keys] = await redis.scan(rlCursor, { match: `${APP_PREFIX}:rl:*`, count: 50 })
      rlCursor = Number(nextCursor)
      rlKeys.push(...keys)
    } while (rlCursor !== 0)

    const activeRateLimits: RateLimitBucket[] = []
    if (rlKeys.length > 0) {
      const rlPipeline = redis.pipeline()
      for (const key of rlKeys) {
        rlPipeline.zcard(key)
        rlPipeline.ttl(key)
      }
      const rlResults = await rlPipeline.exec()
      for (let i = 0; i < rlKeys.length; i++) {
        const hits = (rlResults[i * 2] as number) ?? 0
        const ttl = (rlResults[i * 2 + 1] as number) ?? -1
        if (hits > 0) activeRateLimits.push({ key: rlKeys[i], hits, ttl })
      }
      activeRateLimits.sort((a, b) => b.hits - a.hits)
    }

    // Assemble response
    const stats: RedisStats = {
      latencyMs,
      totalKeys,
      totalCommandsProcessed,
      opsPerSec,
      maxOpsPerSec,
      expiredKeys,
      evictedKeys,
      namespaces: namespaceCounts,
      activeRateLimits,
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
