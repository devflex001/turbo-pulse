import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { notifyAdmins, notifyUser } from "./notifications"

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

type CustomMarketTemplate = {
  name: string
  marketType: string
  marketTypes: string[]
  priority: number
  outcomes: Array<{
    outcomeId: string
    outcomeName: string
    oddValue: number
    priority: number
  }>
}

const CUSTOM_MARKET_TEMPLATE: CustomMarketTemplate[] = [
  {
    name: "1X2",
    marketType: "1x2",
    marketTypes: ["Main Markets"],
    priority: 1,
    outcomes: [
      { outcomeId: "1", outcomeName: "1", oddValue: 2.45, priority: 1 },
      { outcomeId: "X", outcomeName: "X", oddValue: 3.3, priority: 2 },
      { outcomeId: "2", outcomeName: "2", oddValue: 2.9, priority: 3 },
    ],
  },
  {
    name: "1ST GOAL",
    marketType: "1st_goal",
    marketTypes: ["Goal Markets"],
    priority: 2,
    outcomes: [
      { outcomeId: "1", outcomeName: "1", oddValue: 1.72, priority: 1 },
      { outcomeId: "2", outcomeName: "2", oddValue: 1.58, priority: 2 },
      { outcomeId: "NONE", outcomeName: "NONE", oddValue: 11.14, priority: 3 },
    ],
  },
  {
    name: "DOUBLE CHANCE",
    marketType: "double_chance",
    marketTypes: ["Main Markets"],
    priority: 3,
    outcomes: [
      { outcomeId: "1/X", outcomeName: "1/X", oddValue: 1.26, priority: 1 },
      { outcomeId: "1/2", outcomeName: "1/2", oddValue: 1.28, priority: 2 },
      { outcomeId: "X/2", outcomeName: "X/2", oddValue: 1.47, priority: 3 },
    ],
  },
  {
    name: "DRAW NO BET",
    marketType: "draw_no_bet",
    marketTypes: ["Main Markets"],
    priority: 4,
    outcomes: [
      { outcomeId: "1", outcomeName: "1", oddValue: 1.89, priority: 1 },
      { outcomeId: "2", outcomeName: "2", oddValue: 2.12, priority: 2 },
    ],
  },
  {
    name: "TOTAL",
    marketType: "total",
    marketTypes: ["Totals"],
    priority: 5,
    outcomes: [
      {
        outcomeId: "OVER 3.5",
        outcomeName: "OVER 3.5",
        oddValue: 2.24,
        priority: 1,
      },
      {
        outcomeId: "OVER 0.5",
        outcomeName: "OVER 0.5",
        oddValue: 1.12,
        priority: 2,
      },
      {
        outcomeId: "UNDER 0.5",
        outcomeName: "UNDER 0.5",
        oddValue: 11.37,
        priority: 3,
      },
      {
        outcomeId: "OVER 1.5",
        outcomeName: "OVER 1.5",
        oddValue: 1.19,
        priority: 4,
      },
      {
        outcomeId: "UNDER 1.5",
        outcomeName: "UNDER 1.5",
        oddValue: 4.07,
        priority: 5,
      },
      {
        outcomeId: "OVER 2.5",
        outcomeName: "OVER 2.5",
        oddValue: 1.75,
        priority: 6,
      },
      {
        outcomeId: "UNDER 2.5",
        outcomeName: "UNDER 2.5",
        oddValue: 2.21,
        priority: 7,
      },
      {
        outcomeId: "UNDER 3.5",
        outcomeName: "UNDER 3.5",
        oddValue: 1.66,
        priority: 8,
      },
      {
        outcomeId: "OVER 4.5",
        outcomeName: "OVER 4.5",
        oddValue: 3.78,
        priority: 9,
      },
      {
        outcomeId: "UNDER 4.5",
        outcomeName: "UNDER 4.5",
        oddValue: 1.16,
        priority: 10,
      },
      {
        outcomeId: "OVER 5.5",
        outcomeName: "OVER 5.5",
        oddValue: 7,
        priority: 11,
      },
      {
        outcomeId: "UNDER 5.5",
        outcomeName: "UNDER 5.5",
        oddValue: 1.04,
        priority: 12,
      },
    ],
  },
  {
    name: "BOTH TEAMS TO SCORE",
    marketType: "both_teams_to_score_gg_ng",
    marketTypes: ["Both Teams To Score"],
    priority: 6,
    outcomes: [
      { outcomeId: "YES", outcomeName: "YES", oddValue: 1.81, priority: 1 },
      { outcomeId: "NO", outcomeName: "NO", oddValue: 1.84, priority: 2 },
    ],
  },
  {
    name: "1X2 & BOTH TEAMS TO SCORE",
    marketType: "1x2_and_both_teams_to_score",
    marketTypes: ["Both Teams To Score"],
    priority: 7,
    outcomes: [
      {
        outcomeId: "1 & YES",
        outcomeName: "1 & YES",
        oddValue: 4.06,
        priority: 1,
      },
      {
        outcomeId: "1 & NO",
        outcomeName: "1 & NO",
        oddValue: 3.86,
        priority: 2,
      },
      {
        outcomeId: "X & YES",
        outcomeName: "X & YES",
        oddValue: 5.95,
        priority: 3,
      },
      {
        outcomeId: "X & NO",
        outcomeName: "X & NO",
        oddValue: 5.55,
        priority: 4,
      },
      {
        outcomeId: "2 & YES",
        outcomeName: "2 & YES",
        oddValue: 4.76,
        priority: 5,
      },
      {
        outcomeId: "2 & NO",
        outcomeName: "2 & NO",
        oddValue: 4.77,
        priority: 6,
      },
    ],
  },
  {
    name: "1X2 & TOTAL",
    marketType: "1x2_and_total",
    marketTypes: ["Totals"],
    priority: 8,
    outcomes: [
      {
        outcomeId: "1 & OVER 2.5",
        outcomeName: "1 & OVER 2.5",
        oddValue: 3.57,
        priority: 1,
      },
      {
        outcomeId: "1 & UNDER 2.5",
        outcomeName: "1 & UNDER 2.5",
        oddValue: 4.96,
        priority: 2,
      },
      {
        outcomeId: "X & OVER 2.5",
        outcomeName: "X & OVER 2.5",
        oddValue: 4.56,
        priority: 3,
      },
      {
        outcomeId: "X & UNDER 2.5",
        outcomeName: "X & UNDER 2.5",
        oddValue: 6.02,
        priority: 4,
      },
      {
        outcomeId: "2 & OVER 2.5",
        outcomeName: "2 & OVER 2.5",
        oddValue: 4.62,
        priority: 5,
      },
      {
        outcomeId: "2 & UNDER 2.5",
        outcomeName: "2 & UNDER 2.5",
        oddValue: 5.28,
        priority: 6,
      },
    ],
  },
  {
    name: "HALFTIME/FULLTIME",
    marketType: "halftime_fulltime",
    marketTypes: ["Halftime/Fulltime"],
    priority: 9,
    outcomes: [
      { outcomeId: "1/1", outcomeName: "1/1", oddValue: 4.32, priority: 1 },
      { outcomeId: "1/X", outcomeName: "1/X", oddValue: 22.26, priority: 2 },
      { outcomeId: "1/2", outcomeName: "1/2", oddValue: 38.75, priority: 3 },
      { outcomeId: "X/1", outcomeName: "X/1", oddValue: 4.99, priority: 4 },
      { outcomeId: "X/X", outcomeName: "X/X", oddValue: 5.21, priority: 5 },
      { outcomeId: "X/2", outcomeName: "X/2", oddValue: 7.48, priority: 6 },
      { outcomeId: "2/1", outcomeName: "2/1", oddValue: 52.03, priority: 7 },
      { outcomeId: "2/X", outcomeName: "2/X", oddValue: 24.55, priority: 8 },
      { outcomeId: "2/2", outcomeName: "2/2", oddValue: 4.81, priority: 9 },
    ],
  },
  {
    name: "1ST HALF - 1X2",
    marketType: "1st_half_1x2",
    marketTypes: ["First Half"],
    priority: 10,
    outcomes: [
      { outcomeId: "1", outcomeName: "1", oddValue: 2.93, priority: 1 },
      { outcomeId: "X", outcomeName: "X", oddValue: 2.48, priority: 2 },
      { outcomeId: "2", outcomeName: "2", oddValue: 3.61, priority: 3 },
    ],
  },
  {
    name: "1ST HALF - TOTAL",
    marketType: "1st_half_total",
    marketTypes: ["First Half"],
    priority: 11,
    outcomes: [
      {
        outcomeId: "OVER 0.5",
        outcomeName: "OVER 0.5",
        oddValue: 1.47,
        priority: 1,
      },
      {
        outcomeId: "UNDER 0.5",
        outcomeName: "UNDER 0.5",
        oddValue: 2.84,
        priority: 2,
      },
      {
        outcomeId: "OVER 1.5",
        outcomeName: "OVER 1.5",
        oddValue: 2.3,
        priority: 3,
      },
      {
        outcomeId: "UNDER 1.5",
        outcomeName: "UNDER 1.5",
        oddValue: 1.62,
        priority: 4,
      },
      {
        outcomeId: "OVER 2.5",
        outcomeName: "OVER 2.5",
        oddValue: 5.3,
        priority: 5,
      },
      {
        outcomeId: "UNDER 2.5",
        outcomeName: "UNDER 2.5",
        oddValue: 1.2,
        priority: 6,
      },
    ],
  },
  {
    name: "1ST HALF - BOTH TEAMS TO SCORE",
    marketType: "1st_half_both_teams_to_score",
    marketTypes: ["First Half"],
    priority: 12,
    outcomes: [
      { outcomeId: "YES", outcomeName: "YES", oddValue: 3.22, priority: 1 },
      { outcomeId: "NO", outcomeName: "NO", oddValue: 1.33, priority: 2 },
    ],
  },
  {
    name: "1ST HALF - CORRECT SCORE",
    marketType: "1st_half_correct_score",
    marketTypes: ["First Half"],
    priority: 13,
    outcomes: [
      { outcomeId: "0:0", outcomeName: "0:0", oddValue: 2.42, priority: 1 },
      { outcomeId: "0:1", outcomeName: "0:1", oddValue: 7.88, priority: 2 },
      { outcomeId: "0:2", outcomeName: "0:2", oddValue: 42.38, priority: 3 },
      { outcomeId: "1:0", outcomeName: "1:0", oddValue: 7.15, priority: 4 },
      { outcomeId: "1:1", outcomeName: "1:1", oddValue: 9.07, priority: 5 },
      { outcomeId: "1:2", outcomeName: "1:2", oddValue: 57.94, priority: 6 },
      { outcomeId: "2:0", outcomeName: "2:0", oddValue: 40.26, priority: 7 },
      { outcomeId: "2:1", outcomeName: "2:1", oddValue: 52.05, priority: 8 },
      { outcomeId: "2:2", outcomeName: "2:2", oddValue: 85.55, priority: 9 },
      {
        outcomeId: "OTHER",
        outcomeName: "OTHER",
        oddValue: 16.74,
        priority: 10,
      },
    ],
  },
  {
    name: "CORRECT SCORE",
    marketType: "correct_score",
    marketTypes: ["Correct Score"],
    priority: 14,
    outcomes: [
      { outcomeId: "1:3", outcomeName: "1:3", oddValue: 87.01, priority: 1 },
      { outcomeId: "0:0", outcomeName: "0:0", oddValue: 7.09, priority: 2 },
      { outcomeId: "0:1", outcomeName: "0:1", oddValue: 7.9, priority: 3 },
      { outcomeId: "0:2", outcomeName: "0:2", oddValue: 33.19, priority: 4 },
      { outcomeId: "0:3", outcomeName: "0:3", oddValue: 102.05, priority: 5 },
      { outcomeId: "0:4", outcomeName: "0:4", oddValue: 104.25, priority: 6 },
      { outcomeId: "1:0", outcomeName: "1:0", oddValue: 7.1, priority: 7 },
      { outcomeId: "1:1", outcomeName: "1:1", oddValue: 6.11, priority: 8 },
      { outcomeId: "1:2", outcomeName: "1:2", oddValue: 26, priority: 9 },
      { outcomeId: "1:4", outcomeName: "1:4", oddValue: 105.02, priority: 10 },
      { outcomeId: "2:0", outcomeName: "2:0", oddValue: 28.22, priority: 11 },
      { outcomeId: "2:1", outcomeName: "2:1", oddValue: 21.3, priority: 12 },
      { outcomeId: "2:2", outcomeName: "2:2", oddValue: 21.4, priority: 13 },
      { outcomeId: "2:3", outcomeName: "2:3", oddValue: 76.08, priority: 14 },
      { outcomeId: "2:4", outcomeName: "2:4", oddValue: 95.24, priority: 15 },
      { outcomeId: "3:0", outcomeName: "3:0", oddValue: 91.11, priority: 16 },
      { outcomeId: "3:1", outcomeName: "3:1", oddValue: 74.11, priority: 17 },
      { outcomeId: "3:2", outcomeName: "3:2", oddValue: 65.91, priority: 18 },
      { outcomeId: "3:3", outcomeName: "3:3", oddValue: 106.05, priority: 19 },
      { outcomeId: "3:4", outcomeName: "3:4", oddValue: 98.82, priority: 20 },
      { outcomeId: "4:0", outcomeName: "4:0", oddValue: 100.1, priority: 21 },
      { outcomeId: "4:1", outcomeName: "4:1", oddValue: 90, priority: 22 },
      { outcomeId: "4:2", outcomeName: "4:2", oddValue: 97.04, priority: 23 },
      { outcomeId: "4:3", outcomeName: "4:3", oddValue: 95.76, priority: 24 },
      { outcomeId: "4:4", outcomeName: "4:4", oddValue: 107.44, priority: 25 },
      {
        outcomeId: "OTHER",
        outcomeName: "OTHER",
        oddValue: 30.74,
        priority: 26,
      },
    ],
  },
]

