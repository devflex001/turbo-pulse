import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { logAdminActionInternal } from "./audit/logs";
import { getAdminSessionByTokenInternal } from "./admin/sessions";

const SOURCE = "kwikbet";

function compactSearch(value: string) {
  return value.trim().toLowerCase();
}

// Optimized query for initial page load - only match details, no odds
export const listMatches = query({
  args: {
    sport: v.optional(v.string()),
    competition: v.optional(v.string()),
    status: v.optional(v.union(v.literal("live"), v.literal("upcoming"))),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    includeFirstMarket: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const pageSize = Math.max(1, Math.min(args.limit ?? 10, 50));
    const offset = Math.max(0, args.offset ?? 0);
    const fetchLimit = (Math.ceil(offset / pageSize) + 2) * pageSize;

    // Look back 24 hours and forward 30 days to catch recently scraped matches
    const lowerBound = Date.now() - 24 * 60 * 60 * 1000;
    const upperBound = Date.now() + 30 * 24 * 60 * 60 * 1000;

    const base =
      args.status === "live"
        ? await ctx.db
          .query("sportsMatches")
          .withIndex("by_source_and_status_and_startTime", (q) =>
            q.eq("source", SOURCE).eq("status", 1).gte("startTime", lowerBound)
          )
          .take(fetchLimit)
        : await ctx.db
          .query("sportsMatches")
          .withIndex("by_source_and_startTime", (q) =>
            q.eq("source", SOURCE).gte("startTime", lowerBound)
          )
          .take(fetchLimit);

    const search = compactSearch(args.search ?? "");
    const sport = args.sport && args.sport !== "all" ? args.sport : null;
    const competition =
      args.competition && args.competition !== "All Leagues" ? args.competition : null;

    const filtered = base
      .filter((match) => {
        if (args.status === "upcoming" && match.status === 1) return false;
        if (sport && match.sportSlug !== sport) return false;
        if (competition && match.competitionName !== competition) return false;
        // Filter out matches too far in the future
        if (match.startTime > upperBound) return false;
        if (!search) return true;

        const text = `${match.homeTeam} ${match.awayTeam} ${match.competitionName} ${match.sourceMatchId}`.toLowerCase();
        return text.includes(search);
      });

    const totalCount = filtered.length;
    const paged = filtered.slice(offset, offset + pageSize);

    // Return matches without odds by default - significantly reduces data load
    // If includeFirstMarket is true, add the first market data for homepage display
    if (args.includeFirstMarket) {
      const page = await Promise.all(
        paged.map(async (match) => {
          const firstMarket = await ctx.db
            .query("sportsMarkets")
            .withIndex("by_sourceMatchId_and_marketPriority", (q) =>
              q.eq("sourceMatchId", match.sourceMatchId)
            )
            .first();

          // Get odds for the first market only
          const firstMarketOdds = firstMarket
            ? await ctx.db
              .query("sportsOdds")
              .withIndex("by_sourceMatchId_and_marketKey_and_priority", (q) =>
                q
                  .eq("sourceMatchId", match.sourceMatchId)
                  .eq("marketKey", firstMarket.marketKey)
              )
              .take(3)
            : [];

          return {
            ...match,
            firstMarket: firstMarket
              ? { ...firstMarket, odds: firstMarketOdds }
              : null
          };
        })
      );
      return {
        items: page,
        totalCount,
      };
    }

    return {
      items: paged,
      totalCount,
    };
  },
});

// New query to get main odds for a specific match when needed
export const getMatchMainOdds = query({
  args: {
    sourceMatchId: v.string(),
  },
  handler: async (ctx, args) => {
    const mainMarket = await ctx.db
      .query("sportsMarkets")
      .withIndex("by_sourceMatchId_and_marketKey", (q) =>
        q
          .eq("sourceMatchId", args.sourceMatchId)
          .eq(
            "marketKey",
            `${args.sourceMatchId}:1:1x2:main`
          )
      )
      .unique();

    if (!mainMarket) return [];

    return await ctx.db
      .query("sportsOdds")
      .withIndex("by_sourceMatchId_and_marketKey_and_priority", (q) =>
        q
          .eq("sourceMatchId", args.sourceMatchId)
          .eq("marketKey", mainMarket.marketKey)
      )
      .take(3);
  },
});

