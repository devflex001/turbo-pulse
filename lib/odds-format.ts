type OddLike = {
  marketKey?: string
  marketName?: string
  outcomeId?: string
  outcomeName?: string
  outcomeAlias?: string
}

type MatchLike = {
  homeTeam: string
  awayTeam: string
}

function compact(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

export function formatOddSpecifier(specifiers: string) {
  return specifiers
    .split(/[|,;&]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !part.toLowerCase().startsWith("variant="))
    .join(" ")
}

function isOneXTwoMarket(odd: OddLike) {
  const marketName = compact(odd.marketName ?? "")
  const marketKey = compact(odd.marketKey ?? "")
  return (
    marketName === "1x2" ||
    marketKey.includes("1x2") ||
    marketName.includes("matchwinner") ||
    marketName.includes("matchresult") ||
    marketName.includes("3wayresult") ||
    marketName.includes("threewayresult") ||
    marketName.includes("fulltimeresult")
  )
}

function inferOneXTwoCode(odd: OddLike, match: MatchLike) {
  const values = [odd.outcomeAlias, odd.outcomeName, odd.outcomeId]
    .filter(Boolean)
    .map((value) => compact(value ?? ""))

  if (values.some((value) => value === "1" || value === "home")) return "1"
  if (values.some((value) => value === "x" || value === "draw")) return "X"
  if (values.some((value) => value === "2" || value === "away")) return "2"

  const home = compact(match.homeTeam)
  const away = compact(match.awayTeam)

  if (values.some((value) => value === home || value.includes(home))) {
    return "1"
  }

  if (values.some((value) => value === away || value.includes(away))) {
    return "2"
  }

  return null
}

export function compareFormattedOdds(a: OddLike, b: OddLike, match: MatchLike) {
  const order = new Map([
    ["1", 1],
    ["X", 2],
    ["2", 3],
  ])

  const aOrder = order.get(formatOddOutcome(a, match).code)
  const bOrder = order.get(formatOddOutcome(b, match).code)

  if (aOrder && bOrder) return aOrder - bOrder
  if (aOrder) return -1
  if (bOrder) return 1

  return 0
}

export function shouldShowOddSpecifier(specifiers: string, label: string) {
  if (!specifiers.trim()) return false

  const visibleSpecifiers = formatOddSpecifier(specifiers)

  if (!visibleSpecifiers) return false

  const normalizedLabel = compact(label)
  const normalizedSpecifiers = compact(visibleSpecifiers)
  const scoreValues = Array.from(visibleSpecifiers.matchAll(/(?:^|[|,;&\s])score=([^|,;&\s]+)/gi))
    .map((match) => compact(match[1] ?? ""))
    .filter(Boolean)

  if (!normalizedLabel) return true
  if (scoreValues.length > 0 && scoreValues.every((value) => normalizedLabel.includes(value))) {
    return false
  }
  if (normalizedLabel.includes(normalizedSpecifiers)) return false

  const values = specifiers
    .split(/[|,;&]/)
    .filter((part) => !part.trim().toLowerCase().startsWith("variant="))
    .map((part) => part.split("=").pop()?.trim() ?? "")
    .filter(Boolean)
    .map(compact)

  if (values.length > 0 && values.every((value) => normalizedLabel.includes(value))) {
    return false
  }

  return true
}

export function formatMarketName(
  market: { subTypeId?: number; name: string },
  match: MatchLike
) {
  const subTypeId = market.subTypeId
  const name = market.name

  if (!subTypeId) return name.toUpperCase()

  const cleanTemplates: Record<number, string> = {
    1: "MATCH RESULT",
    10: "DOUBLE CHANCE",
    11: "DRAW NO BET",
    12: "{$competitor1} NO BET",
    13: "{$competitor2} NO BET",
    14: "HANDICAP",
    15: "WINNING MARGIN",
    16: "HANDICAP",
    18: "TOTAL GOALS",
    19: "{$competitor1} TOTAL GOALS",
    20: "{$competitor2} TOTAL GOALS",
    21: "EXACT GOALS",
    23: "{$competitor1} EXACT GOALS",
    24: "{$competitor2} EXACT GOALS",
    25: "GOAL RANGE",
    26: "ODD/EVEN",
    27: "{$competitor1} ODD/EVEN",
    28: "{$competitor2} ODD/EVEN",
    29: "BOTH TEAMS TO SCORE",
    30: "WHICH TEAM TO SCORE",
    31: "{$competitor1} CLEAN SHEET",
    32: "{$competitor2} CLEAN SHEET",
    33: "{$competitor1} WIN TO NIL",
    34: "{$competitor2} WIN TO NIL",
    35: "MATCH RESULT & BOTH TEAMS TO SCORE",
    36: "TOTAL & BOTH TEAMS TO SCORE",
    37: "MATCH RESULT & TOTAL",
    41: "CORRECT SCORE",
    47: "HALF TIME / FULL TIME",
    52: "HIGHEST SCORING HALF",
    53: "{$competitor1} HIGHEST SCORING HALF",
    54: "{$competitor2} HIGHEST SCORING HALF",
    56: "{$competitor1} TO SCORE IN BOTH HALVES",
    57: "{$competitor2} TO SCORE IN BOTH HALVES",
    58: "BOTH HALVES OVER GOALS",
    59: "BOTH HALVES UNDER GOALS",
    60: "1ST HALF - 1X2",
    63: "1ST HALF - DOUBLE CHANCE",
    64: "1ST HALF - DRAW NO BET",
    65: "1ST HALF - HANDICAP",
    66: "1ST HALF - HANDICAP",
    68: "1ST HALF - TOTAL GOALS",
    69: "1ST HALF - {$competitor1} TOTAL GOALS",
    70: "1ST HALF - {$competitor2} TOTAL GOALS",
    71: "1ST HALF - EXACT GOALS",
    74: "1ST HALF - ODD/EVEN",
    75: "1ST HALF - BOTH TEAMS TO SCORE",
    76: "1ST HALF - {$competitor1} CLEAN SHEET",
    77: "1ST HALF - {$competitor2} CLEAN SHEET",
    78: "1ST HALF - MATCH RESULT & BOTH TEAMS TO SCORE",
    79: "1ST HALF - MATCH RESULT & TOTAL",
    81: "1ST HALF - CORRECT SCORE",
    83: "2ND HALF - 1X2",
    85: "2ND HALF - DOUBLE CHANCE",
    86: "2ND HALF - DRAW NO BET",
    87: "2ND HALF - HANDICAP",
    88: "2ND HALF - HANDICAP",
    90: "2ND HALF - TOTAL GOALS",
    91: "2ND HALF - {$competitor1} TOTAL GOALS",
    92: "2ND HALF - {$competitor2} TOTAL GOALS",
    93: "2ND HALF - EXACT GOALS",
    94: "2ND HALF - ODD/EVEN",
    95: "2ND HALF - BOTH TEAMS TO SCORE",
    96: "2ND HALF - {$competitor1} CLEAN SHEET",
    97: "2ND HALF - {$competitor2} CLEAN SHEET",
    98: "2ND HALF - CORRECT SCORE",
    166: "TOTAL CORNERS",
    199: "CORRECT SCORE",
    546: "DOUBLE CHANCE & BOTH TEAMS TO SCORE",
    547: "DOUBLE CHANCE & TOTAL",
    548: "MULTIGOALS",
    551: "MULTISCORES"
  }

  let template = cleanTemplates[subTypeId] || name.toUpperCase()

  template = template
    .replace(/\{\$competitor1\}/g, match.homeTeam.toUpperCase())
    .replace(/\{\$competitor2\}/g, match.awayTeam.toUpperCase())

  return template
}

export function formatOddOutcome(odd: OddLike, match: MatchLike) {
  const marketName = compact(odd.marketName ?? "")
  const marketKey = compact(odd.marketKey ?? "")

  if (isOneXTwoMarket(odd)) {
    const code = inferOneXTwoCode(odd, match)
    if (code === "1") return { code, meaning: "Home team wins", isCode: true }
    if (code === "X") return { code, meaning: "Draw", isCode: true }
    if (code === "2") return { code, meaning: "Away team wins", isCode: true }
  }

  const nameLower = (odd.outcomeName || "").toLowerCase().trim()
  const aliasLower = (odd.outcomeAlias || "").toLowerCase().trim()

  // Double chance formatting
  if (
    nameLower === "1 or x" ||
    nameLower === "1 or draw" ||
    nameLower === "1x" ||
    aliasLower === "home or draw" ||
    aliasLower === "1 or x" ||
    aliasLower === "1x"
  ) {
    return { code: "1X", meaning: "Home or Draw", isCode: true }
  }
  if (
    nameLower === "x or 2" ||
    nameLower === "draw or 2" ||
    nameLower === "x2" ||
    aliasLower === "draw or away" ||
    aliasLower === "x or 2" ||
    aliasLower === "x2"
  ) {
    return { code: "X2", meaning: "Draw or Away", isCode: true }
  }
  if (
    nameLower === "1 or 2" ||
    nameLower === "12" ||
    aliasLower === "home or away" ||
    aliasLower === "1 or 2" ||
    aliasLower === "12"
  ) {
    return { code: "12", meaning: "Home or Away", isCode: true }
  }

  // Draw no bet or simple 1 / 2 outcomes in specific markets
  if (
    marketName.includes("drawnobet") ||
    marketKey.includes("draw-no-bet") ||
    marketName.includes("nobet") ||
    marketKey.includes("no-bet")
  ) {
    const home = compact(match.homeTeam)
    const away = compact(match.awayTeam)
    const values = [odd.outcomeAlias, odd.outcomeName, odd.outcomeId]
      .filter(Boolean)
      .map((value) => compact(value ?? ""))

    if (values.some((value) => value === "1" || value === "home" || value === home || value.includes(home))) {
      return { code: "1", meaning: "Home", isCode: true }
    }
    if (values.some((value) => value === "2" || value === "away" || value === away || value.includes(away))) {
      return { code: "2", meaning: "Away", isCode: true }
    }
  }

  // Generic check for outcome names that are already short codes (1, X, 2)
  if (nameLower === "1" || nameLower === "home") {
    return { code: "1", meaning: "Home", isCode: true }
  }
  if (nameLower === "2" || nameLower === "away") {
    return { code: "2", meaning: "Away", isCode: true }
  }
  if (nameLower === "x" || nameLower === "draw") {
    return { code: "X", meaning: "Draw", isCode: true }
  }

  // Both Teams to Score formatting
  if (
    marketName.includes("bothteamstoscore") ||
    marketKey.includes("both-teams-to-score")
  ) {
    if (nameLower === "yes" || nameLower === "gg") {
      return { code: "GG", meaning: "Goal Goal", isCode: true }
    }
    if (nameLower === "no" || nameLower === "ng") {
      return { code: "NG", meaning: "No Goal", isCode: true }
    }
  }

  return {
    code: odd.outcomeName || odd.outcomeAlias || odd.outcomeId || "Selection",
    meaning: "",
    isCode: false,
  }
}
