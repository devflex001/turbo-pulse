/**
 * Centralised environment variable registry
 *
 * All process.env reads go through this module so that:
 *  - Missing variables fail fast at startup rather than at runtime
 *  - TypeScript can narrow the types (string vs string | undefined)
 *  - There is a single place to audit what the app requires
 */

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`[env] Missing required environment variable: ${key}`)
  }
  return value
}

function optional(key: string): string | undefined {
  return process.env[key]
}

export const env = {
  // ── App ──────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: optional("NEXT_PUBLIC_APP_URL"),
  JWT_PRIVATE_KEY: optional("JWT_PRIVATE_KEY"),
  ADMIN_EMAIL: optional("ADMIN_EMAIL"),
  ADMIN_PASSWORD: optional("ADMIN_PASSWORD"),

  // ── Convex ───────────────────────────────────────────────────────────────
  NEXT_PUBLIC_CONVEX_URL: optional("NEXT_PUBLIC_CONVEX_URL"),

  // ── Upstash Redis ────────────────────────────────────────────────────────
  /** REST URL for the Upstash Redis instance */
  UPSTASH_REDIS_REST_URL: optional("UPSTASH_REDIS_REST_URL"),
  /** Bearer token for the Upstash Redis REST API */
  UPSTASH_REDIS_REST_TOKEN: optional("UPSTASH_REDIS_REST_TOKEN"),

  // ── Cache ────────────────────────────────────────────────────────────────
  /**
   * Shared secret that must be present on POST /api/cache/invalidate.
   * Set to a strong random value in production.
   */
  CACHE_INVALIDATION_SECRET: optional("CACHE_INVALIDATION_SECRET"),

  // ── Payment providers ────────────────────────────────────────────────────
  PAYSTACK_SECRET_KEY: optional("PAYSTACK_SECRET_KEY"),
  PAYSTACK_PUBLIC_KEY: optional("PAYSTACK_PUBLIC_KEY"),
  MPESA_CONSUMER_KEY: optional("MPESA_CONSUMER_KEY"),
  MPESA_CONSUMER_SECRET: optional("MPESA_CONSUMER_SECRET"),
  MPESA_PASSKEY: optional("MPESA_PASSKEY"),
  MPESA_BUSINESS_SHORT_CODE: optional("MPESA_BUSINESS_SHORT_CODE"),
  MPESA_CALLBACK_URL: optional("MPESA_CALLBACK_URL"),
} as const

/**
 * Validate that all Redis env vars are present.
 * Call this in health-check endpoints or server startup logic.
 */
export function validateRedisEnv(): void {
  required("UPSTASH_REDIS_REST_URL")
  required("UPSTASH_REDIS_REST_TOKEN")
}

/**
 * Returns true if Redis is configured (both vars are set).
 * Use this to conditionally enable caching rather than crashing.
 */
export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
}
