import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"
import { api } from "./_generated/api"
import schema from "./schema"

declare global {
  interface ImportMeta {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>
  }
}

const modules = import.meta.glob("./**/*.ts")

describe("custom event preconfiguration", () => {
  test("creates every custom event with the required markets and odds", async () => {
    const t = convexTest(schema, modules)

    const eventId = await t.mutation(api.customEvents.createCustomEvent, {
      title: "Home vs Away",
      homeTeam: "Home",
      awayTeam: "Away",
      startTime: Date.parse("2026-07-01T12:00:00.000Z"),
      sport: "football",
      competition: "Custom League",
    })

    const event = await t.query(api.customEvents.getCustomEvent, { eventId })
    const markets = await t.query(api.customEvents.listCustomMarkets, {
      eventId,
    })
    const odds = await t.query(api.customEvents.listCustomOddsByEvent, {
      eventId,
    })

    expect(event?.totalMarkets).toBe(14)
    expect(event?.homeScore).toBe(0)
    expect(event?.awayScore).toBe(0)
    expect(markets).toHaveLength(14)
    expect(odds).toHaveLength(93)
    expect(markets.map((market) => market.name)).toEqual([
      "1X2",
      "1ST GOAL",
      "DOUBLE CHANCE",
      "DRAW NO BET",
      "TOTAL",
      "BOTH TEAMS TO SCORE",
      "1X2 & BOTH TEAMS TO SCORE",
      "1X2 & TOTAL",
      "HALFTIME/FULLTIME",
      "1ST HALF - 1X2",
      "1ST HALF - TOTAL",
      "1ST HALF - BOTH TEAMS TO SCORE",
      "1ST HALF - CORRECT SCORE",
      "CORRECT SCORE",
    ])

    const oneXTwo = markets.find((market) => market.name === "1X2")
    const correctScore = markets.find(
      (market) => market.name === "CORRECT SCORE"
    )

    expect(oneXTwo).toBeDefined()
    expect(correctScore).toBeDefined()

    const oneXTwoOdds = await t.query(api.customEvents.listCustomOdds, {
      marketId: oneXTwo!._id,
    })
    const correctScoreOdds = await t.query(api.customEvents.listCustomOdds, {
      marketId: correctScore!._id,
    })

    expect(
      oneXTwoOdds.map((odd) => ({
        outcomeName: odd.outcomeName,
        oddValue: odd.oddValue,
      }))
    ).toEqual([
      { outcomeName: "1", oddValue: 2.45 },
      { outcomeName: "X", oddValue: 3.3 },
      { outcomeName: "2", oddValue: 2.9 },
    ])
    expect(correctScoreOdds.at(-1)).toMatchObject({
      outcomeName: "OTHER",
      oddValue: 30.74,
    })
  })

  test("supports score updates and unpublishing", async () => {
    const t = convexTest(schema, modules)

    const eventId = await t.mutation(api.customEvents.createCustomEvent, {
      title: "Home vs Away",
      homeTeam: "Home",
      awayTeam: "Away",
      startTime: Date.parse("2026-07-01T12:00:00.000Z"),
      sport: "football",
      competition: "Custom League",
    })

    await t.mutation(api.customEvents.updateCustomEventScore, {
      eventId,
      homeScore: 2,
      awayScore: 1,
    })

    let event = await t.query(api.customEvents.getCustomEvent, { eventId })
    expect(event).toMatchObject({ homeScore: 2, awayScore: 1 })

    await t.mutation(api.customEvents.publishCustomEvent, { eventId })
    event = await t.query(api.customEvents.getCustomEvent, { eventId })
    expect(event?.status).toBe("published")

    await t.mutation(api.customEvents.unpublishCustomEvent, { eventId })
    event = await t.query(api.customEvents.getCustomEvent, { eventId })
    expect(event?.status).toBe("draft")
  })
})
