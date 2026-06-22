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
    userId: v.optional(v.string()), // deprecated - being migrated away
  }),

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
      })
    ),
    totalOdds: v.number(),
    stake: v.number(),
    potentialReturn: v.number(),
    status: v.string(), // "active" | "won" | "lost"
    placedAt: v.number(),
  }),

  transactions: defineTable({
    txId: v.string(),
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
    .index("by_checkoutRequestID", ["checkoutRequestID"]),

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
    totalMarkets: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
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
  })
    .index("by_phone", ["phone"])
    .index("by_role", ["role"]),
})

export default schema
