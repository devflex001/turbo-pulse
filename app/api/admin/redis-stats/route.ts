/**
 * GET /api/admin/redis-stats
 *
 * Single-pass Redis stats using:
 *  - One native fetch() call to the Upstash REST pipeline for INFO memory/stats/keyspace + DBSIZE
 *    (@upstash/redis has no .info() method — raw REST pipeline is the only way)
 *  - Parallel SCAN passes for per-namespace key counts
 *  - One pipelined batch for rate-limit bucket cardinalities
 *
 * Total Redis round-trips: 3 (INFO batch, SCAN passes, RL pipeline)
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
  // Memory
  memoryUsedHuman: string
  memoryUsedBytes: number
  maxMemoryHuman: string
  maxMemoryBytes: number
  memoryUsedPct: number
  // Throughput
  totalCommandsProcessed: number
  opsPerSec: number
  maxOpsPerSec: number
  // Cache efficiency
  keyspaceHits: number
  keyspaceMisses: number
  hitRate: number
  expiredKeys: number
  evictedKeys: number
  // Keyspace
  dbKeys: number
  dbExpires: number
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
    // ── 1. INFO sections + DBSIZE — single native fetch to REST pipeline ───
    // @upstash/redis has no .info() method; the REST /pipeline endpoint is the
    // only available path and it works on all Upstash plans.
    const pingStart = Date.now()

    const [infoBatch, namespaceCounts] = await Promise.all([
      // INFO batch
      fetch(`${restUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${restToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INFO", "memory"],
          ["INFO", "stats"],
          ["INFO", "keyspace"],
          ["DBSIZE"],
        ]),
        cache: "no-store",
      }).then((r) => r.json()) as Promise<{ value: Array<{ result: string | number }> }>,

      // Namespace SCAN passes — run in parallel with the INFO fetch
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

    // Parse INFO results
    const results = infoBatch.value ?? []
    const mem = parseInfo((results[0]?.result as string) ?? "")
    const st = parseInfo((results[1]?.result as string) ?? "")
    const ks = parseInfo((results[2]?.result as string) ?? "")
    const totalKeys = (results[3]?.result as number) ?? 0

    // Memory
    const memoryUsedBytes = int(mem.used_memory)
    const memoryUsedHuman = mem.used_memory_human ?? "0B"
    const maxMemoryBytes = int(mem.maxmemory)
    const maxMemoryHuman = mem.maxmemory_human ?? "0B"
    const memoryUsedPct = maxMemoryBytes > 0
      ? Math.round((memoryUsedBytes / maxMemoryBytes) * 100)
      : 0

    // Stats
    const totalCommandsProcessed = int(st.total_commands_processed)
    const opsPerSec = int(st.instantaneous_ops_per_sec)
    const maxOpsPerSec = int(st.max_ops_per_sec)
    const keyspaceHits = int(st.keyspace_hits)
    const keyspaceMisses = int(st.keyspace_misses)
    const hitRate = keyspaceHits + keyspaceMisses > 0
      ? Math.round((keyspaceHits / (keyspaceHits + keyspaceMisses)) * 100)
      : 0
    const expiredKeys = int(st.expired_keys)
    const evictedKeys = int(st.evicted_keys)

    // Keyspace  db0:keys=N,expires=N,...
    const db0 = ks.db0 ?? ""
    const dbKeys = int(db0.match(/keys=(\d+)/)?.[1])
    const dbExpires = int(db0.match(/expires=(\d+)/)?.[1])

    // ── 2. Rate-limit bucket details ────────────────────────────────────────
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

    // ── 3. Assemble ─────────────────────────────────────────────────────────
    const stats: RedisStats = {
      latencyMs,
      totalKeys,
      memoryUsedHuman,
      memoryUsedBytes,
      maxMemoryHuman,
      maxMemoryBytes,
      memoryUsedPct,
      totalCommandsProcessed,
      opsPerSec,
      maxOpsPerSec,
      keyspaceHits,
      keyspaceMisses,
      hitRate,
      expiredKeys,
      evictedKeys,
      dbKeys,
      dbExpires,
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
