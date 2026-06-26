/**
 * GET /api/admin/redis-stats
 *
 * Real-time stats endpoint using direct REST API calls to Upstash:
 *  - INFO stats (commands, ops/sec, expired/evicted keys)
 *  - DBSIZE (total key count)
 *  - Direct ZCARD + TTL queries for namespaces (no SCAN — free tier limitation)
 *  - Real-time rate-limit bucket tracking via direct queries
 *
 * Note: Upstash free tier doesn't support SCAN. We query known key patterns directly.
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

/**
 * For a given namespace pattern (e.g., "betflexx:matches:*"), query Redis for all keys
 * matching that pattern using the Upstash REST API directly.
 * 
 * Since SCAN is not reliable on Upstash free tier, we enumerate keys by:
 * 1. Using KEYS command (available on all tiers, though not recommended for large DBs)
 * 2. Counting matching keys with ZCARD for sorted sets (like rate-limit buckets)
 */
async function getNamespaceKeyCount(namespace: string): Promise<number> {
  try {
    // Use redis.keys() which internally calls KEYS command
    const keys = await redis.keys(`${APP_PREFIX}:${namespace}:*`)
    return keys.length
  } catch {
    // Fallback to 0 if the query fails
    return 0
  }
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

    // Fetch INFO stats + DBSIZE + namespace counts in parallel
    const [infoStatsRes, dbsizeRes, namespaceCounts, rlKeys] = await Promise.all([
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

      // Namespace key counts — use KEYS command for direct enumeration
      Promise.all([
        { namespace: "matches", label: "Match cache" },
        { namespace: "competitions", label: "Competition cache" },
        { namespace: "admin", label: "Admin stats" },
        { namespace: "mpesa", label: "M-Pesa (idempotency/status)" },
        { namespace: "paystack", label: "Paystack idempotency" },
        { namespace: "rl", label: "Rate-limit buckets" },
        { namespace: "lock", label: "Stampede locks" },
      ].map(async (p) => ({
        namespace: p.namespace,
        label: p.label,
        count: await getNamespaceKeyCount(p.namespace),
      }))),

      // Get all rate-limit bucket keys
      redis.keys(`${APP_PREFIX}:rl:*`),
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

    // Get rate-limit bucket details
    const activeRateLimits: RateLimitBucket[] = []
    if (rlKeys && rlKeys.length > 0) {
      // Query each rate-limit key's cardinality and TTL in batches
      const batchSize = 10
      for (let i = 0; i < rlKeys.length; i += batchSize) {
        const batch = rlKeys.slice(i, i + batchSize)
        const rlPipeline = redis.pipeline()
        for (const key of batch) {
          rlPipeline.zcard(key)
          rlPipeline.ttl(key)
        }
        const rlResults = await rlPipeline.exec()
        for (let j = 0; j < batch.length; j++) {
          const hits = (rlResults[j * 2] as number) ?? 0
          const ttl = (rlResults[j * 2 + 1] as number) ?? -1
          if (hits > 0) activeRateLimits.push({ key: batch[j], hits, ttl })
        }
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
