import { describe, expect, test } from "vitest";
import {
  normalizeKwikbetMatch,
  normalizeKwikbetMarkets,
  normalizeKwikbetOdds,
} from "./kwikbet";

const fixture = {
  parent_match_id: 72010132,
  home_team: "UD Levante SRL",
  away_team: "Sheriff Tiraspol Srl",
  start_time: "2026-06-17T07:00:00Z",
  sport_id: 1,
  sport_name: "Soccer",
  competition_id: 36215,
  competition_name: "SRL Club Friendlies",
  competition_priority: 0,
  country_code: "ITL",
  country_name: "Internationals",
  result: "0:0",
  status: 0,
  status_desc: "Starts soon",
  producer_state: 1,
  priority: 0,
  total_markets: 47,
  main_market_id: 1,
  main_market_name: "1X2",
  main_market_outcomes: "1,2,3",
  has_jenga: true,
  markets: [
    {
      parent_match_id: 72010132,
      sub_type_id: 1,
      name: "1x2",
      market_type: "Main",
      odds_count: 0,
      market_priority: 0,
      odds: [
        {
          event_odd_id: 7401574358,
          parent_match_id: 72010132,
          sub_type_id: 1,
          outcome_id: "1",
          specifiers: "",
          outcome_name: "1",
          outcome_alias: "UD Levante SRL",
          market_type: "Main",
          market_name: "1x2",
          market_priority: 0,
          market_name_template: "1x2",
          market_status: 1,
          status: 1,
          odd_value: 1.49,
          prev_odd_value: 1.48,
          outcome_def: "{$competitor1}",
          probability_value: 0.5,
          priority: 1,
          confirmed: 0,
          is_player: 3,
          created: "2026-06-16T11:40:14.633209Z",
          modified: "2026-06-16T19:01:03.629432Z",
        },
      ],
    },
    {
      parent_match_id: 72010132,
      sub_type_id: 18,
      name: "Total goals",
      market_type: "Main,Goals",
      odds_count: 0,
      market_priority: 3,
      odds: [
        {
          event_odd_id: 7401581448,
          parent_match_id: 72010132,
          sub_type_id: 18,
          outcome_id: "12",
          specifiers: "total=2.5",
          outcome_name: "over 2.5",
          outcome_alias: "over 2.5",
          market_type: "Main,Goals",
          market_name: "Total goals",
          market_priority: 3,
          market_name_template: "Total",
          market_status: 1,
          status: 1,
          odd_value: 1.39,
          prev_odd_value: 1.39,
          outcome_def: "over {total}",
          probability_value: 0.5,
          priority: 5,
          confirmed: 0,
          is_player: 3,
        },
      ],
    },
  ],
};

describe("KwikBet normalization", () => {
  test("normalizes a soccer match into the app sport slug", () => {
    const match = normalizeKwikbetMatch(fixture);

    expect(match.source).toBe("kwikbet");
    expect(match.sourceMatchId).toBe("72010132");
    expect(match.sportSlug).toBe("football");
    expect(match.startTime).toBe(Date.parse("2026-06-17T07:00:00Z"));
  });

  test("preserves market categories and stable market keys", () => {
    const markets = normalizeKwikbetMarkets(fixture);

    expect(markets).toHaveLength(2);
    expect(markets[0]).toMatchObject({
      sourceMatchId: "72010132",
      marketKey: "72010132:1:1x2:main",
      marketTypes: ["Main"],
      hasActiveOdds: true,
    });
    expect(markets[1].marketTypes).toEqual(["Main", "Goals"]);
  });

  test("normalizes odds with specifiers and source timestamps", () => {
    const odds = normalizeKwikbetOdds(fixture);

    expect(odds).toHaveLength(2);
    expect(odds[0]).toMatchObject({
      sourceOddId: "7401574358",
      oddValue: 1.49,
      prevOddValue: 1.48,
      sourceCreatedAt: "2026-06-16T11:40:14.633209Z",
    });
    expect(odds[1]).toMatchObject({
      marketKey: "72010132:18:total-goals:main,goals",
      specifiers: "total=2.5",
      outcomeName: "over 2.5",
    });
  });
});
