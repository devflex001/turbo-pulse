"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Redis } from "@upstash/redis";

// Initialize Redis with error handling
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Cache configuration
export const CACHE_CONFIG = {
  PUBLISHED_EVENTS: 300, // 5 minutes
  SPORT_COUNTS: 300, // 5 minutes
  SPORTS_MATCHES: 180, // 3 minutes
  DEFAULT: 600, // 10 minutes
} as const;

// Cache key generators
export function getCacheKey(type: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}:${JSON.stringify(params[k])}`)
    .join("|");
  return `cache:${type}:${sortedParams}`;
}

// Get from cache action
export const getFromCacheAction = action({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args): Promise<unknown> => {
    try {
      const cached = await redis.get(args.key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  },
});

// Set in cache action
export const setInCacheAction = action({
  args: {
    key: v.string(),
    value: v.any(),
    ttl: v.number(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    try {
      await redis.setex(args.key, args.ttl, JSON.stringify(args.value));
      return { success: true };
    } catch (error) {
      console.error("Redis set error:", error);
      return { success: false, error: String(error) };
    }
  },
});

// Invalidate cache pattern action
export const invalidateCachePatternAction = action({
  args: {
    pattern: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; invalidatedCount: number; error?: string }> => {
    try {
      const keys = await redis.keys(`cache:${args.pattern}:*`);
      if (keys.length > 0) {
        await redis.del(...(keys as string[]));
      }
      return { success: true, invalidatedCount: keys.length };
    } catch (error) {
      console.error("Redis invalidate error:", error);
      return { success: false, invalidatedCount: 0, error: String(error) };
    }
  },
});

// Cache health check
export const cacheHealthCheck = action({
  args: {},
  handler: async (ctx): Promise<{ status: "healthy" | "unhealthy"; error?: string }> => {
    try {
      await redis.ping();
      return { status: "healthy" };
    } catch (error) {
      console.error("Redis health check failed:", error);
      return { status: "unhealthy", error: String(error) };
    }
  },
});
