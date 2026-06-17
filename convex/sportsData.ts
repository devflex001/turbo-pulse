import { v } from "convex/values";
import { query } from "./_generated/server";

const SOURCE = "kwikbet";

function compactSearch(value: string) {
  return value.trim().toLowerCase();
}

export const listMatches = query({
  args: {
    sport: v.optional(v.string()),
    competition: v.optional(v.string()),
    status: v.optional(v.union(v.literal("live"), v.literal("upcoming"))),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 80, 120));
    const lowerBound = Date.now() - 12 * 60 * 60 * 1000;

    const base =
      args.status === "live"
        ? await ctx.db
            .query("sportsMatches")
            .withIndex("by_source_and_status_and_startTime", (q) =>
              q.eq("source", SOURCE).eq("status", 1).gte("startTime", lowerBound)
            )
            .take(limit * 3)
        : await ctx.db
            .query("sportsMatches")
            .withIndex("by_source_and_startTime", (q) =>
              q.eq("source", SOURCE).gte("startTime", lowerBound)
            )
            .take(limit * 3);

    const search = compactSearch(args.search ?? "");
    const sport = args.sport && args.sport !== "all" ? args.sport : null;
    const competition =
      args.competition && args.competition !== "All Leagues" ? args.competition : null;

    const filtered = base
      .filter((match) => {
        if (args.status === "upcoming" && match.status === 1) return false;
        if (sport && match.sportSlug !== sport) return false;
        if (competition && match.competitionName !== competition) return false;
        if (!search) return true;

        const text = `${match.homeTeam} ${match.awayTeam} ${match.competitionName} ${match.sourceMatchId}`.toLowerCase();
        return text.includes(search);
      })
      .slice(0, limit);

    const page = await Promise.all(
      filtered.map(async (match) => {
        const mainMarket = await ctx.db
          .query("sportsMarkets")
          .withIndex("by_sourceMatchId_and_marketKey", (q) =>
            q
              .eq("sourceMatchId", match.sourceMatchId)
              .eq(
                "marketKey",
                `${match.sourceMatchId}:1:1x2:main`
              )
          )
          .unique();

        const mainOdds = mainMarket
          ? await ctx.db
              .query("sportsOdds")
              .withIndex("by_sourceMatchId_and_marketKey_and_priority", (q) =>
                q
                  .eq("sourceMatchId", match.sourceMatchId)
                  .eq("marketKey", mainMarket.marketKey)
              )
              .take(3)
          : [];

        return { ...match, mainOdds };
      })
    );

    return page;
  },
});

export const listCompetitions = query({
  args: {
    sport: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lowerBound = Date.now() - 12 * 60 * 60 * 1000;
    const matches = await ctx.db
      .query("sportsMatches")
      .withIndex("by_source_and_startTime", (q) =>
        q.eq("source", SOURCE).gte("startTime", lowerBound)
      )
      .take(300);

    const sport = args.sport && args.sport !== "all" ? args.sport : null;
    const names = matches
      .filter((match) => !sport || match.sportSlug === sport)
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
      .take(300);
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
      .take(500);
  },
});
