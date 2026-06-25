import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  scraperSettings: defineTable({
    source: v.string(),
    enabled: v.boolean(),
    cadenceMinutes: v.number(),
    dateWindowDays: v.number(),
    selectedSports: v.optional(v.array(v.string())),
    matchLimit: v.optional(v.number()), // optional for backward compatibility
    lastRunAt: v.union(v.number(), v.null()),
    nextRunAt: v.number(),
    updatedAt: v.number(),
  }).index("by_source", ["source"]),

  scrapeRuns: defineTable({
    source: v.string(),
    status: v.string(),
    triggeredBy: v.string(),
    startedAt: v.number(),
    finishedAt: v.union(v.number(), v.null()),
    durationMs: v.union(v.number(), v.null()),
    dateFrom: v.string(),
    dateTo: v.string(),
    selectedSports: v.optional(v.array(v.string())), // sports fetched in this run
    matchesDiscovered: v.number(),
    matchesUpserted: v.number(),
    marketsUpserted: v.number(),
    oddsUpserted: v.number(),
    failedMatches: v.number(),
  })
    .index("by_source_and_startedAt", ["source", "startedAt"])
    .index("by_status", ["status"]),

  sportsMatches: defineTable({
    source: v.string(),
    sourceMatchId: v.string(),
    homeTeam: v.string(),
    awayTeam: v.string(),
    startTime: v.number(),
    startTimeIso: v.string(),
    sportId: v.number(),
    sportName: v.string(),
    sportSlug: v.string(),
    competitionId: v.string(),
    competitionName: v.string(),
    competitionPriority: v.number(),
    countryCode: v.string(),
    countryName: v.string(),
    result: v.string(),
    status: v.number(),
    statusDesc: v.string(),
    isLive: v.boolean(),
    producerState: v.number(),
    priority: v.number(),
    totalMarkets: v.number(),
    mainMarketId: v.string(),
    mainMarketName: v.string(),
    mainMarketOutcomes: v.string(),
    hasJenga: v.boolean(),
    lastScrapedAt: v.number(),
  })
    .index("by_source_and_sourceMatchId", ["source", "sourceMatchId"])
    .index("by_source_and_startTime", ["source", "startTime"])
    .index("by_source_and_status_and_startTime", [
      "source",
      "status",
      "startTime",
    ])
    .index("by_source_and_sportSlug_and_startTime", [
      "source",
      "sportSlug",
      "startTime",
    ])
    .index("by_source_and_competitionName_and_startTime", [
      "source",
      "competitionName",
      "startTime",
    ]),

  sportsMarkets: defineTable({
    source: v.string(),
    sourceMatchId: v.string(),
    marketKey: v.string(),
    subTypeId: v.number(),
    name: v.string(),
    marketType: v.string(),
    marketTypes: v.array(v.string()),
    oddsCount: v.number(),
    marketPriority: v.number(),
    hasActiveOdds: v.boolean(),
    lastScrapedAt: v.number(),
  })
    .index("by_sourceMatchId_and_marketPriority", [
      "sourceMatchId",
      "marketPriority",
    ])
    .index("by_sourceMatchId_and_marketKey", ["sourceMatchId", "marketKey"]),

  sportsOdds: defineTable({
    source: v.string(),
    sourceOddId: v.string(),
    sourceMatchId: v.string(),
    marketKey: v.string(),
    subTypeId: v.number(),
    outcomeId: v.string(),
    specifiers: v.string(),
    outcomeName: v.string(),
    outcomeAlias: v.string(),
    marketName: v.string(),
    marketType: v.string(),
    marketPriority: v.number(),
    marketNameTemplate: v.string(),
    marketStatus: v.number(),
    status: v.number(),
    oddValue: v.number(),
    prevOddValue: v.number(),
    outcomeDef: v.string(),
    probabilityValue: v.number(),
    priority: v.number(),
    confirmed: v.number(),
    isPlayer: v.number(),
    sourceCreatedAt: v.union(v.string(), v.null()),
    sourceModifiedAt: v.union(v.string(), v.null()),
    lastScrapedAt: v.number(),
  })
    .index("by_sourceOddId", ["sourceOddId"])
    .index("by_sourceMatchId", ["sourceMatchId"])
    .index("by_sourceMatchId_and_marketKey_and_priority", [
      "sourceMatchId",
      "marketKey",
      "priority",
    ])
    .index("by_sourceMatchId_and_status", ["sourceMatchId", "status"]),

  wallets: defineTable({
    balance: v.number(),
    userId: v.optional(v.id("users")), // Optional for backward compatibility during migration
  })
    .index("by_userId", ["userId"]),

  bets: defineTable({
    userId: v.optional(v.string()), // deprecated - being migrated away
    selections: v.array(
      v.object({
        id: v.string(),
        matchId: v.string(),
        matchName: v.string(),
        team1: v.string(),
        team2: v.string(),
        market: v.string(),
        selection: v.string(),
        selectionName: v.string(),
        odds: v.number(),
        sourceOddId: v.optional(v.string()),
        marketKey: v.optional(v.string()),
        marketName: v.optional(v.string()),
        outcomeName: v.optional(v.string()),
        specifiers: v.optional(v.string()),
        matchStartTime: v.optional(v.number()),
        outcomeId: v.optional(v.string()),
      })
    ),
    totalOdds: v.number(),
    stake: v.number(),
    potentialReturn: v.number(),
    status: v.string(), // "active" | "won" | "lost"
    placedAt: v.number(),
    // Settlement fields
    settledAt: v.optional(v.number()),
    settledEventId: v.optional(v.string()), // custom event ID it was settled on
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  transactions: defineTable({
    txId: v.string(),
    userId: v.optional(v.id("users")),
    type: v.string(), // "deposit" | "withdrawal"
    amount: v.number(),
    phone: v.optional(v.string()),
    status: v.string(), // "success" | "pending" | "failed" | "cancelled"
    errorDetail: v.optional(v.string()),
    time: v.number(),
    // M-Pesa specific fields
    checkoutRequestID: v.optional(v.string()),
    merchantRequestID: v.optional(v.string()),
    resultCode: v.optional(v.string()),
    resultDesc: v.optional(v.string()),
    mpesaReceiptNumber: v.optional(v.string()),
    // Feedback from server (single source of truth)
    feedback: v.optional(v.string()),
    feedbackType: v.optional(v.union(v.literal("success"), v.literal("error"), v.literal("warning"))),
    updatedAt: v.optional(v.number()),
  })
    .index("by_txId", ["txId"])
    .index("by_userId", ["userId"])
    .index("by_checkoutRequestID", ["checkoutRequestID"]),

  notifications: defineTable({
    recipientUserId: v.id("users"),
    recipientRole: v.union(v.literal("user"), v.literal("admin")),
    type: v.union(
      v.literal("payment"),
      v.literal("bet"),
      v.literal("match"),
      v.literal("withdrawal"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    href: v.optional(v.string()),
    readAt: v.union(v.number(), v.null()),
    createdAt: v.number(),
    dedupeKey: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        betId: v.optional(v.id("bets")),
        transactionId: v.optional(v.id("transactions")),
        withdrawalId: v.optional(v.id("withdrawal_requests")),
        sourceMatchId: v.optional(v.string()),
        amount: v.optional(v.number()),
      })
    ),
  })
    .index("by_recipientUserId_and_createdAt", ["recipientUserId", "createdAt"])
    .index("by_recipientUserId_and_readAt", ["recipientUserId", "readAt"])
    .index("by_dedupeKey", ["dedupeKey"]),

  customEvents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    homeTeam: v.string(),
    awayTeam: v.string(),
    homeScore: v.optional(v.number()),
    awayScore: v.optional(v.number()),
    startTime: v.number(),
    startTimeIso: v.string(),
    sport: v.string(),
    competition: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")), // draft or published
    eventStatus: v.optional(v.union(
      v.literal("not_started"),
      v.literal("first_half"),
      v.literal("halftime"),
      v.literal("second_half"),
      v.literal("finished")
    )), // match lifecycle stage
    totalMarkets: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    // Settlement fields
    settledAt: v.optional(v.number()),
    winningMarketId: v.optional(v.id("customMarkets")),
    winningOutcomeId: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_startTime", ["startTime"])
    .index("by_status_and_startTime", ["status", "startTime"])
    .index("by_createdBy", ["createdBy"]),
  customMarkets: defineTable({
    eventId: v.id("customEvents"),
    marketKey: v.string(),
    name: v.string(),
    marketType: v.string(),
    marketTypes: v.array(v.string()),
    description: v.optional(v.string()),
    priority: v.number(),
    isActive: v.boolean(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_eventId_and_priority", ["eventId", "priority"]),

  customOdds: defineTable({
    marketId: v.id("customMarkets"),
    eventId: v.id("customEvents"),
    outcomeId: v.string(),
    outcomeName: v.string(),
    outcomeAlias: v.optional(v.string()),
    specifiers: v.optional(v.string()),
    oddValue: v.number(),
    priority: v.number(),
    isActive: v.boolean(),
  })
    .index("by_marketId", ["marketId"])
    .index("by_eventId", ["eventId"])
    .index("by_marketId_and_priority", ["marketId", "priority"]),

  daraja_config: defineTable({
    consumerKey: v.string(),
    consumerSecret: v.string(),
    businessCode: v.string(),
    passkey: v.string(),
    callbackUrl: v.string(),
    timeoutUrl: v.string(),
    shortcode: v.string(),
    initiatorName: v.string(),
    initiatorPassword: v.string(),
    isProduction: v.boolean(),
    isEnabled: v.boolean(),
    useEnvVariables: v.boolean(), // If true, use env vars instead of DB config
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_isEnabled", ["isEnabled"]),

  paystack_config: defineTable({
    publicKey: v.string(),
    secretKey: v.string(),
    isProduction: v.boolean(),
    isEnabled: v.boolean(),
    useEnvVariables: v.boolean(), // If true, use env vars instead of DB config
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_isEnabled", ["isEnabled"]),

  payment_mode: defineTable({
    mode: v.union(v.literal("mpesa"), v.literal("paystack")), // Active payment method
    isEnabled: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  }),

  users: defineTable({
    phone: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    referralCode: v.optional(v.string()), // unique code for this user to share
    referredBy: v.optional(v.id("users")), // who referred this user
    totalReferrals: v.optional(v.number()), // total successful referrals
    totalReferralEarnings: v.optional(v.number()), // total earnings from referrals
  })
    .index("by_phone", ["phone"])
    .index("by_role", ["role"])
    .index("by_referralCode", ["referralCode"]),

  sessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_sessionToken", ["sessionToken"])
    .index("by_userId", ["userId"])
    .index("by_expiresAt", ["expiresAt"]),

  users_bans: defineTable({
    userId: v.id("users"),
    reason: v.string(),
    bannedAt: v.number(),
    bannedUntil: v.union(v.number(), v.null()), // null = permanent ban
    isActive: v.boolean(),
    bannedBy: v.string(), // admin ID or email who banned the user
  })
    .index("by_userId", ["userId"])
    .index("by_isActive", ["isActive"])
    .index("by_userId_and_isActive", ["userId", "isActive"]),

  ban_appeals: defineTable({
    banId: v.id("users_bans"),
    userId: v.id("users"),
    message: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()), // admin ID
    reviewResponse: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_banId", ["banId"])
    .index("by_status", ["status"]),

  ip_tracking: defineTable({
    ip: v.string(),
    userId: v.optional(v.id("users")), // null if visitor not logged in
    location: v.object({
      country: v.string(),
      countryCode: v.string(),
      state: v.optional(v.string()),
      city: v.optional(v.string()),
      timezone: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
    }),
    device: v.object({
      userAgent: v.string(),
      browserName: v.optional(v.string()),
      browserVersion: v.optional(v.string()),
      osName: v.optional(v.string()),
      osVersion: v.optional(v.string()),
      deviceType: v.optional(v.string()), // mobile, desktop, tablet
    }),
    lastSeen: v.number(),
    createdAt: v.number(),
    isBot: v.boolean(),
  })
    .index("by_ip", ["ip"])
    .index("by_userId", ["userId"])
    .index("by_lastSeen", ["lastSeen"])
    .index("by_createdAt", ["createdAt"]),

  visitors: defineTable({
    ip: v.string(),
    userId: v.optional(v.id("users")), // null if visitor not logged in
    location: v.object({
      country: v.string(),
      countryCode: v.string(),
      state: v.optional(v.string()),
      city: v.optional(v.string()),
      timezone: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      org: v.optional(v.string()), // ISP / organization name
    }),
    device: v.object({
      userAgent: v.string(),
      browserName: v.optional(v.string()),
      browserVersion: v.optional(v.string()),
      osName: v.optional(v.string()),
      osVersion: v.optional(v.string()),
      deviceType: v.optional(v.string()),
    }),
    visitCount: v.optional(v.number()), // Total number of visits from this IP
    firstVisitedAt: v.optional(v.number()),
    lastVisitedAt: v.optional(v.number()),
    // Legacy fields for backward compatibility
    visitedAt: v.optional(v.number()),
    isBot: v.boolean(),
  })
    .index("by_ip", ["ip"])
    .index("by_userId", ["userId"])
    .index("by_lastVisitedAt", ["lastVisitedAt"]),

  platform_config: defineTable({
    key: v.string(), // singleton row — always "main"
    minDeposit: v.number(),
    minWithdrawal: v.number(),
    withdrawalFeePercent: v.number(),
    instantProcessingFee: v.number(), // KES 150 by default
    referralReward: v.optional(v.number()), // KES amount for each successful referral
    updatedAt: v.number(),
    updatedBy: v.string(),
  }).index("by_key", ["key"]),

  withdrawal_requests: defineTable({
    userId: v.id("users"),
    amount: v.number(), // amount user wants to withdraw
    feeAmount: v.number(), // the % fee they paid
    feeTxReference: v.string(), // Paystack reference for fee payment
    phone: v.string(), // M-Pesa number to send funds to
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    isInstant: v.boolean(), // did they pay the KES 150 instant fee?
    instantFeeTxReference: v.optional(v.string()),
    requestedAt: v.number(),
    processedAt: v.optional(v.number()),
    processedBy: v.optional(v.string()), // admin user ID
    rejectionReason: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_userId_and_status", ["userId", "status"])
    .index("by_requestedAt", ["requestedAt"]),

  referrals: defineTable({
    referrerId: v.id("users"), // user who shared the referral
    referredUserId: v.optional(v.id("users")), // user who signed up via referral (null until they sign up)
    referralCode: v.string(), // unique code for this referral link
    phone: v.optional(v.string()), // phone of the person who clicked the link (before signup)
    status: v.union(
      v.literal("pending"), // created but referred user hasn't signed up yet
      v.literal("completed") // referred user has signed up successfully
    ),
    amountEarned: v.number(), // amount credited to referrer (1000 KES when completed)
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_referrerId", ["referrerId"])
    .index("by_referralCode", ["referralCode"])
    .index("by_referredUserId", ["referredUserId"])
    .index("by_status", ["status"])
    .index("by_referrerId_and_status", ["referrerId", "status"]),
})

export default schema
