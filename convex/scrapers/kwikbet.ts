import type {
  NormalizedMarket,
  NormalizedMatch,
  NormalizedOdd,
  ScraperAdapter,
} from "./types";

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

async function fetchJsonWithRetry(url: string): Promise<unknown> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`KwikBet request failed ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await sleep(250 * 2 ** attempt);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

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

    for (let page = 1; page <= maxPages; page++) {
      const params = new URLSearchParams({
        sport_id: sportIds ? sportIds.join(",") : "1",
        sort_by: "start_time",
        date,
        live: live ? "true" : "false",
        limit: String(limit),
        page: String(page),
      });
      const payload = await fetchJsonWithRetry(`${BASE_URL}/matches?${params.toString()}`);
      const pageMatches = asArray(payload);
      if (pageMatches.length === 0) break;
      matches.push(...pageMatches);
      if (pageMatches.length < limit) break;
    }

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
