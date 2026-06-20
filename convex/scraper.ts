import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  normalizedMarketValidator,
  normalizedMatchValidator,
  normalizedOddValidator,
} from "./scraperValidators";
import { KWIKBET_SOURCE, kwikbetAdapter } from "./scrapers/kwikbet";

const DEFAULT_CADENCE_MINUTES = 5;
const DEFAULT_DATE_WINDOW_DAYS = 2;
const DEFAULT_PAGE_LIMIT = 50;
const DEFAULT_MAX_PAGES = 20;
const DETAIL_CONCURRENCY = 4;

// Sport ID mapping for KwikBet API - 8 most popular sports
const AVAILABLE_SPORTS = [
  { id: 1, label: "Soccer" },
  { id: 2, label: "Basketball" },
  { id: 5, label: "Tennis" },
  { id: 16, label: "American Football" },
  { id: 21, label: "Cricket" },
  { id: 10, label: "Boxing" },
  { id: 117, label: "MMA" },
  { id: 12, label: "Rugby" },
];

// Sport ID mapping for KwikBet API - 8 most popular sports
const SPORT_ID_MAP: Record<string, number> = {
  "1": 1,   // Soccer
  "2": 2,   // Basketball
  "5": 5,   // Tennis
  "16": 16, // American Football
  "21": 21, // Cricket
  "10": 10, // Boxing
  "117": 117, // MMA
  "12": 12, // Rugby
};

function mapSportsToIds(sportIds: (string | number)[]): number[] {
  return sportIds
    .map((id) => {
      const numId = typeof id === 'number' ? id : Number(id);
      return Number.isFinite(numId) ? numId : undefined;
    })
    .filter((id): id is number => id !== undefined);
}

async function getAuthUserId(ctx: any) {
  return null; // Auth disabled
}

// Admin check removed - no authentication system

function todayIsoDate(offsetDays: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function dateWindow(dateWindowDays: number) {
  const days = Math.max(1, Math.min(14, Math.floor(dateWindowDays)));
  const dates = Array.from({ length: days }, (_, index) => todayIsoDate(index));
  return {
    dates,
    dateFrom: dates[0],
    dateTo: dates[dates.length - 1],
  };
}

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
    selectedSports: ["1"], // default to soccer
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
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("scraperSettings")
      .withIndex("by_source", (q) => q.eq("source", KWIKBET_SOURCE))
      .unique();

    const runs = await ctx.db
      .query("scrapeRuns")
      .withIndex("by_source_and_startedAt", (q) => q.eq("source", KWIKBET_SOURCE))
      .order("desc")
      .take(10);

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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cadenceMinutes = Math.max(1, Math.min(120, Math.floor(args.cadenceMinutes)));
    const dateWindowDays = Math.max(1, Math.min(14, Math.floor(args.dateWindowDays)));
    const matchLimit = Math.max(10, Math.min(500, Math.floor(args.matchLimit)));
    const selectedSports = args.selectedSports.length > 0 ? args.selectedSports : ["1"];
    const settings = await getOrCreateSettings(ctx, now);

    await ctx.db.patch(settings._id, {
      enabled: args.enabled,
      cadenceMinutes,
      dateWindowDays,
      selectedSports,
      matchLimit,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const triggerNow = mutation({
  args: {
    dateWindowDays: v.number(),
    selectedSports: v.array(v.string()),
    matchLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await getOrCreateSettings(ctx, now);
    await ctx.scheduler.runAfter(0, internal.scraper.runScrape, {
      triggeredBy: "admin",
      dateWindowDays: args.dateWindowDays,
      selectedSports: args.selectedSports,
      matchLimit: args.matchLimit,
    });
    return { success: true };
  },
});

export const getSettingsForAction = internalQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("scraperSettings")
      .withIndex("by_source", (q) => q.eq("source", KWIKBET_SOURCE))
      .unique();

    return {
      source: KWIKBET_SOURCE,
      enabled: settings?.enabled ?? true,
      cadenceMinutes: settings?.cadenceMinutes ?? DEFAULT_CADENCE_MINUTES,
      dateWindowDays: settings?.dateWindowDays ?? DEFAULT_DATE_WINDOW_DAYS,
      selectedSports: settings?.selectedSports ?? ["1"],
      matchLimit: settings?.matchLimit ?? DEFAULT_PAGE_LIMIT,
    };
  },
});

export const checkAndSchedule = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Deprecated: Cron job removed - scraper runs on-demand via button click
    return { scheduled: false };
  },
});