export const listCompetitions = query({
  args: {
    sport: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Look back 24 hours and forward 30 days to catch recently scraped matches
    const lowerBound = Date.now() - 24 * 60 * 60 * 1000;
    const upperBound = Date.now() + 30 * 24 * 60 * 60 * 1000;

    const matches = await ctx.db
      .query("sportsMatches")
      .withIndex("by_source_and_startTime", (q) =>
        q.eq("source", SOURCE).gte("startTime", lowerBound)
      )
      .take(300);

    const sport = args.sport && args.sport !== "all" ? args.sport : null;
    const names = matches
      .filter((match) => {
        if (!sport || match.sportSlug === sport) {
          // Filter out matches too far in the future
          return match.startTime <= upperBound;
        }
        return false;
      })
      .map((match) => match.competitionName)
      .filter(Boolean);

    return ["All Leagues", ...Array.from(new Set(names)).sort()];
  },
});

export const getMatchBySourceId = query({
  args: {
    sourceMatchId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sportsMatches")
      .withIndex("by_source_and_sourceMatchId", (q) =>
        q.eq("source", SOURCE).eq("sourceMatchId", args.sourceMatchId)
      )
      .unique();
  },
});

export const getMatchWithMainOdds = query({
  args: {
    sourceMatchId: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db
      .query("sportsMatches")
      .withIndex("by_source_and_sourceMatchId", (q) =>
        q.eq("source", SOURCE).eq("sourceMatchId", args.sourceMatchId)
      )
      .unique();

    if (!match) return null;

    const mainMarket = await ctx.db
      .query("sportsMarkets")
      .withIndex("by_sourceMatchId_and_marketKey", (q) =>
        q
          .eq("sourceMatchId", args.sourceMatchId)
          .eq("marketKey", `${args.sourceMatchId}:1:1x2:main`)
      )
      .unique();

    const mainOdds = mainMarket
      ? await ctx.db
        .query("sportsOdds")
        .withIndex("by_sourceMatchId_and_marketKey_and_priority", (q) =>
          q
            .eq("sourceMatchId", args.sourceMatchId)
            .eq("marketKey", mainMarket.marketKey)
        )
        .take(3)
      : [];

    return { ...match, mainOdds };
  },
});

export const listMarkets = query({
  args: {
    sourceMatchId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sportsMarkets")
      .withIndex("by_sourceMatchId_and_marketPriority", (q) =>
        q.eq("sourceMatchId", args.sourceMatchId)
      )
      .take(600);
  },
});

// Optimized query to get market summary without odds details
export const getMarketsCount = query({
  args: {
    sourceMatchId: v.string(),
  },
  handler: async (ctx, args) => {
    const markets = await ctx.db
      .query("sportsMarkets")
      .withIndex("by_sourceMatchId_and_marketPriority", (q) =>
        q.eq("sourceMatchId", args.sourceMatchId)
      )
      .take(600);

    return {
      totalMarkets: markets.length,
      hasMainMarket: markets.some(m => m.marketKey.includes(":1x2:main")),
      marketTypes: [...new Set(markets.flatMap(m => m.marketTypes || [m.marketType]).filter(Boolean))],
    };
  },
});

export const listOdds = query({
  args: {
    sourceMatchId: v.string(),
    marketKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sportsOdds")
      .withIndex("by_sourceMatchId_and_marketKey_and_priority", (q) =>
        q.eq("sourceMatchId", args.sourceMatchId).eq("marketKey", args.marketKey)
      )
      .take(1000);
  },
});

export const listOddsByMatch = query({
  args: {
    sourceMatchId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sportsOdds")
      .withIndex("by_sourceMatchId_and_marketKey_and_priority", (q) =>
        q.eq("sourceMatchId", args.sourceMatchId)
      )
      .take(4000);
  },
});

