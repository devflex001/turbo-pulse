/**
 * Cache invalidation helpers
 *
 * These functions are called after Convex mutations complete so cached
 * data never serves stale reads longer than necessary.
 *
 * Design decisions:
 *  - Errors are caught and logged — a failed invalidation should NEVER
 *    cause a mutation to fail. Eventual consistency is acceptable here.
 *  - Invalidation is best-effort and async. Convex mutations are the
 *    source of truth; Redis is just a read-ahead cache.
 *  - Functions are granular so callers only evict what changed.
 */

import { invalidatePattern, invalidateKeys, cacheDel } from "./cache"
import { CacheKeys, CachePatterns } from "./cache-keys"

// ---------------------------------------------------------------------------
// Sports data invalidation
// ---------------------------------------------------------------------------

/**
 * Invalidate all cached match lists and competition lists.
 * Call this after the scraper upserts new matches/odds.
 */
export async function invalidateSportsData(): Promise<void> {
  try {
    await Promise.all([
      invalidatePattern(CachePatterns.allMatches()),
      invalidatePattern(CachePatterns.allCompetitions()),
    ])
    console.info("[CacheInvalidation] Sports data cleared")
  } catch (err) {
    console.error("[CacheInvalidation] Failed to clear sports data:", err)
  }
}

/**
 * Invalidate all cached data for a specific match.
 * Call this when a single match's odds or status changes.
 */
export async function invalidateMatch(sourceMatchId: string): Promise<void> {
  try {
    await invalidateKeys([
      CacheKeys.matchDetail(sourceMatchId),
      CacheKeys.matchMainOdds(sourceMatchId),
      CacheKeys.matchWithMainOdds(sourceMatchId),
      CacheKeys.matchMarkets(sourceMatchId),
      CacheKeys.matchMarketsCount(sourceMatchId),
    ])
    // Also clear any list caches that may include this match
    await invalidatePattern(CachePatterns.allMatches())
    console.info(`[CacheInvalidation] Match ${sourceMatchId} cleared`)
  } catch (err) {
    console.error(`[CacheInvalidation] Failed to clear match ${sourceMatchId}:`, err)
  }
}

/**
 * Invalidate odds for a specific market within a match.
 */
export async function invalidateMatchOdds(
  sourceMatchId: string,
  marketKey: string
): Promise<void> {
  try {
    await invalidateKeys([
      CacheKeys.matchOdds(sourceMatchId, marketKey),
      CacheKeys.matchMainOdds(sourceMatchId),
      CacheKeys.matchWithMainOdds(sourceMatchId),
    ])
    console.info(`[CacheInvalidation] Odds cleared for ${sourceMatchId}:${marketKey}`)
  } catch (err) {
    console.error("[CacheInvalidation] Failed to clear odds:", err)
  }
}

// ---------------------------------------------------------------------------
// Admin stats invalidation
// ---------------------------------------------------------------------------

/**
 * Invalidate admin stats cache.
 * Call this after any bet is placed, settled, or a deposit completes.
 */
export async function invalidateAdminStats(): Promise<void> {
  try {
    await cacheDel(CacheKeys.adminStats())
    console.info("[CacheInvalidation] Admin stats cleared")
  } catch (err) {
    console.error("[CacheInvalidation] Failed to clear admin stats:", err)
  }
}

// ---------------------------------------------------------------------------
// Payment idempotency helpers
// ---------------------------------------------------------------------------

/**
 * Manually expire an M-Pesa idempotency key (e.g. after a confirmed failure
 * that the user should be allowed to retry immediately).
 */
export async function clearMpesaIdempotency(
  phone: string,
  amount: number
): Promise<void> {
  try {
    await cacheDel(CacheKeys.mpesaIdempotency(phone, amount))
    console.info(`[CacheInvalidation] M-Pesa idempotency cleared for ${phone}`)
  } catch (err) {
    console.error("[CacheInvalidation] Failed to clear M-Pesa idempotency:", err)
  }
}

/**
 * Manually expire a Paystack idempotency key.
 */
export async function clearPaystackIdempotency(
  phone: string,
  amount: number
): Promise<void> {
  try {
    await cacheDel(CacheKeys.paystackIdempotency(phone, amount))
    console.info(`[CacheInvalidation] Paystack idempotency cleared for ${phone}`)
  } catch (err) {
    console.error("[CacheInvalidation] Failed to clear Paystack idempotency:", err)
  }
}

/**
 * Clear a cached M-Pesa transaction status so the next poll hits Safaricom.
 * Call this after the Convex mutation has processed the callback.
 */
export async function clearMpesaStatus(checkoutRequestID: string): Promise<void> {
  try {
    await cacheDel(CacheKeys.mpesaStatus(checkoutRequestID))
    console.info(`[CacheInvalidation] M-Pesa status cleared for ${checkoutRequestID}`)
  } catch (err) {
    console.error("[CacheInvalidation] Failed to clear M-Pesa status:", err)
  }
}

// ---------------------------------------------------------------------------
// Nuclear option — clear all betflexx keys
// ---------------------------------------------------------------------------

/**
 * Wipe every key under the betflexx: prefix.
 * Only use this from admin tooling or during deployments.
 */
export async function invalidateAll(): Promise<number> {
  const count = await invalidatePattern("betflexx:*")
  console.warn(`[CacheInvalidation] Full cache wipe: ${count} keys deleted`)
  return count
}
