/**
 * Centralized, typed cache key factory
 *
 * All Redis keys live here. Using a single module prevents typos,
 * makes key collisions impossible, and gives you one place to audit
 * every cached resource and its TTL contract.
 *
 * Naming convention:  betflexx:<namespace>:<discriminator>
 */

export const APP_PREFIX = "betflexx"

// ---------------------------------------------------------------------------
// TTLs (seconds) — adjust per data volatility
// ---------------------------------------------------------------------------
export const TTL = {
  /** Sports matches list — refreshed by scraper, safe to cache 60 s */
  MATCHES_LIST: 60,
  /** Full match detail with main odds */
  MATCH_DETAIL: 30,
  /** All markets for a match */
  MATCH_MARKETS: 45,
  /** Odds for a specific market */
  MATCH_ODDS: 20,
  /** Competition / league names */
  COMPETITIONS: 120,
  /** Admin stats aggregate */
  ADMIN_STATS: 30,
  /** Payment idempotency window — prevents duplicate STK pushes */
  PAYMENT_IDEMPOTENCY: 300,
  /** M-Pesa transaction status poll cache */
  MPESA_STATUS: 10,
  /** Rate-limit sliding window */
  RATE_LIMIT_WINDOW: 60,
  /** Cache stampede lock TTL */
  LOCK: 10,
} as const

// ---------------------------------------------------------------------------
// Key factories
// ---------------------------------------------------------------------------
export const CacheKeys = {
  // -- Sports data (shared / public) ----------------------------------------
  matchesList: (params: {
    sport?: string
    competition?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
    includeFirstMarket?: boolean
  }) => {
    const sorted = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join("|")
    return `${APP_PREFIX}:matches:list:${sorted}`
  },

  matchDetail: (sourceMatchId: string) =>
    `${APP_PREFIX}:matches:detail:${sourceMatchId}`,

  matchMainOdds: (sourceMatchId: string) =>
    `${APP_PREFIX}:matches:main-odds:${sourceMatchId}`,

  matchWithMainOdds: (sourceMatchId: string) =>
    `${APP_PREFIX}:matches:with-main-odds:${sourceMatchId}`,

  matchMarkets: (sourceMatchId: string) =>
    `${APP_PREFIX}:matches:markets:${sourceMatchId}`,

  matchMarketsCount: (sourceMatchId: string) =>
    `${APP_PREFIX}:matches:markets-count:${sourceMatchId}`,

  matchOdds: (sourceMatchId: string, marketKey: string) =>
    `${APP_PREFIX}:matches:odds:${sourceMatchId}:${marketKey}`,

  competitions: (sport?: string) =>
    `${APP_PREFIX}:competitions:${sport ?? "all"}`,

  // -- Admin ----------------------------------------------------------------
  adminStats: () => `${APP_PREFIX}:admin:stats`,

  // -- Payments — idempotency keys -----------------------------------------
  /** Prevents a duplicate STK push being sent for the same phone+amount in window */
  mpesaIdempotency: (phone: string, amount: number) =>
    `${APP_PREFIX}:mpesa:idempotency:${phone}:${amount}`,

  /** Caches M-Pesa transaction query result to avoid hammering Safaricom */
  mpesaStatus: (checkoutRequestID: string) =>
    `${APP_PREFIX}:mpesa:status:${checkoutRequestID}`,

  /** Prevents duplicate Paystack initialization for the same phone+amount */
  paystackIdempotency: (phone: string, amount: number) =>
    `${APP_PREFIX}:paystack:idempotency:${phone}:${amount}`,

  // -- Rate limiting --------------------------------------------------------
  rateLimit: (namespace: string, identifier: string) =>
    `${APP_PREFIX}:rl:${namespace}:${identifier}`,

  // -- Cache stampede locks -------------------------------------------------
  lock: (key: string) => `${APP_PREFIX}:lock:${key}`,
} as const

// ---------------------------------------------------------------------------
// Pattern helpers — used for bulk invalidation (SCAN-based)
// ---------------------------------------------------------------------------
export const CachePatterns = {
  allMatches: () => `${APP_PREFIX}:matches:*`,
  matchById: (sourceMatchId: string) =>
    `${APP_PREFIX}:matches:*:${sourceMatchId}*`,
  allCompetitions: () => `${APP_PREFIX}:competitions:*`,
  adminStats: () => `${APP_PREFIX}:admin:stats`,
} as const
