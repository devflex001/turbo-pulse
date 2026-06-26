/**
 * Enterprise cache layer
 *
 * Wraps @upstash/redis with:
 *  - Generic get / set / del with automatic JSON serialization
 *  - getOrSet  — cache-aside with stampede protection via a Redis lock
 *  - invalidatePattern — SCAN-based bulk eviction (safe on large keyspaces)
 *  - invalidateKeys — targeted multi-key eviction
 *  - Structured logging so you can grep cache hits/misses in production logs
 *
 * All methods are safe to call from Next.js API routes, Server Actions,
 * and Edge middleware.
 */

import { redis } from "./redis"
import { CacheKeys, TTL } from "./cache-keys"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CacheOptions = {
  /** TTL in seconds. Omit to store without expiry (not recommended). */
  ttl?: number
  /** Tag attached to log lines for traceability */
  tag?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Serializable = any

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function log(level: "hit" | "miss" | "set" | "del" | "lock" | "error", key: string, extra?: string) {
  const msg = `[Cache:${level.toUpperCase()}] ${key}${extra ? " — " + extra : ""}`
  if (level === "error") {
    console.error(msg)
  } else if (process.env.NODE_ENV !== "production") {
    // Only verbose logs in dev; in prod these are too noisy
    console.debug(msg)
  }
}

// ---------------------------------------------------------------------------
// Core primitives
// ---------------------------------------------------------------------------

/**
 * Read a value from the cache.
 * Returns `null` if missing or on Redis error (fail-open behaviour).
 */
export async function cacheGet<T extends Serializable>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get<T>(key)
    if (raw === null || raw === undefined) {
      log("miss", key)
      return null
    }
    log("hit", key)
    return raw as T
  } catch (err) {
    log("error", key, String(err))
    return null // fail open — never block the request
  }
}

/**
 * Write a value to the cache with an optional TTL.
 */
export async function cacheSet<T extends Serializable>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    if (options.ttl !== undefined) {
      await redis.set(key, value, { ex: options.ttl })
    } else {
      await redis.set(key, value)
    }
    log("set", key, options.ttl ? `ttl=${options.ttl}s` : "no-ttl")
  } catch (err) {
    log("error", key, String(err))
  }
}

/**
 * Delete one or more keys from the cache.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    await redis.del(...keys)
    keys.forEach((k) => log("del", k))
  } catch (err) {
    log("error", keys.join(", "), String(err))
  }
}

// ---------------------------------------------------------------------------
// Cache-aside with stampede protection
// ---------------------------------------------------------------------------

/**
 * Classic cache-aside pattern with a Redis NX lock to prevent the
 * "thundering herd" / "cache stampede" problem.
 *
 * Flow:
 *  1. Check cache → return if hit
 *  2. Try to acquire a short-lived NX lock
 *  3. If lock acquired → run fetcher, populate cache, release lock
 *  4. If lock NOT acquired → wait briefly and retry from cache
 *     (another instance is already filling it)
 *
 * @param key       - Redis cache key
 * @param fetcher   - Async function that produces the canonical value
 * @param options   - TTL and optional tag
 */
export async function getOrSet<T extends Serializable>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // 1. Check cache first
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  // 2. Try to acquire stampede lock
  const lockKey = CacheKeys.lock(key)
  const lockAcquired = await redis
    .set(lockKey, "1", { nx: true, ex: TTL.LOCK })
    .catch(() => null)

  if (!lockAcquired) {
    // Another process is filling this key — wait and read from cache
    await sleep(150)
    const retried = await cacheGet<T>(key)
    if (retried !== null) return retried
    // If still nothing (race edge case), fall through to fetcher
  }

  // 3. Populate cache
  try {
    const value = await fetcher()
    await cacheSet(key, value, options)
    return value
  } finally {
    // Always release lock, even on fetcher error
    if (lockAcquired) {
      await redis.del(lockKey).catch(() => null)
      log("lock", lockKey, "released")
    }
  }
}

// ---------------------------------------------------------------------------
// Bulk invalidation
// ---------------------------------------------------------------------------

/**
 * Invalidate all keys matching a glob pattern using SCAN.
 * Uses cursor-based iteration so it's safe on large keyspaces and won't
 * block the Redis server (unlike KEYS).
 *
 * @param pattern - Glob pattern, e.g. "betflexx:matches:*"
 */
export async function invalidatePattern(pattern: string): Promise<number> {
  let cursor = 0
  let deleted = 0

  try {
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      })
      cursor = Number(nextCursor)

      if (keys.length > 0) {
        await redis.del(...keys)
        deleted += keys.length
        log("del", pattern, `batch ${keys.length} keys`)
      }
    } while (cursor !== 0)
  } catch (err) {
    log("error", pattern, String(err))
  }

  return deleted
}

/**
 * Delete an explicit list of keys in a single round-trip.
 */
export async function invalidateKeys(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  await cacheDel(...keys)
}

// ---------------------------------------------------------------------------
// Convenience wrappers used by API routes
// ---------------------------------------------------------------------------

/**
 * Store a payment idempotency record.
 * Returns `true` if the key was freshly created (first call).
 * Returns `false` if a record already exists (duplicate call).
 */
export async function setIdempotencyKey(
  key: string,
  payload: Serializable,
  ttlSeconds: number
): Promise<boolean> {
  try {
    // NX = only set if not exists
    const result = await redis.set(key, payload, { nx: true, ex: ttlSeconds })
    return result === "OK"
  } catch (err) {
    log("error", key, String(err))
    // Fail open — allow the request through
    return true
  }
}

/**
 * Retrieve an idempotency record.
 */
export async function getIdempotencyKey<T extends Serializable>(key: string): Promise<T | null> {
  return cacheGet<T>(key)
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Ping Redis to verify connectivity. Useful in health-check endpoints.
 */
export async function pingRedis(): Promise<boolean> {
  try {
    const result = await redis.ping()
    return result === "PONG"
  } catch {
    return false
  }
}
