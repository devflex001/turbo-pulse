import { api } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { CACHE_CONFIG, getCacheKey } from "./cache";

/**
 * Production-grade cache helper
 * Handles errors gracefully and falls back to direct queries if Redis fails
 */

export async function cacheOrFetch<T>(
  ctx: ActionCtx,
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    // Try to get from cache
    const cached = await ctx.runAction(api.cache.getFromCacheAction, { key });
    if (cached) {
      console.log(`[CACHE HIT] ${key}`);
      return cached as T;
    }
  } catch (error) {
    console.error(`[CACHE GET ERROR] ${key}:`, error);
    // Fall through to fetch
  }

  // Fetch fresh data
  console.log(`[CACHE MISS] ${key} - fetching fresh data`);
  const data = await fetchFn();

  // Try to cache it
  try {
    const result = await ctx.runAction(api.cache.setInCacheAction as any, {
      key,
      value: data,
      ttl,
    });
  } catch (error) {
    console.error(`[CACHE SET ERROR] ${key}:`, error);
    // Return data anyway - cache is optional
  }

  return data;
}

/**
 * Invalidate cache patterns safely
 */
export async function invalidateCacheSafely(
  ctx: ActionCtx,
  pattern: string
): Promise<void> {
  try {
    await ctx.runAction(api.cache.invalidateCachePatternAction as any, { pattern });
    console.log(`[CACHE INVALIDATED] ${pattern}`);
  } catch (error) {
    console.error(`[CACHE INVALIDATION ERROR] ${pattern}:`, error);
    // Not critical - continue anyway
  }
}

/**
 * Cache configuration based on data type
 */
export const getCacheTTL = (dataType: string): number => {
  const ttlMap: Record<string, number> = {
    "published_events": CACHE_CONFIG.PUBLISHED_EVENTS,
    "sport_counts": CACHE_CONFIG.SPORT_COUNTS,
    "sports_matches": CACHE_CONFIG.SPORTS_MATCHES,
  };
  return ttlMap[dataType] || CACHE_CONFIG.DEFAULT;
};

/**
 * Generate optimized cache keys
 */
export const generateCacheKeys = {
  publishedEvents: (limit?: number, offset?: number) =>
    getCacheKey("publishedEvents", { limit, offset }),
  sportCounts: () => getCacheKey("sportCounts", {}),
  sportsMatches: (sport?: string, status?: string) =>
    getCacheKey("sportsMatches", { sport, status }),
  customEvent: (eventId: string) =>
    getCacheKey("customEvent", { eventId }),
};