export const createCustomEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    homeTeam: v.string(),
    awayTeam: v.string(),
    startTime: v.number(),
    sport: v.string(),
    competition: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const startTimeIso = new Date(args.startTime).toISOString()

    const eventId = await ctx.db.insert("customEvents", {
      title: args.title,
      description: args.description,
      homeTeam: args.homeTeam,
      awayTeam: args.awayTeam,
      homeScore: 0,
      awayScore: 0,
      startTime: args.startTime,
      startTimeIso,
      sport: args.sport,
      competition: args.competition,
      status: "draft",
      eventStatus: "not_started",
      totalMarkets: 0,
      createdBy: "admin", // TODO: Use auth context when available
      createdAt: now,
      updatedAt: now,
    })

    for (const market of CUSTOM_MARKET_TEMPLATE) {
      const marketId = await ctx.db.insert("customMarkets", {
        eventId,
        marketKey: `${eventId}:${market.priority}:${market.marketType}`,
        name: market.name,
        marketType: market.marketType,
        marketTypes: market.marketTypes,
        priority: market.priority,
        isActive: true,
      })

      for (const outcome of market.outcomes) {
        await ctx.db.insert("customOdds", {
          marketId,
          eventId,
          outcomeId: outcome.outcomeId,
          outcomeName: outcome.outcomeName,
          oddValue: outcome.oddValue,
          priority: outcome.priority,
          isActive: true,
        })
      }
    }

    // Update event with total markets count
    await ctx.db.patch(eventId, {
      totalMarkets: CUSTOM_MARKET_TEMPLATE.length,
      updatedAt: now,
    })

    return eventId
  },
})

