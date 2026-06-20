import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Default odds for each market type
const MARKET_OUTCOMES: Record<string, Array<{ outcomeId: string; outcomeName: string; oddValue: number; priority: number }>> = {
  match_result: [
    { outcomeId: "1", outcomeName: "Home Win", oddValue: 1.85, priority: 1 },
    { outcomeId: "X", outcomeName: "Draw", oddValue: 3.20, priority: 2 },
    { outcomeId: "2", outcomeName: "Away Win", oddValue: 2.10, priority: 3 },
  ],
  double_chance: [
    { outcomeId: "1X", outcomeName: "Home or Draw", oddValue: 1.40, priority: 1 },
    { outcomeId: "X2", outcomeName: "Draw or Away", oddValue: 1.50, priority: 2 },
    { outcomeId: "12", outcomeName: "Home or Away", oddValue: 1.15, priority: 3 },
  ],
  draw_no_bet: [
    { outcomeId: "1", outcomeName: "Home Win", oddValue: 2.05, priority: 1 },
    { outcomeId: "2", outcomeName: "Away Win", oddValue: 2.35, priority: 2 },
  ],
  total_goals: [
    { outcomeId: "O", outcomeName: "Over", oddValue: 1.80, priority: 1 },
    { outcomeId: "U", outcomeName: "Under", oddValue: 2.00, priority: 2 },
  ],
  btts: [
    { outcomeId: "Y", outcomeName: "Yes", oddValue: 1.80, priority: 1 },
    { outcomeId: "N", outcomeName: "No", oddValue: 2.00, priority: 2 },
  ],
  handicap: [
    { outcomeId: "1", outcomeName: "Home", oddValue: 1.90, priority: 1 },
    { outcomeId: "2", outcomeName: "Away", oddValue: 1.90, priority: 2 },
  ],
  correct_score: [
    { outcomeId: "correct", outcomeName: "Correct Score", oddValue: 12.00, priority: 1 },
  ],
  first_half_result: [
    { outcomeId: "1", outcomeName: "Home Win", oddValue: 2.20, priority: 1 },
    { outcomeId: "X", outcomeName: "Draw", oddValue: 3.50, priority: 2 },
    { outcomeId: "2", outcomeName: "Away Win", oddValue: 2.60, priority: 3 },
  ],
  first_half_goals: [
    { outcomeId: "O", outcomeName: "Over", oddValue: 1.85, priority: 1 },
    { outcomeId: "U", outcomeName: "Under", oddValue: 1.95, priority: 2 },
  ],
  first_half_btts: [
    { outcomeId: "Y", outcomeName: "Yes", oddValue: 2.30, priority: 1 },
    { outcomeId: "N", outcomeName: "No", oddValue: 1.58, priority: 2 },
  ],
  team_score_first: [
    { outcomeId: "1", outcomeName: "Home Team", oddValue: 2.10, priority: 1 },
    { outcomeId: "2", outcomeName: "Away Team", oddValue: 2.30, priority: 2 },
  ],
  team_score_last: [
    { outcomeId: "1", outcomeName: "Home Team", oddValue: 2.20, priority: 1 },
    { outcomeId: "2", outcomeName: "Away Team", oddValue: 2.25, priority: 2 },
  ],
  odd_even: [
    { outcomeId: "O", outcomeName: "Odd", oddValue: 1.95, priority: 1 },
    { outcomeId: "E", outcomeName: "Even", oddValue: 1.85, priority: 2 },
  ],
  ht_ft: [
    { outcomeId: "result", outcomeName: "HT/FT Combination", oddValue: 8.50, priority: 1 },
  ],
  goals_range: [
    { outcomeId: "range", outcomeName: "Goal Range", oddValue: 5.00, priority: 1 },
  ],
  winning_margin: [
    { outcomeId: "margin", outcomeName: "Winning Margin", oddValue: 6.00, priority: 1 },
  ],
  combined: [
    { outcomeId: "combined", outcomeName: "Combined Bet", oddValue: 4.50, priority: 1 },
  ],
};

