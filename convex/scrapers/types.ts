export type NormalizedMatch = {
  source: string;
  sourceMatchId: string;
  homeTeam: string;
  awayTeam: string;
  startTime: number;
  startTimeIso: string;
  sportId: number;
  sportName: string;
  sportSlug: string;
  competitionId: string;
  competitionName: string;
  competitionPriority: number;
  countryCode: string;
  countryName: string;
  result: string;
  status: number;
  statusDesc: string;
  isLive: boolean;
  producerState: number;
  priority: number;
  totalMarkets: number;
  mainMarketId: string;
  mainMarketName: string;
  mainMarketOutcomes: string;
  hasJenga: boolean;
};

export type NormalizedMarket = {
  source: string;
  sourceMatchId: string;
  marketKey: string;
  subTypeId: number;
  name: string;
  marketType: string;
  marketTypes: string[];
  oddsCount: number;
  marketPriority: number;
  hasActiveOdds: boolean;
};

export type NormalizedOdd = {
  source: string;
  sourceOddId: string;
  sourceMatchId: string;
  marketKey: string;
  subTypeId: number;
  outcomeId: string;
  specifiers: string;
  outcomeName: string;
  outcomeAlias: string;
  marketName: string;
  marketType: string;
  marketPriority: number;
  marketNameTemplate: string;
  marketStatus: number;
  status: number;
  oddValue: number;
  prevOddValue: number;
  outcomeDef: string;
  probabilityValue: number;
  priority: number;
  confirmed: number;
  isPlayer: number;
  sourceCreatedAt: string | null;
  sourceModifiedAt: string | null;
};

export type NormalizedMatchDetail = {
  match: NormalizedMatch;
  markets: NormalizedMarket[];
  odds: NormalizedOdd[];
};

export type ScraperAdapter = {
  sourceKey: string;
  fetchMatchPages(args: {
    date: string;
    live: boolean;
    limit: number;
    maxPages: number;
    sportIds?: number[];
  }): Promise<unknown[]>;
  fetchMatchDetails(sourceMatchId: string): Promise<unknown>;
  normalizeMatch(payload: unknown): NormalizedMatch;
  normalizeMarkets(payload: unknown): NormalizedMarket[];
  normalizeOdds(payload: unknown): NormalizedOdd[];
  normalizeDetail(payload: unknown): NormalizedMatchDetail;
};