export const updateCustomEvent = mutation({
  args: {
    eventId: v.id("customEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    homeTeam: v.optional(v.string()),
    awayTeam: v.optional(v.string()),
    startTime: v.optional(v.number()),
    sport: v.optional(v.string()),
    competition: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")
    if (event.status === "published")
      throw new Error("Cannot edit published event")

    const update: any = {
      updatedAt: Date.now(),
    }

    if (args.title !== undefined) update.title = args.title
    if (args.description !== undefined) update.description = args.description
    if (args.homeTeam !== undefined) update.homeTeam = args.homeTeam
    if (args.awayTeam !== undefined) update.awayTeam = args.awayTeam
    if (args.sport !== undefined) update.sport = args.sport
    if (args.competition !== undefined) update.competition = args.competition

    if (args.startTime !== undefined) {
      update.startTime = args.startTime
      update.startTimeIso = new Date(args.startTime).toISOString()
    }

    await ctx.db.patch(args.eventId, update)
    return args.eventId
  },
})

export const updateCustomEventScore = mutation({
  args: {
    eventId: v.id("customEvents"),
    homeScore: v.number(),
    awayScore: v.number(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")
    if (
      !Number.isInteger(args.homeScore) ||
      !Number.isInteger(args.awayScore)
    ) {
      throw new Error("Scores must be whole numbers")
    }
    if (args.homeScore < 0 || args.awayScore < 0) {
      throw new Error("Scores cannot be negative")
    }

    const now = Date.now()
    await ctx.db.patch(args.eventId, {
      homeScore: args.homeScore,
      awayScore: args.awayScore,
      updatedAt: now,
    })

    return args.eventId
  },
})

export const markEventAsFinished = mutation({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")
    if (event.eventStatus === "finished") throw new Error("Event already finished")

    const now = Date.now()
    await ctx.db.patch(args.eventId, {
      eventStatus: "finished",
      updatedAt: now,
    })

    return args.eventId
  },
})

export const autoUpdateFinishedEvents = mutation({
  args: {
    eventIds: v.array(v.id("customEvents")),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const MATCH_DURATION = 105 * 60 * 1000 // 105 minutes

    for (const eventId of args.eventIds) {
      const event = await ctx.db.get(eventId)
      if (!event) continue
      if (event.eventStatus === "finished") continue // Already finished

      const timeElapsed = now - event.startTime
      if (timeElapsed >= MATCH_DURATION) {
        await ctx.db.patch(eventId, {
          eventStatus: "finished",
          updatedAt: now,
        })
      }
    }
  },
})

export const updateCustomMarket = mutation({
  args: {
    marketId: v.id("customMarkets"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const market = await ctx.db.get(args.marketId)
    if (!market) throw new Error("Market not found")

    const event = await ctx.db.get(market.eventId)
    if (event?.status === "published")
      throw new Error("Cannot edit markets in published event")

    const update: any = {}
    if (args.name !== undefined) update.name = args.name
    if (args.description !== undefined) update.description = args.description
    if (args.priority !== undefined) update.priority = args.priority
    if (args.isActive !== undefined) update.isActive = args.isActive

    await ctx.db.patch(args.marketId, update)
    return args.marketId
  },
})

export const createCustomOdds = mutation({
  args: {
    marketId: v.id("customMarkets"),
    eventId: v.id("customEvents"),
    outcomes: v.array(
      v.object({
        outcomeId: v.string(),
        outcomeName: v.string(),
        outcomeAlias: v.optional(v.string()),
        specifiers: v.optional(v.string()),
        oddValue: v.number(),
        priority: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")
    if (event.status === "published")
      throw new Error("Cannot edit published event")

    const oddIds = []
    for (const outcome of args.outcomes) {
      const oddId = await ctx.db.insert("customOdds", {
        marketId: args.marketId,
        eventId: args.eventId,
        outcomeId: outcome.outcomeId,
        outcomeName: outcome.outcomeName,
        outcomeAlias: outcome.outcomeAlias,
        specifiers: outcome.specifiers,
        oddValue: outcome.oddValue,
        priority: outcome.priority,
        isActive: true,
      })
      oddIds.push(oddId)
    }

    return oddIds
  },
})

export const updateCustomOdds = mutation({
  args: {
    oddId: v.id("customOdds"),
    oddValue: v.optional(v.number()),
    priority: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const odd = await ctx.db.get(args.oddId)
    if (!odd) throw new Error("Odd not found")

    const event = await ctx.db.get(odd.eventId)
    if (event?.status === "published")
      throw new Error("Cannot edit odds in published event")

    const update: any = {}
    if (args.oddValue !== undefined) update.oddValue = args.oddValue
    if (args.priority !== undefined) update.priority = args.priority
    if (args.isActive !== undefined) update.isActive = args.isActive

    await ctx.db.patch(args.oddId, update)
    return args.oddId
  },
})

export const publishCustomEvent = mutation({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")
    if (event.status === "published") throw new Error("Event already published")

    const now = Date.now()
    await ctx.db.patch(args.eventId, {
      status: "published",
      publishedAt: now,
      updatedAt: now,
    })

    return args.eventId
  },
})

export const unpublishCustomEvent = mutation({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")
    if (event.status === "draft")
      throw new Error("Event is already unpublished")

    const now = Date.now()
    await ctx.db.patch(args.eventId, {
      status: "draft",
      updatedAt: now,
    })

    return args.eventId
  },
})

export const deleteCustomEvent = mutation({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")
    if (event.status === "published")
      throw new Error("Cannot delete published event")

    // Delete all related odds
    const odds = await ctx.db
      .query("customOdds")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .take(10000)

    for (const odd of odds) {
      await ctx.db.delete(odd._id)
    }

    // Delete all related markets
    const markets = await ctx.db
      .query("customMarkets")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .take(10000)

    for (const market of markets) {
      await ctx.db.delete(market._id)
    }

    // Delete event
    await ctx.db.delete(args.eventId)

    return true
  },
})

// Queries
export const getCustomEvent = query({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId)
  },
})