// Query to analyze events before clearing - SIMPLE, only count events
export const analyzeEventsForClear = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const lowerBound = now - 24 * 60 * 60 * 1000;
    const upperBound = now + 30 * 24 * 60 * 60 * 1000;

    // Get all matches only
    const allMatches = await ctx.db.query("sportsMatches").take(10000);

    // Get active bet match IDs only
    const allBets = await ctx.db.query("bets").take(10000);
    const activeBetsMatchIds = new Set<string>();

    for (const bet of allBets) {
      if (bet.status === "active") {
        for (const selection of bet.selections) {
          if (selection.sourceOddId) {
            activeBetsMatchIds.add(selection.sourceOddId);
          }
        }
      }
    }

    // Categorize matches ONLY
    let totalMatches = 0;
    let activeMatches = 0;
    let matchesWithActiveBets = 0;
    let deletableMatches = 0;

    for (const match of allMatches) {
      totalMatches++;

      const isActive =
        match.status === 1 ||
        (match.startTime >= lowerBound && match.startTime <= upperBound);

      const hasActiveBets = activeBetsMatchIds.has(match.sourceMatchId);

      if (isActive) {
        activeMatches++;
      } else if (hasActiveBets) {
        matchesWithActiveBets++;
      } else {
        deletableMatches++;
      }
    }

    return {
      totalMatches,
      activeMatches,
      matchesWithActiveBets,
      deletableMatches,
    };
  },
});

// Clear junk events (old/finished events without active bets)
export const clearJunkEvents = mutation({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const lowerBound = now - 24 * 60 * 60 * 1000;
    const upperBound = now + 30 * 24 * 60 * 60 * 1000;

    // Get all matches
    const allMatches = await ctx.db.query("sportsMatches").take(10000);

    // Get active bet match IDs
    const allBets = await ctx.db.query("bets").take(10000);
    const activeBetsMatchIds = new Set<string>();

    for (const bet of allBets) {
      if (bet.status === "active") {
        for (const selection of bet.selections) {
          if (selection.sourceOddId) {
            activeBetsMatchIds.add(selection.sourceOddId);
          }
        }
      }
    }

    // Find matches to delete
    const matchesToDelete: string[] = [];
    for (const match of allMatches) {
      const isActive =
        match.status === 1 ||
        (match.startTime >= lowerBound && match.startTime <= upperBound);
      const hasActiveBets = activeBetsMatchIds.has(match.sourceMatchId);

      if (!isActive && !hasActiveBets) {
        matchesToDelete.push(match.sourceMatchId);
      }
    }

    // Delete odds for these matches
    let oddsDeleted = 0;
    const allOdds = await ctx.db.query("sportsOdds").take(10000);
    for (const odd of allOdds) {
      if (matchesToDelete.includes(odd.sourceMatchId)) {
        await ctx.db.delete(odd._id);
        oddsDeleted++;
      }
    }

    // Delete markets for these matches
    let marketsDeleted = 0;
    const allMarkets = await ctx.db.query("sportsMarkets").take(10000);
    for (const market of allMarkets) {
      if (matchesToDelete.includes(market.sourceMatchId)) {
        await ctx.db.delete(market._id);
        marketsDeleted++;
      }
    }

    // Delete matches
    let matchesDeleted = 0;
    for (const match of allMatches) {
      if (matchesToDelete.includes(match.sourceMatchId)) {
        await ctx.db.delete(match._id);
        matchesDeleted++;
      }
    }

    // Log the action
    if (args.sessionToken) {
      const adminSession = await getAdminSessionByTokenInternal(ctx, args.sessionToken);
      if (adminSession) {
        await logAdminActionInternal(ctx, {
          adminName: adminSession.adminName,
          userId: adminSession.userId,
          actionType: "other",
          resourceType: "scraper_data",
          resourceDescription: "Cleared junk events from database",
          details: {
            newValue: `${matchesDeleted} matches deleted`,
          },
        });
      }
    }

    return {
      matchesDeleted,
      marketsDeleted,
      oddsDeleted,
    };
  },
});