// Market template with 60+ pre-configured markets
const MARKET_TEMPLATE = [
  // Main Markets (1x2, Draw)
  { name: "1X2", marketType: "match_result", marketTypes: ["1X2"], priority: 1 },
  { name: "Double Chance", marketType: "double_chance", marketTypes: ["Double Chance"], priority: 2 },
  { name: "Draw No Bet", marketType: "draw_no_bet", marketTypes: ["Draw No Bet"], priority: 3 },

  // Over/Under Goals
  { name: "Over/Under 0.5", marketType: "total_goals", marketTypes: ["Over/Under"], priority: 4 },
  { name: "Over/Under 1.5", marketType: "total_goals", marketTypes: ["Over/Under"], priority: 5 },
  { name: "Over/Under 2.5", marketType: "total_goals", marketTypes: ["Over/Under"], priority: 6 },
  { name: "Over/Under 3.5", marketType: "total_goals", marketTypes: ["Over/Under"], priority: 7 },
  { name: "Over/Under 4.5", marketType: "total_goals", marketTypes: ["Over/Under"], priority: 8 },

  // Both Teams Score
  { name: "Both Teams To Score", marketType: "btts", marketTypes: ["Both Teams To Score"], priority: 9 },

  // Handicap
  { name: "Handicap -1", marketType: "handicap", marketTypes: ["Handicap"], priority: 10 },
  { name: "Handicap -2", marketType: "handicap", marketTypes: ["Handicap"], priority: 11 },
  { name: "Handicap +1", marketType: "handicap", marketTypes: ["Handicap"], priority: 12 },
  { name: "Handicap +2", marketType: "handicap", marketTypes: ["Handicap"], priority: 13 },

  // Correct Score
  { name: "Correct Score 0-0", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 14 },
  { name: "Correct Score 1-0", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 15 },
  { name: "Correct Score 0-1", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 16 },
  { name: "Correct Score 1-1", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 17 },
  { name: "Correct Score 2-0", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 18 },
  { name: "Correct Score 0-2", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 19 },
  { name: "Correct Score 2-1", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 20 },
  { name: "Correct Score 1-2", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 21 },
  { name: "Correct Score 2-2", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 22 },
  { name: "Correct Score 3-0", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 23 },
  { name: "Correct Score 0-3", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 24 },
  { name: "Correct Score 3-1", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 25 },
  { name: "Correct Score 1-3", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 26 },
  { name: "Correct Score 3-2", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 27 },
  { name: "Correct Score 2-3", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 28 },
  { name: "Correct Score 3-3", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 29 },
  { name: "Correct Score 4-0", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 30 },
  { name: "Correct Score 0-4", marketType: "correct_score", marketTypes: ["Correct Score"], priority: 31 },

  // First Half Markets
  { name: "1X2 First Half", marketType: "first_half_result", marketTypes: ["First Half"], priority: 32 },
  { name: "Over/Under 0.5 First Half", marketType: "first_half_goals", marketTypes: ["First Half"], priority: 33 },
  { name: "Over/Under 1.5 First Half", marketType: "first_half_goals", marketTypes: ["First Half"], priority: 34 },
  { name: "Both Teams Score First Half", marketType: "first_half_btts", marketTypes: ["First Half"], priority: 35 },

  // Player/Team Specific
  { name: "Team To Score First", marketType: "team_score_first", marketTypes: ["Score First"], priority: 36 },
  { name: "Team To Score Last", marketType: "team_score_last", marketTypes: ["Score Last"], priority: 37 },

  // Odd/Even
  { name: "Odd/Even Total Goals", marketType: "odd_even", marketTypes: ["Odd/Even"], priority: 38 },

  // Half Time / Full Time
  { name: "HT/FT Combination 1/1", marketType: "ht_ft", marketTypes: ["HT/FT"], priority: 39 },
  { name: "HT/FT Combination 1/2", marketType: "ht_ft", marketTypes: ["HT/FT"], priority: 40 },
  { name: "HT/FT Combination 1/X", marketType: "ht_ft", marketTypes: ["HT/FT"], priority: 41 },
  { name: "HT/FT Combination 2/1", marketType: "ht_ft", marketTypes: ["HT/FT"], priority: 42 },
  { name: "HT/FT Combination 2/2", marketType: "ht_ft", marketTypes: ["HT/FT"], priority: 43 },
  { name: "HT/FT Combination 2/X", marketType: "ht_ft", marketTypes: ["HT/FT"], priority: 44 },
  { name: "HT/FT Combination X/1", marketType: "ht_ft", marketTypes: ["HT/FT"], priority: 45 },
  { name: "HT/FT Combination X/2", marketType: "ht_ft", marketTypes: ["HT/FT"], priority: 46 },
  { name: "HT/FT Combination X/X", marketType: "ht_ft", marketTypes: ["HT/FT"], priority: 47 },

  // Goals Range
  { name: "Exactly 1 Goal", marketType: "goals_range", marketTypes: ["Goals Range"], priority: 48 },
  { name: "Exactly 2 Goals", marketType: "goals_range", marketTypes: ["Goals Range"], priority: 49 },
  { name: "Exactly 3 Goals", marketType: "goals_range", marketTypes: ["Goals Range"], priority: 50 },
  { name: "2 or 3 Goals", marketType: "goals_range", marketTypes: ["Goals Range"], priority: 51 },
  { name: "3 or 4 Goals", marketType: "goals_range", marketTypes: ["Goals Range"], priority: 52 },
  { name: "3+ Goals", marketType: "goals_range", marketTypes: ["Goals Range"], priority: 53 },
  { name: "4+ Goals", marketType: "goals_range", marketTypes: ["Goals Range"], priority: 54 },
  { name: "5+ Goals", marketType: "goals_range", marketTypes: ["Goals Range"], priority: 55 },

  // Winning Margin
  { name: "Win by 1 Goal", marketType: "winning_margin", marketTypes: ["Winning Margin"], priority: 56 },
  { name: "Win by 2+ Goals", marketType: "winning_margin", marketTypes: ["Winning Margin"], priority: 57 },

  // Both Teams Score & Goals
  { name: "BTTS & Over 2.5", marketType: "combined", marketTypes: ["Combined"], priority: 58 },
  { name: "BTTS & Over 3.5", marketType: "combined", marketTypes: ["Combined"], priority: 59 },
];

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
    const now = Date.now();
    const startTimeIso = new Date(args.startTime).toISOString();

    const eventId = await ctx.db.insert("customEvents", {
      title: args.title,
      description: args.description,
      homeTeam: args.homeTeam,
      awayTeam: args.awayTeam,
      startTime: args.startTime,
      startTimeIso,
      sport: args.sport,
      competition: args.competition,
      status: "draft",
      totalMarkets: 0,
      createdBy: "admin", // TODO: Use auth context when available
      createdAt: now,
      updatedAt: now,
    });

    // Create default markets from template and their odds
    for (const market of MARKET_TEMPLATE) {
      const marketId = await ctx.db.insert("customMarkets", {
        eventId,
        marketKey: `${eventId}:${market.marketType}`,
        name: market.name,
        marketType: market.marketType,
        marketTypes: market.marketTypes,
        priority: market.priority,
        isActive: true,
      });

      // Create odds for this market from the template
      const outcomes = MARKET_OUTCOMES[market.marketType] || MARKET_OUTCOMES["match_result"];
      for (const outcome of outcomes) {
        await ctx.db.insert("customOdds", {
          marketId,
          eventId,
          outcomeId: outcome.outcomeId,
          outcomeName: outcome.outcomeName,
          oddValue: outcome.oddValue,
          priority: outcome.priority,
          isActive: true,
        });
      }
    }

    // Update event with total markets count
    await ctx.db.patch(eventId, {
      totalMarkets: MARKET_TEMPLATE.length,
      updatedAt: now,
    });

    return eventId;
  },
});

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
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.status === "published") throw new Error("Cannot edit published event");

    const update: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) update.title = args.title;
    if (args.description !== undefined) update.description = args.description;
    if (args.homeTeam !== undefined) update.homeTeam = args.homeTeam;
    if (args.awayTeam !== undefined) update.awayTeam = args.awayTeam;
    if (args.sport !== undefined) update.sport = args.sport;
    if (args.competition !== undefined) update.competition = args.competition;

    if (args.startTime !== undefined) {
      update.startTime = args.startTime;
      update.startTimeIso = new Date(args.startTime).toISOString();
    }

    await ctx.db.patch(args.eventId, update);
    return args.eventId;
  },
});