export const listCustomEvents = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    sport: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = Math.max(1, Math.min(args.limit ?? 10, 50))
    const offset = Math.max(0, args.offset ?? 0)
    const fetchLimit = (Math.ceil(offset / pageSize) + 2) * pageSize
    const search = (args.search ?? "").toLowerCase().trim()

    let results

    if (args.status) {
      results = await ctx.db
        .query("customEvents")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(fetchLimit)
    } else {
      results = await ctx.db.query("customEvents").take(fetchLimit)
    }

    // Filter by sport if provided
    if (args.sport) {
      results = results.filter((e: any) => e.sport === args.sport)
    }

    // Filter by search if provided
    if (search) {
      results = results.filter((e: any) => {
        const text =
          `${e.homeTeam} ${e.awayTeam} ${e.competition}`.toLowerCase()
        return text.includes(search)
      })
    }

    // Sort by created date (newest first)
    results = results.sort((a: any, b: any) => b.createdAt - a.createdAt)

    const totalCount = results.length
    const paginatedResults = results.slice(offset, offset + pageSize)

    return {
      items: paginatedResults,
      totalCount,
    }
  },
})

export const listCustomMarkets = query({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customMarkets")
      .withIndex("by_eventId_and_priority", (q) =>
        q.eq("eventId", args.eventId)
      )
      .take(500)
  },
})

