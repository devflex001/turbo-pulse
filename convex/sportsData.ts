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
    const now = Date.now();

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
        // Filter out ended matches (status = 2 means finished)
        if (match.status === 2) return false;
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

// New optimized query to get sport counts without fetching full match data - fetches ALL matches for accurate counts
export const getSportCounts = query({
  args: {},
  handler: async (ctx) => {
    // Look back 24 hours and forward 30 days to catch recently scraped matches
    const lowerBound = Date.now() - 24 * 60 * 60 * 1000;
    const upperBound = Date.now() + 30 * 24 * 60 * 60 * 1000;

    const matches = await ctx.db
      .query("sportsMatches")
      .withIndex("by_source_and_startTime", (q) =>
        q.eq("source", SOURCE).gte("startTime", lowerBound)
      )
      .take(500);

    const counts = new Map<string, number>();
    let totalCount = 0;

    for (const match of matches) {
      // Filter out matches too far in the future
      if (match.startTime > upperBound) continue;

      totalCount++;
      const sportSlug = match.sportSlug || "all";
      counts.set(sportSlug, (counts.get(sportSlug) ?? 0) + 1);
    }

    return {
      total: totalCount,
      bySport: Object.fromEntries(counts),
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

// Clear old events - ULTRA LEAN with indexed queries
export const clearJunkEvents = mutation({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    // Get old matches using index (ONLY 10 at a time to stay under read limits)
    const oldMatches = await ctx.db
      .query("sportsMatches")
      .withIndex("by_source_and_startTime", (q) =>
        q.eq("source", SOURCE).lt("startTime", cutoffTime)
      )
      .take(10);

    let matchesDeleted = 0;
    let marketsDeleted = 0;
    let oddsDeleted = 0;

    for (const match of oldMatches) {
      // Skip live matches
      if (match.status === 1) continue;

      // Delete markets using index (small batch)
      const markets = await ctx.db
        .query("sportsMarkets")
        .withIndex("by_sourceMatchId_and_marketPriority", (q) =>
          q.eq("sourceMatchId", match.sourceMatchId)
        )
        .take(50);

      for (const market of markets) {
        await ctx.db.delete(market._id);
        marketsDeleted++;
      }

      // Delete odds using index (small batch)
      const odds = await ctx.db
        .query("sportsOdds")
        .withIndex("by_sourceMatchId", (q) => q.eq("sourceMatchId", match.sourceMatchId))
        .take(50);

      for (const odd of odds) {
        await ctx.db.delete(odd._id);
        oddsDeleted++;
      }

      // Delete the match
      await ctx.db.delete(match._id);
      matchesDeleted++;
    }

    // Log only on first batch
    if (matchesDeleted > 0 && args.sessionToken) {
      const adminSession = await getAdminSessionByTokenInternal(ctx, args.sessionToken);
      if (adminSession) {
        await logAdminActionInternal(ctx, {
          adminName: adminSession.adminName,
          userId: adminSession.userId,
          actionType: "other",
          resourceType: "scraper_data",
          resourceDescription: "Cleared old events",
          details: {
            newValue: `Batch: ${matchesDeleted} events deleted`,
          },
        });
      }
    }

    return {
      matchesDeleted,
      marketsDeleted,
      oddsDeleted,
      hasMore: oldMatches.length === 10,
    };
  },
});