export const updateCustomMarket = mutation({
  args: {
    marketId: v.id("customMarkets"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const market = await ctx.db.get(args.marketId);
    if (!market) throw new Error("Market not found");

    const event = await ctx.db.get(market.eventId);
    if (event?.status === "published") throw new Error("Cannot edit markets in published event");

    const update: any = {};
    if (args.name !== undefined) update.name = args.name;
    if (args.description !== undefined) update.description = args.description;
    if (args.priority !== undefined) update.priority = args.priority;
    if (args.isActive !== undefined) update.isActive = args.isActive;

    await ctx.db.patch(args.marketId, update);
    return args.marketId;
  },
});

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
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.status === "published") throw new Error("Cannot edit published event");

    const oddIds = [];
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
      });
      oddIds.push(oddId);
    }

    return oddIds;
  },
});

export const updateCustomOdds = mutation({
  args: {
    oddId: v.id("customOdds"),
    oddValue: v.optional(v.number()),
    priority: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const odd = await ctx.db.get(args.oddId);
    if (!odd) throw new Error("Odd not found");

    const event = await ctx.db.get(odd.eventId);
    if (event?.status === "published") throw new Error("Cannot edit odds in published event");

    const update: any = {};
    if (args.oddValue !== undefined) update.oddValue = args.oddValue;
    if (args.priority !== undefined) update.priority = args.priority;
    if (args.isActive !== undefined) update.isActive = args.isActive;

    await ctx.db.patch(args.oddId, update);
    return args.oddId;
  },
});