export const listCustomOdds = query({
  args: {
    marketId: v.id("customMarkets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customOdds")
      .withIndex("by_marketId_and_priority", (q) =>
        q.eq("marketId", args.marketId)
      )
      .take(1000)
  },
})

export const listCustomOddsByEvent = query({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customOdds")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .take(4000)
  },
})

export const getCustomEventWithMarkets = query({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) return null

    const markets = await ctx.db
      .query("customMarkets")
      .withIndex("by_eventId_and_priority", (q) =>
        q.eq("eventId", args.eventId)
      )
      .take(500)

    return { ...event, markets }
  },
})

// Get bets for a custom event to settle
export const getEventBets = query({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    const bets = await ctx.db
      .query("bets")
      .collect()

    // Filter bets that have selections matching this custom event
    return bets.filter((bet) =>
      bet.selections.some((sel: any) => sel.matchId === args.eventId)
    )
  },
})

// Settle event: mark which market outcomes won
// This will automatically settle all related bets
export const settleCustomEvent = mutation({
  args: {
    eventId: v.id("customEvents"),
    marketOutcomes: v.array(v.object({
      marketId: v.id("customMarkets"),
      winningOutcomeIds: v.array(v.string()), // Multiple outcomes can win in same market
    })),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) throw new Error("Event not found")
    if (event.eventStatus === "finished") throw new Error("Event already settled")

    // Validate all markets and outcomes exist
    for (const resolution of args.marketOutcomes) {
      const market = await ctx.db.get(resolution.marketId)
      if (!market || market.eventId !== args.eventId) {
        throw new Error(`Market not found for this event`)
      }

      for (const outcomeId of resolution.winningOutcomeIds) {
        const outcome = await ctx.db
          .query("customOdds")
          .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
          .filter((q) =>
            q.and(
              q.eq(q.field("outcomeId"), outcomeId),
              q.eq(q.field("marketId"), resolution.marketId)
            )
          )
          .first()

        if (!outcome) throw new Error(`Outcome ${outcomeId} not found in market`)
      }
    }

    // Update event status to finished
    await ctx.db.patch(args.eventId, {
      eventStatus: "finished",
      settledAt: Date.now(),
    })

    // Get all active bets for this event
    const allBets = await ctx.db.query("bets").collect()
    const eventBets = allBets.filter((bet) =>
      bet.selections.some((sel: any) => sel.matchId === args.eventId && bet.status === "active")
    )

    // Flatten all winning outcomeIds across markets
    const winningOutcomeIds = new Set<string>()
    for (const resolution of args.marketOutcomes) {
      for (const outcomeId of resolution.winningOutcomeIds) {
        winningOutcomeIds.add(outcomeId)
      }
    }

    // Settle each bet
    for (const bet of eventBets) {
      // A bet wins only if ALL its selections for this event are in the winning outcomes
      const eventSelections = bet.selections.filter((sel: any) => sel.matchId === args.eventId)

      const allSelectionsWon = eventSelections.length > 0 && eventSelections.every(
        (sel: any) => winningOutcomeIds.has(sel.outcomeId)
      )

      const isWon = allSelectionsWon

      // Update bet status
      await ctx.db.patch(bet._id, {
        status: isWon ? "won" : "lost",
        settledAt: Date.now(),
        settledEventId: args.eventId,
      })

      // If bet won, credit user's wallet with potential return
      if (isWon && bet.userId) {
        const userId = bet.userId as Id<"users">
        let wallet = await ctx.db
          .query("wallets")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique()

        const currentBalance = wallet ? wallet.balance : 0

        if (wallet) {
          await ctx.db.patch(wallet._id, {
            balance: currentBalance + bet.potentialReturn,
          })
        } else {
          await ctx.db.insert("wallets", {
            userId: userId,
            balance: 0 + bet.potentialReturn,
          })
        }

        // Notify user they won
        const betLabel = bet.selections.length === 1
          ? bet.selections[0]?.matchName ?? "your selection"
          : `${bet.selections.length} selections`

        await notifyUser(ctx, {
          recipientUserId: userId,
          type: "bet",
          title: "Bet won",
          message: `Your bet on ${betLabel} won! ${formatKes(bet.potentialReturn)} has been credited to your wallet.`,
          href: "/my-bets",
          dedupeKey: `custom-event-won:${bet._id}:${args.eventId}`,
          metadata: {
            betId: bet._id,
            amount: bet.potentialReturn,
            sourceMatchId: args.eventId,
          },
        })
      } else if (!isWon && bet.userId) {
        // Notify user they lost
        const userId = bet.userId as Id<"users">
        const betLabel = bet.selections.length === 1
          ? bet.selections[0]?.matchName ?? "your selection"
          : `${bet.selections.length} selections`

        await notifyUser(ctx, {
          recipientUserId: userId,
          type: "bet",
          title: "Bet lost",
          message: `Your bet on ${betLabel} did not win. Better luck next time!`,
          href: "/my-bets",
          dedupeKey: `custom-event-lost:${bet._id}:${args.eventId}`,
          metadata: {
            betId: bet._id,
            amount: bet.stake,
            sourceMatchId: args.eventId,
          },
        })
      }
    }

    // Notify admins
    await notifyAdmins(ctx, {
      type: "match",
      title: "Custom event settled",
      message: `Event ${event.homeTeam} vs ${event.awayTeam} has been settled. ${eventBets.length} bets processed.`,
      href: `/admin/custom-events/${args.eventId}`,
      dedupeKey: `custom-event-settled:${args.eventId}`,
    })

    return args.eventId
  },
})
