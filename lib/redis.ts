/**
 * Upstash Redis client singleton
 *
 * Uses the REST-based @upstash/redis client which is compatible with
 * Node.js, Edge Runtime, and serverless environments. The singleton
 * pattern ensures a single connection pool is reused across hot-reloads
 * in development and across requests in production.
 */

import { Redis } from "@upstash/redis"

// Validate required env vars at module load time so failures are loud and
// immediate rather than surfacing as mysterious runtime errors later.
function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error(
      "[Redis] Missing required environment variables: " +
        (!url ? "UPSTASH_REDIS_REST_URL " : "") +
        (!token ? "UPSTASH_REDIS_REST_TOKEN" : "")
    )
  }

  return new Redis({
    url,
    token,
    // Retry up to 3 times with exponential back-off before surfacing an error.
    // This absorbs transient network blips without hammering the upstream.
    retry: {
      retries: 3,
      backoff: (attempt) => Math.min(50 * Math.pow(2, attempt), 2000),
    },
  })
}

// Global singleton — survives Next.js hot-reloads in development.
const globalForRedis = globalThis as unknown as { _redisClient?: Redis }

export const redis: Redis =
  globalForRedis._redisClient ?? createRedisClient()

if (process.env.NODE_ENV !== "production") {
  globalForRedis._redisClient = redis
}

export default redis