export const startRun = internalMutation({
  args: {
    triggeredBy: v.string(),
    dateFrom: v.string(),
    dateTo: v.string(),
    selectedSports: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await getOrCreateSettings(ctx, now);

    return await ctx.db.insert("scrapeRuns", {
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
  },
});

export const upsertMatchDetail = internalMutation({
  args: {
    runId: v.id("scrapeRuns"),
    match: normalizedMatchValidator,
    markets: v.array(normalizedMarketValidator),
    odds: v.array(normalizedOddValidator),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Batch read all existing data upfront to avoid hitting the read limit
    const existingMatch = await ctx.db
      .query("sportsMatches")
      .withIndex("by_source_and_sourceMatchId", (q) =>
        q.eq("source", args.match.source).eq("sourceMatchId", args.match.sourceMatchId)
      )
      .unique();

    // Batch read existing markets for this match
    const existingMarkets = await ctx.db
      .query("sportsMarkets")
      .withIndex("by_sourceMatchId_and_marketKey", (q) =>
        q.eq("sourceMatchId", args.match.sourceMatchId)
      )
      .collect();

    const marketKeyMap = new Map(
      existingMarkets.map(m => [m.marketKey, m])
    );

    // Batch read existing odds - limit to prevent read overflow
    const existingOdds = await ctx.db
      .query("sportsOdds")
      .withIndex("by_sourceMatchId", (q) =>
        q.eq("sourceMatchId", args.match.sourceMatchId)
      )
      .collect();

    const oddIdMap = new Map(
      existingOdds.map(o => [o.sourceOddId, o])
    );

    // Upsert match
    const matchDoc = { ...args.match, lastScrapedAt: now };
    if (existingMatch) {
      await ctx.db.replace(existingMatch._id, matchDoc);
    } else {
      await ctx.db.insert("sportsMatches", matchDoc);
    }

    // Upsert markets using the map
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

    // Upsert odds using the map
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

export const noteDiscovery = internalMutation({
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

export const noteMatchFailure = internalMutation({
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

export const finishRun = internalMutation({
  args: {
    runId: v.id("scrapeRuns"),
    status: v.string(),
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

    return null;
  },
});

export const updateRunStats = internalMutation({
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

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
) {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results;
}

export const runScrape = internalAction({
  args: {
    triggeredBy: v.string(),
    dateWindowDays: v.number(),
    selectedSports: v.array(v.string()),
    matchLimit: v.number(),
  },
  handler: async (ctx, args) => {
    const logs: string[] = [];

    const addLog = (message: string) => {
      logs.push(message);
    };

    const window = dateWindow(args.dateWindowDays);
    const sportIds = mapSportsToIds(args.selectedSports);
    const runId: Id<"scrapeRuns"> = await ctx.runMutation(internal.scraper.startRun, {
      triggeredBy: args.triggeredBy,
      dateFrom: window.dateFrom,
      dateTo: window.dateTo,
      selectedSports: args.selectedSports.map(String),
    });

    const sportNames = args.selectedSports
      .map(s => {
        const id = Number(s);
        const sport = AVAILABLE_SPORTS.find(sp => sp.id === id);
        return sport?.label || String(s);
      })
      .join(", ");

    addLog(`[INFO] Starting run ${runId} for: ${sportNames}`);

    try {
      const discovered = new Map<string, unknown>();

      addLog(`[INFO] Fetching matches from ${window.dateFrom} to ${window.dateTo}`);

      for (const date of window.dates) {
        const pageMatches = await kwikbetAdapter.fetchMatchPages({
          date,
          live: false,
          limit: args.matchLimit,
          maxPages: DEFAULT_MAX_PAGES,
          sportIds,
        });

        addLog(`[INFO] ${date}: found ${pageMatches.length} matches`);

        for (const match of pageMatches) {
          const normalized = kwikbetAdapter.normalizeMatch(match);
          discovered.set(normalized.sourceMatchId, match);
        }
      }

      const sourceMatchIds = Array.from(discovered.keys());
      await ctx.runMutation(internal.scraper.noteDiscovery, {
        runId,
        matchesDiscovered: sourceMatchIds.length,
      });

      addLog(`[SUCCESS] Discovered ${sourceMatchIds.length} total matches. Fetching details...`);

      let successCount = 0;
      let failureCount = 0;
      let totalMarketsUpserted = 0;
      let totalOddsUpserted = 0;

      await mapConcurrent(sourceMatchIds, DETAIL_CONCURRENCY, async (sourceMatchId) => {
        try {
          const detail = await kwikbetAdapter.fetchMatchDetails(sourceMatchId);
          const normalized = kwikbetAdapter.normalizeDetail(detail);

          const result = await ctx.runMutation(internal.scraper.upsertMatchDetail, {
            runId,
            match: normalized.match,
            markets: normalized.markets,
            odds: normalized.odds,
          });

          successCount++;
          totalMarketsUpserted += result.marketsUpserted;
          totalOddsUpserted += result.oddsUpserted;
        } catch (error) {
          failureCount++;
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          addLog(`[ERROR] Failed ${sourceMatchId}: ${errorMsg}`);
          await ctx.runMutation(internal.scraper.noteMatchFailure, {
            runId,
          });
        }
      });

      // Batch update the run stats once at the end to avoid OCC conflicts
      await ctx.runMutation(internal.scraper.updateRunStats, {
        runId,
        matchesUpserted: successCount,
        marketsUpserted: totalMarketsUpserted,
        oddsUpserted: totalOddsUpserted,
      });

      addLog(`[SUCCESS] Done: ${successCount} succeeded, ${failureCount} failed`);

      await ctx.runMutation(internal.scraper.finishRun, {
        runId,
        status: "success",
      });

      return { runId, logs };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown scrape error";
      addLog(`[ERROR] Run failed: ${errorMsg}`);
      await ctx.runMutation(internal.scraper.finishRun, {
        runId,
        status: "failed",
      });
      return { runId, logs };
    }
  },
});
