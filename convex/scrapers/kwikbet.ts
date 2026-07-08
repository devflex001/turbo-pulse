import type {
  NormalizedMarket,
  NormalizedMatch,
  NormalizedOdd,
  ScraperAdapter,
} from "./types";
import { circuitBreakers } from "../utils/circuitBreaker";

export const KWIKBET_SOURCE = "kwikbet";

const BASE_URL = "https://sports-api.kwikbet.co.ke/v2";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function parseTime(value: unknown): number {
  const text = asString(value);
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sportSlug(sportName: string, sportId: number): string {
  const normalized = sportName.trim().toLowerCase();
  if (normalized === "soccer" || sportId === 1) return "football";
  return normalized.replace(/\s+/g, "-") || "unknown";
}

function marketTypes(marketType: string): string[] {
  return marketType
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function marketKey(matchId: string, market: JsonRecord): string {
  const subTypeId = asNumber(market.sub_type_id);
  const name = asString(market.name || market.market_name).toLowerCase();
  const type = asString(market.market_type).toLowerCase();
  return `${matchId}:${subTypeId}:${name}:${type}`.replace(/\s+/g, "-");
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url: string, page?: number): Promise<unknown> {
  let lastError: unknown = null;
  const pageNum = page ?? 1;
  const breaker = circuitBreakers.kwikbet;

  // Check if circuit is open
  if (breaker.isOpen()) {
    const state = breaker.getState();
    console.error(
      `[KWIKBET CIRCUIT] Circuit is ${state.state}, rejecting request for page ${pageNum}`
    );
    throw new Error(
      `KwikBet circuit breaker is open (${state.failureCount}/3 failures) - service temporarily unavailable`
    );
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      console.log(`[KWIKBET] Fetching page ${pageNum}, attempt ${attempt + 1}/3: ${url}`);

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorMsg = `KwikBet request failed ${response.status} ${response.statusText}`;
        console.error(
          `[KWIKBET ERROR] Page ${pageNum}, attempt ${attempt + 1}/3: ${errorMsg}. URL: ${url}`
        );

        // Log response headers for 5xx errors to help diagnose
        if (response.status >= 500) {
          console.error(
            `[KWIKBET 5XX] Response headers:`,
            Object.fromEntries(response.headers.entries())
          );
          const bodyText = await response.text().catch(() => "(unable to read body)");
          console.error(`[KWIKBET 5XX] Response body: ${bodyText.substring(0, 200)}`);

          // Record failure for circuit breaker on 5xx
          breaker.recordFailure();
        }

        throw new Error(errorMsg);
      }

      console.log(`[KWIKBET SUCCESS] Page ${pageNum} fetched successfully`);

      // Record success - resets failure count if in CLOSED, increments recovery if HALF_OPEN
      breaker.recordSuccess();

      return await response.json();
    } catch (error) {
      lastError = error;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[KWIKBET RETRY] Page ${pageNum}: ${errorMsg}`);

      if (attempt < 2) {
        const delayMs = 250 * 2 ** attempt;
        console.log(`[KWIKBET] Retrying page ${pageNum} in ${delayMs}ms...`);
        await sleep(delayMs);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  // All retries exhausted - record failure for circuit breaker
  breaker.recordFailure();

  const finalError = lastError instanceof Error ? lastError.message : String(lastError);
  console.error(
    `[KWIKBET FAILED] Page ${pageNum} failed after 3 attempts. Last error: ${finalError}`
  );

  throw lastError instanceof Error ? lastError : new Error("KwikBet request failed");
}

export function normalizeKwikbetMatch(payload: unknown): NormalizedMatch {
  if (!isRecord(payload)) {
    throw new Error("Invalid KwikBet match payload");
  }

  const sourceMatchId = asString(payload.parent_match_id);
  if (!sourceMatchId) {
    throw new Error("KwikBet match payload missing parent_match_id");
  }

  const sportId = asNumber(payload.sport_id);
  const sportName = asString(payload.sport_name);
  const status = asNumber(payload.status);

  return {
    source: KWIKBET_SOURCE,
    sourceMatchId,
    homeTeam: asString(payload.home_team),
    awayTeam: asString(payload.away_team),
    startTime: parseTime(payload.start_time),
    startTimeIso: asString(payload.start_time),
    sportId,
    sportName,
    sportSlug: sportSlug(sportName, sportId),
    competitionId: asString(payload.competition_id),
    competitionName: asString(payload.competition_name),
    competitionPriority: asNumber(payload.competition_priority),
    countryCode: asString(payload.country_code),
    countryName: asString(payload.country_name),
    result: asString(payload.result),
    status,
    statusDesc: asString(payload.status_desc),
    isLive: status === 1 || asString(payload.status_desc).toLowerCase().includes("live"),
    producerState: asNumber(payload.producer_state),
    priority: asNumber(payload.priority),
    totalMarkets: asNumber(payload.total_markets),
    mainMarketId: asString(payload.main_market_id),
    mainMarketName: asString(payload.main_market_name),
    mainMarketOutcomes: asString(payload.main_market_outcomes),
    hasJenga: asBoolean(payload.has_jenga),
  };
}

export function normalizeKwikbetMarkets(payload: unknown): NormalizedMarket[] {
  if (!isRecord(payload)) return [];

  const sourceMatchId = asString(payload.parent_match_id);
  return asArray(payload.markets)
    .filter(isRecord)
    .map((market) => {
      const odds = asArray(market.odds).filter(isRecord);
      const marketType = asString(market.market_type);

      return {
        source: KWIKBET_SOURCE,
        sourceMatchId,
        marketKey: marketKey(sourceMatchId, market),
        subTypeId: asNumber(market.sub_type_id),
        name: asString(market.name || market.market_name),
        marketType,
        marketTypes: marketTypes(marketType),
        oddsCount: odds.length || asNumber(market.odds_count),
        marketPriority: asNumber(market.market_priority),
        hasActiveOdds: odds.some((odd) => asNumber(odd.status) === 1 && asNumber(odd.market_status) === 1),
      };
    });
}

export function normalizeKwikbetOdds(payload: unknown): NormalizedOdd[] {
  if (!isRecord(payload)) return [];

  const sourceMatchId = asString(payload.parent_match_id);
  const odds: NormalizedOdd[] = [];

  for (const market of asArray(payload.markets).filter(isRecord)) {
    const key = marketKey(sourceMatchId, market);

    for (const odd of asArray(market.odds).filter(isRecord)) {
      const sourceOddId = asString(odd.event_odd_id);
      if (!sourceOddId) continue;

      odds.push({
        source: KWIKBET_SOURCE,
        sourceOddId,
        sourceMatchId,
        marketKey: key,
        subTypeId: asNumber(odd.sub_type_id || market.sub_type_id),
        outcomeId: asString(odd.outcome_id),
        specifiers: asString(odd.specifiers),
        outcomeName: asString(odd.outcome_name),
        outcomeAlias: asString(odd.outcome_alias),
        marketName: asString(odd.market_name || market.name),
        marketType: asString(odd.market_type || market.market_type),
        marketPriority: asNumber(odd.market_priority || market.market_priority),
        marketNameTemplate: asString(odd.market_name_template),
        marketStatus: asNumber(odd.market_status),
        status: asNumber(odd.status),
        oddValue: asNumber(odd.odd_value),
        prevOddValue: asNumber(odd.prev_odd_value),
        outcomeDef: asString(odd.outcome_def),
        probabilityValue: asNumber(odd.probability_value),
        priority: asNumber(odd.priority),
        confirmed: asNumber(odd.confirmed),
        isPlayer: asNumber(odd.is_player),
        sourceCreatedAt: asString(odd.created) || null,
        sourceModifiedAt: asString(odd.modified) || null,
      });
    }
  }

  return odds;
}

export const kwikbetAdapter: ScraperAdapter = {
  sourceKey: KWIKBET_SOURCE,
  async fetchMatchPages({ date, live, limit, maxPages, sportIds }) {
    const matches: unknown[] = [];
    console.log(
      `[KWIKBET FETCH] Starting fetch for ${maxPages} pages (limit: ${limit}). Date: ${date}, Live: ${live}, Sports: ${sportIds.join(",")}`
    );

    for (let page = 1; page <= maxPages; page++) {
      // Stop if we've already reached the limit
      if (matches.length >= limit) {
        console.log(`[KWIKBET FETCH] Reached match limit (${limit}), stopping pagination`);
        break;
      }

      const params = new URLSearchParams({
        sport_id: sportIds ? sportIds.join(",") : "1",
        sort_by: "start_time",
        date,
        live: live ? "true" : "false",
        limit: String(limit),
        page: String(page),
      });

      try {
        const url = `${BASE_URL}/matches?${params.toString()}`;
        const payload = await fetchJsonWithRetry(url, page);
        const pageMatches = asArray(payload);

        console.log(`[KWIKBET FETCH] Page ${page}: Got ${pageMatches.length} matches`);

        if (pageMatches.length === 0) {
          console.log(`[KWIKBET FETCH] Page ${page} returned 0 matches, stopping pagination`);
          break;
        }

        matches.push(...pageMatches);

        // Only keep up to the limit
        if (matches.length >= limit) {
          console.log(`[KWIKBET FETCH] Collected enough matches (${matches.length}), returning`);
          return matches.slice(0, limit);
        }

        if (pageMatches.length < limit) {
          console.log(
            `[KWIKBET FETCH] Page ${page} returned fewer than limit (${pageMatches.length} < ${limit}), stopping pagination`
          );
          break;
        }
      } catch (error) {
        console.error(`[KWIKBET FETCH] Error on page ${page}:`, error);
        // If it's a 5xx error, log and break to avoid hammering a down service
        if (error instanceof Error && error.message.includes("5")) {
          console.error(
            `[KWIKBET FETCH] 5xx error detected, stopping pagination to avoid service strain`
          );
          break;
        }
        // For other errors, continue to next page
      }
    }

    console.log(`[KWIKBET FETCH] Completed: ${matches.length} total matches collected`);
    return matches;
  },
  async fetchMatchDetails(sourceMatchId) {
    return await fetchJsonWithRetry(`${BASE_URL}/matches/${encodeURIComponent(sourceMatchId)}`);
  },
  normalizeMatch: normalizeKwikbetMatch,
  normalizeMarkets: normalizeKwikbetMarkets,
  normalizeOdds: normalizeKwikbetOdds,
  normalizeDetail(payload) {
    return {
      match: normalizeKwikbetMatch(payload),
      markets: normalizeKwikbetMarkets(payload),
      odds: normalizeKwikbetOdds(payload),
    };
  },
};