export const publishCustomEvent = mutation({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.status === "published") throw new Error("Event already published");

    const now = Date.now();
    await ctx.db.patch(args.eventId, {
      status: "published",
      publishedAt: now,
      updatedAt: now,
    });

    return args.eventId;
  },
});

export const deleteCustomEvent = mutation({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.status === "published") throw new Error("Cannot delete published event");

    // Delete all related odds
    const odds = await ctx.db
      .query("customOdds")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .take(10000);

    for (const odd of odds) {
      await ctx.db.delete(odd._id);
    }

    // Delete all related markets
    const markets = await ctx.db
      .query("customMarkets")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .take(10000);

    for (const market of markets) {
      await ctx.db.delete(market._id);
    }

    // Delete event
    await ctx.db.delete(args.eventId);

    return true;
  },
});

// Queries
export const getCustomEvent = query({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

export const listCustomEvents = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    sport: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 50, 100));
    const search = (args.search ?? "").toLowerCase().trim();

    let results;

    if (args.status) {
      results = await ctx.db
        .query("customEvents")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(limit * 2);
    } else {
      results = await ctx.db
        .query("customEvents")
        .take(limit * 2);
    }

    // Filter by sport if provided
    if (args.sport) {
      results = results.filter((e: any) => e.sport === args.sport);
    }

    // Filter by search if provided
    if (search) {
      results = results.filter((e: any) => {
        const text = `${e.homeTeam} ${e.awayTeam} ${e.competition}`.toLowerCase();
        return text.includes(search);
      });
    }

    // Sort by created date (newest first)
    results = results.sort((a: any, b: any) => b.createdAt - a.createdAt);

    return results.slice(0, limit);
  },
});

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
      .take(500);
  },
});

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
      .take(1000);
  },
});

export const listCustomOddsByEvent = query({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customOdds")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .take(4000);
  },
});

export const getCustomEventWithMarkets = query({
  args: {
    eventId: v.id("customEvents"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    const markets = await ctx.db
      .query("customMarkets")
      .withIndex("by_eventId_and_priority", (q) =>
        q.eq("eventId", args.eventId)
      )
      .take(500);

    return { ...event, markets };
  },
});
