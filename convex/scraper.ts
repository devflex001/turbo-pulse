import { getAuthUserId } from "@convex-dev/auth/server";
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

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const admin = await ctx.db
    .query("admins")
    .withIndex("by_userId", (q) => q.eq("userId", userId as Id<"users">))
    .unique();

  if (!admin) throw new Error("Not authorized: admin access required");
  return admin;
}

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
    await requireAdmin(ctx);

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
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const cadenceMinutes = Math.max(1, Math.min(120, Math.floor(args.cadenceMinutes)));
    const dateWindowDays = Math.max(1, Math.min(14, Math.floor(args.dateWindowDays)));
    const settings = await getOrCreateSettings(ctx, now);

    await ctx.db.patch(settings._id, {
      enabled: args.enabled,
      cadenceMinutes,
      dateWindowDays,
      nextRunAt: args.enabled ? now + cadenceMinutes * 60_000 : settings.nextRunAt,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const triggerNow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    await getOrCreateSettings(ctx, now);
    await ctx.scheduler.runAfter(0, internal.scraper.runScrape, {
      triggeredBy: "admin",
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
    };
  },
});

export const checkAndSchedule = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const settings = await getOrCreateSettings(ctx, now);
    if (!settings.enabled || settings.nextRunAt > now) {
      return { scheduled: false };
    }

    const running = await ctx.db
      .query("scrapeRuns")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .take(1);

    if (running.length > 0) {
      await ctx.db.patch(settings._id, {
        nextRunAt: now + Math.max(1, settings.cadenceMinutes) * 60_000,
        updatedAt: now,
      });
      return { scheduled: false };
    }

    await ctx.db.patch(settings._id, {
      nextRunAt: now + Math.max(1, settings.cadenceMinutes) * 60_000,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.scraper.runScrape, {
      triggeredBy: "cron",
    });
    return { scheduled: true };
  },
});

export const startRun = internalMutation({
  args: {
    triggeredBy: v.string(),
    dateFrom: v.string(),
    dateTo: v.string(),
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
      matchesDiscovered: 0,
      matchesUpserted: 0,
      marketsUpserted: 0,
      oddsUpserted: 0,
      failedMatches: 0,
      errorSummary: null,
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
    const existingMatch = await ctx.db
      .query("sportsMatches")
      .withIndex("by_source_and_sourceMatchId", (q) =>
        q.eq("source", args.match.source).eq("sourceMatchId", args.match.sourceMatchId)
      )
      .unique();

    const matchDoc = { ...args.match, lastScrapedAt: now };
    if (existingMatch) {
      await ctx.db.replace(existingMatch._id, matchDoc);
    } else {
      await ctx.db.insert("sportsMatches", matchDoc);
    }

    let marketsUpserted = 0;
    for (const market of args.markets) {
      const existingMarket = await ctx.db
        .query("sportsMarkets")
        .withIndex("by_sourceMatchId_and_marketKey", (q) =>
          q.eq("sourceMatchId", market.sourceMatchId).eq("marketKey", market.marketKey)
        )
        .unique();
      const marketDoc = { ...market, lastScrapedAt: now };
      if (existingMarket) {
        await ctx.db.replace(existingMarket._id, marketDoc);
      } else {
        await ctx.db.insert("sportsMarkets", marketDoc);
      }
      marketsUpserted++;
    }

    let oddsUpserted = 0;
    for (const odd of args.odds) {
      const existingOdd = await ctx.db
        .query("sportsOdds")
        .withIndex("by_sourceOddId", (q) => q.eq("sourceOddId", odd.sourceOddId))
        .unique();
      const oddDoc = { ...odd, lastScrapedAt: now };
      if (existingOdd) {
        await ctx.db.replace(existingOdd._id, oddDoc);
      } else {
        await ctx.db.insert("sportsOdds", oddDoc);
      }
      oddsUpserted++;
    }

    const run = await ctx.db.get(args.runId);
    if (run) {
      await ctx.db.patch(args.runId, {
        matchesUpserted: run.matchesUpserted + 1,
        marketsUpserted: run.marketsUpserted + marketsUpserted,
        oddsUpserted: run.oddsUpserted + oddsUpserted,
      });
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
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) return null;

    const current = run.errorSummary ?? "";
    const nextError = current
      ? `${current}\n${args.message}`.slice(0, 2000)
      : args.message.slice(0, 2000);

    await ctx.db.patch(args.runId, {
      failedMatches: run.failedMatches + 1,
      errorSummary: nextError,
    });
    return null;
  },
});

export const finishRun = internalMutation({
  args: {
    runId: v.id("scrapeRuns"),
    status: v.string(),
    errorSummary: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const run = await ctx.db.get(args.runId);
    if (!run) return null;

    await ctx.db.patch(args.runId, {
      status: args.status,
      finishedAt: now,
      durationMs: now - run.startedAt,
      errorSummary: args.errorSummary ?? run.errorSummary,
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
  },
  handler: async (ctx, args) => {
    const settings: {
      dateWindowDays: number;
    } = await ctx.runQuery(internal.scraper.getSettingsForAction, {});
    const window = dateWindow(settings.dateWindowDays);
    const runId: Id<"scrapeRuns"> = await ctx.runMutation(internal.scraper.startRun, {
      triggeredBy: args.triggeredBy,
      dateFrom: window.dateFrom,
      dateTo: window.dateTo,
    });

    try {
      const discovered = new Map<string, unknown>();

      for (const date of window.dates) {
        const pageMatches = await kwikbetAdapter.fetchMatchPages({
          date,
          live: false,
          limit: DEFAULT_PAGE_LIMIT,
          maxPages: DEFAULT_MAX_PAGES,
        });

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

      await mapConcurrent(sourceMatchIds, DETAIL_CONCURRENCY, async (sourceMatchId) => {
        try {
          const detail = await kwikbetAdapter.fetchMatchDetails(sourceMatchId);
          const normalized = kwikbetAdapter.normalizeDetail(detail);
          await ctx.runMutation(internal.scraper.upsertMatchDetail, {
            runId,
            match: normalized.match,
            markets: normalized.markets,
            odds: normalized.odds,
          });
        } catch (error) {
          await ctx.runMutation(internal.scraper.noteMatchFailure, {
            runId,
            message: `${sourceMatchId}: ${
              error instanceof Error ? error.message : "Unknown scrape error"
            }`,
          });
        }
      });

      await ctx.runMutation(internal.scraper.finishRun, {
        runId,
        status: "success",
        errorSummary: null,
      });
    } catch (error) {
      await ctx.runMutation(internal.scraper.finishRun, {
        runId,
        status: "failed",
        errorSummary: error instanceof Error ? error.message : "Unknown scrape error",
      });
    }

    return { runId };
  },
});
