import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  normalizedMarketValidator,
  normalizedMatchValidator,
  normalizedOddValidator,
} from "./scraperValidators";
import { KWIKBET_SOURCE } from "./scrapers/kwikbet";

const DEFAULT_CADENCE_MINUTES = 5;
const DEFAULT_DATE_WINDOW_DAYS = 2;
const DEFAULT_PAGE_LIMIT = 5;

async function getOrCreateSettings(ctx: MutationCtx, now: number) {
  const existing = await ctx.db
    .query("scraperSettings")
    .withIndex("by_source", (q) => q.eq("source", KWIKBET_SOURCE))
    .unique();

  if (existing) return existing;

  const id = await ctx.db.insert("scraperSettings", {
    source: KWIKBET_SOURCE,
    enabled: true,
    cadenceMinutes: DEFAULT_CADENCE_MINUTES,
    dateWindowDays: DEFAULT_DATE_WINDOW_DAYS,
    selectedSports: ["1"],
    matchLimit: DEFAULT_PAGE_LIMIT,
    lastRunAt: null,
    nextRunAt: now,
    updatedAt: now,
  });

  const created = await ctx.db.get(id);
  if (!created) throw new Error("Failed to create scraper settings");
  return created;
}

export const getAdminOverview = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("scraperSettings")
      .withIndex("by_source", (q) => q.eq("source", KWIKBET_SOURCE))
      .unique();

    const pageSize = Math.max(1, Math.min(args.limit ?? 10, 50));
    const offset = Math.max(0, args.offset ?? 0);
    const fetchLimit = (Math.ceil(offset / pageSize) + 2) * pageSize;

    const allRuns = await ctx.db
      .query("scrapeRuns")
      .withIndex("by_source_and_startedAt", (q) => q.eq("source", KWIKBET_SOURCE))
      .order("desc")
      .take(fetchLimit);

    const runs = allRuns.slice(offset, offset + pageSize);

    return {
      settings: settings ?? {
        source: KWIKBET_SOURCE,
        enabled: true,
        cadenceMinutes: DEFAULT_CADENCE_MINUTES,
        dateWindowDays: DEFAULT_DATE_WINDOW_DAYS,
        lastRunAt: null,
        nextRunAt: Date.now(),
        updatedAt: Date.now(),
      },
      runs,
      totalRuns: allRuns.length,
    };
  },
});

