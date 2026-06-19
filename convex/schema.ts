import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  // Better Auth tables are managed by @convex-dev/better-auth plugin
  // Do not define them in this schema - the plugin handles them automatically

  // Application data tables
  admins: defineTable({
    userId: v.string(),
    email: v.string(),
    addedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  /**
   * Tracks bans for users. One active ban per user at a time.
   * bannedUntil = null means permanent ban.
   */
  userBans: defineTable({
    userId: v.string(),
    reason: v.string(),
    bannedAt: v.number(),
    bannedByAdminId: v.id("admins"),
    /** null = permanent */
    bannedUntil: v.union(v.number(), v.null()),
    isActive: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_isActive", ["userId", "isActive"]),

  /**
   * Appeal submissions from banned users.
   */
  banAppeals: defineTable({
    banId: v.id("userBans"),
    userId: v.string(),
    message: v.string(),
    submittedAt: v.number(),
    /** pending | approved | rejected */
    status: v.string(),
    reviewedAt: v.union(v.number(), v.null()),
    reviewedByAdminId: v.union(v.id("admins"), v.null()),
    adminNote: v.union(v.string(), v.null()),
  })
    .index("by_banId", ["banId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

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
    errorSummary: v.union(v.string(), v.null()),
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
    userId: v.string(),
    balance: v.number(),
  }).index("by_userId", ["userId"]),

  bets: defineTable({
    userId: v.string(),
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
  }).index("by_userId", ["userId"]),

  transactions: defineTable({
    userId: v.string(),
    txId: v.string(),
    type: v.string(), // "deposit" | "withdrawal"
    amount: v.number(),
    phone: v.optional(v.string()),
    status: v.string(), // "success" | "pending" | "failed"
    errorDetail: v.optional(v.string()),
    time: v.number(),
    // M-Pesa specific fields
    checkoutRequestID: v.optional(v.string()),
    merchantRequestID: v.optional(v.string()),
    resultCode: v.optional(v.string()),
    resultDesc: v.optional(v.string()),
    mpesaReceiptNumber: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_txId", ["txId"])
    .index("by_checkoutRequestID", ["checkoutRequestID"]),
});

export default schema;