export const updateSettings = mutation({
  args: {
    enabled: v.boolean(),
    cadenceMinutes: v.number(),
    dateWindowDays: v.number(),
    selectedSports: v.array(v.string()),
    matchLimit: v.number(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cadenceMinutes = Math.max(1, Math.min(120, Math.floor(args.cadenceMinutes)));
    const dateWindowDays = Math.max(1, Math.min(14, Math.floor(args.dateWindowDays)));
    const matchLimit = Math.max(5, Math.min(20, Math.floor(args.matchLimit)));
    const selectedSports = args.selectedSports.length > 0 ? args.selectedSports : ["1"];
    const settings = await getOrCreateSettings(ctx, now);

    const changes: string[] = [];
    if (settings.enabled !== args.enabled) changes.push(`enabled: ${args.enabled}`);
    if (settings.cadenceMinutes !== cadenceMinutes) changes.push(`cadenceMinutes: ${cadenceMinutes} min`);
    if (settings.dateWindowDays !== dateWindowDays) changes.push(`dateWindowDays: ${dateWindowDays} days`);
    if (settings.matchLimit !== matchLimit) changes.push(`matchLimit: ${matchLimit}`);

    await ctx.db.patch(settings._id, {
      enabled: args.enabled,
      cadenceMinutes,
      dateWindowDays,
      selectedSports,
      matchLimit,
      updatedAt: now,
    });

    // Log the action
    if (args.sessionToken) {
      const { logAdminActionInternal } = await import("./audit/logs");
      const { getAdminSessionByTokenInternal } = await import("./admin/sessions");

      const adminSession = await getAdminSessionByTokenInternal(ctx, args.sessionToken);
      if (adminSession) {
        await logAdminActionInternal(ctx, {
          adminName: adminSession.adminName,
          userId: adminSession.userId,
          actionType: "update_scraper_settings",
          resourceType: "scraper_settings",
          resourceDescription: "Scraper configuration updated",
          details: {
            newValue: changes.join("; "),
          },
        });
      }
    }

    return { success: true };
  },
});

export const startRun = mutation({
  args: {
    triggeredBy: v.string(),
    dateFrom: v.string(),
    dateTo: v.string(),
    selectedSports: v.array(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await getOrCreateSettings(ctx, now);

    const runId = await ctx.db.insert("scrapeRuns", {
      source: KWIKBET_SOURCE,
      status: "running",
      triggeredBy: args.triggeredBy,
      startedAt: now,
      finishedAt: null,
      durationMs: null,
      dateFrom: args.dateFrom,
      dateTo: args.dateTo,
      selectedSports: args.selectedSports,
      matchesDiscovered: 0,
      matchesUpserted: 0,
      marketsUpserted: 0,
      oddsUpserted: 0,
      failedMatches: 0,
    });

    // Log the scraper run start
    if (args.sessionToken) {
      const { logAdminActionInternal } = await import("./audit/logs");
      const { getAdminSessionByTokenInternal } = await import("./admin/sessions");

      const adminSession = await getAdminSessionByTokenInternal(ctx, args.sessionToken);
      if (adminSession) {
        await logAdminActionInternal(ctx, {
          adminName: adminSession.adminName,
          userId: adminSession.userId,
          actionType: "run_scraper",
          resourceType: "scraper_run",
          resourceDescription: `Scraper run started for ${args.selectedSports.length} sport(s) from ${args.dateFrom} to ${args.dateTo}`,
          details: {
            newValue: `Sports: ${args.selectedSports.join(", ")}; Date range: ${args.dateFrom} to ${args.dateTo}`,
          },
        });
      }
    }

    return runId;
  },
});

export const upsertMatchDetail = mutation({
  args: {
    runId: v.id("scrapeRuns"),
    match: normalizedMatchValidator,
    markets: v.array(normalizedMarketValidator),
    odds: v.array(normalizedOddValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existingMatch = await ctx.db
      .query("sportsMatches")
      .withIndex("by_source_and_sourceMatchId", (q) =>
        q.eq("source", args.match.source).eq("sourceMatchId", args.match.sourceMatchId)
      )
      .unique();

    const existingMarkets = await ctx.db
      .query("sportsMarkets")
      .withIndex("by_sourceMatchId_and_marketKey", (q) =>
        q.eq("sourceMatchId", args.match.sourceMatchId)
      )
      .collect();

    const marketKeyMap = new Map(
      existingMarkets.map(m => [m.marketKey, m])
    );

    const existingOdds = await ctx.db
      .query("sportsOdds")
      .withIndex("by_sourceMatchId", (q) =>
        q.eq("sourceMatchId", args.match.sourceMatchId)
      )
      .collect();

    const oddIdMap = new Map(
      existingOdds.map(o => [o.sourceOddId, o])
    );

    const matchDoc = { ...args.match, lastScrapedAt: now };
    if (existingMatch) {
      await ctx.db.replace(existingMatch._id, matchDoc);
    } else {
      await ctx.db.insert("sportsMatches", matchDoc);
    }

    let marketsUpserted = 0;
    for (const market of args.markets) {
      const existing = marketKeyMap.get(market.marketKey);
      const marketDoc = { ...market, lastScrapedAt: now };
      if (existing) {
        await ctx.db.replace(existing._id, marketDoc);
      } else {
        await ctx.db.insert("sportsMarkets", marketDoc);
      }
      marketsUpserted++;
    }

    let oddsUpserted = 0;
    for (const odd of args.odds) {
      const existing = oddIdMap.get(odd.sourceOddId);
      const oddDoc = { ...odd, lastScrapedAt: now };
      if (existing) {
        await ctx.db.replace(existing._id, oddDoc);
      } else {
        await ctx.db.insert("sportsOdds", oddDoc);
      }
      oddsUpserted++;
    }

    return { marketsUpserted, oddsUpserted };
  },
});

export const noteDiscovery = mutation({
  args: {
    runId: v.id("scrapeRuns"),
    matchesDiscovered: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      matchesDiscovered: args.matchesDiscovered,
    });
  },
});

export const noteMatchFailure = mutation({
  args: {
    runId: v.id("scrapeRuns"),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) return null;

    await ctx.db.patch(args.runId, {
      failedMatches: run.failedMatches + 1,
    });
    return null;
  },
});

export const finishRun = mutation({
  args: {
    runId: v.id("scrapeRuns"),
    status: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const run = await ctx.db.get(args.runId);
    if (!run) return null;

    await ctx.db.patch(args.runId, {
      status: args.status,
      finishedAt: now,
      durationMs: now - run.startedAt,
    });

    const settings = await ctx.db
      .query("scraperSettings")
      .withIndex("by_source", (q) => q.eq("source", KWIKBET_SOURCE))
      .unique();

    if (settings) {
      await ctx.db.patch(settings._id, {
        lastRunAt: now,
        updatedAt: now,
      });
    }

    // Log the scraper run completion
    if (args.sessionToken) {
      const { logAdminActionInternal } = await import("./audit/logs");
      const { getAdminSessionByTokenInternal } = await import("./admin/sessions");

      const adminSession = await getAdminSessionByTokenInternal(ctx, args.sessionToken);
      if (adminSession) {
        const statusLabel = args.status === "success" ? "completed successfully" : "failed";
        await logAdminActionInternal(ctx, {
          adminName: adminSession.adminName,
          userId: adminSession.userId,
          actionType: "run_scraper",
          resourceType: "scraper_run",
          resourceDescription: `Scraper run ${statusLabel}`,
          details: {
            newValue: `Status: ${args.status}; Discovered: ${run.matchesDiscovered}; Saved: ${run.matchesUpserted}; Markets: ${run.marketsUpserted}; Odds: ${run.oddsUpserted}`,
          },
        });
      }
    }

    return null;
  },
});

export const updateRunStats = mutation({
  args: {
    runId: v.id("scrapeRuns"),
    matchesUpserted: v.number(),
    marketsUpserted: v.number(),
    oddsUpserted: v.number(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (run) {
      await ctx.db.patch(args.runId, {
        matchesUpserted: run.matchesUpserted + args.matchesUpserted,
        marketsUpserted: run.marketsUpserted + args.marketsUpserted,
        oddsUpserted: run.oddsUpserted + args.oddsUpserted,
      });
    }
  },
});
