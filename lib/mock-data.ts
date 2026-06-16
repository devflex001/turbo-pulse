export interface Match {
  id: string
  sport: "football" | "basketball" | "tennis"
  league: string
  team1: string
  team2: string
  status: "live" | "upcoming"
  time: string // e.g. "73'", "20:00", or "Jun 17, 18:00"
  score?: string // e.g. "2 - 1"
  odds1: number
  oddsX?: number // Basketball/Tennis might not have draws (they will be undefined or we handle it)
  odds2: number
  marketsCount: number
  isBoosted?: boolean
}

export const MOCK_SLIDES = [
  {
    id: "slide-1",
    title: "BetFlow Picks",
    subtitle: "Bet Smarter, Win Bigger",
    description: "Get real-time insights and boosted odds on today's top football matches.",
    cta: "Explore Highlights"
  },
  {
    id: "slide-2",
    title: "Instant M-Pesa",
    subtitle: "Deposits & Withdrawals",
    description: "Deposit money instantly from your phone and get your winnings paid in seconds.",
    cta: "Deposit Now"
  },
  {
    id: "slide-3",
    title: "Enhanced Odds",
    subtitle: "Boosted Daily Specials",
    description: "Enjoy up to 20% higher returns on selected Premier League accumulators.",
    cta: "View Boosted"
  }
]

export const MOCK_MATCHES: Match[] = [
  // Live matches
  {
    id: "m-1",
    sport: "football",
    league: "Premier League",
    team1: "Arsenal",
    team2: "Chelsea",
    status: "live",
    time: "73'",
    score: "2 - 1",
    odds1: 1.45,
    oddsX: 4.20,
    odds2: 6.50,
    marketsCount: 42,
    isBoosted: true,
  },
  {
    id: "m-2",
    sport: "football",
    league: "Kolmonen",
    team1: "HPS",
    team2: "MPS",
    status: "live",
    time: "34'",
    score: "0 - 0",
    odds1: 2.10,
    oddsX: 3.20,
    odds2: 2.80,
    marketsCount: 12,
  },
  {
    id: "m-3",
    sport: "basketball",
    league: "NBA",
    team1: "Boston Celtics",
    team2: "Miami Heat",
    status: "live",
    time: "Q3 8:12",
    score: "82 - 76",
    odds1: 1.25,
    odds2: 3.80,
    marketsCount: 18,
  },
  {
    id: "m-4",
    sport: "tennis",
    league: "Wimbledon",
    team1: "Carlos Alcaraz",
    team2: "Jannik Sinner",
    status: "live",
    time: "Set 3",
    score: "6-4, 3-6, 2-1",
    odds1: 1.85,
    odds2: 1.95,
    marketsCount: 8,
    isBoosted: true,
  },

  // Upcoming Matches - Today
  {
    id: "m-5",
    sport: "football",
    league: "La Liga",
    team1: "Real Madrid",
    team2: "Barcelona",
    status: "upcoming",
    time: "21:00",
    odds1: 1.95,
    oddsX: 3.75,
    odds2: 3.60,
    marketsCount: 89,
    isBoosted: true,
  },
  {
    id: "m-6",
    sport: "football",
    league: "Champions League",
    team1: "Manchester City",
    team2: "Bayern Munich",
    status: "upcoming",
    time: "22:00",
    odds1: 1.72,
    oddsX: 4.10,
    odds2: 4.50,
    marketsCount: 104,
  },
  {
    id: "m-7",
    sport: "basketball",
    league: "NBA",
    team1: "Golden State Warriors",
    team2: "LA Lakers",
    status: "upcoming",
    time: "Today, 23:30",
    odds1: 1.65,
    odds2: 2.25,
    marketsCount: 24,
  },

  // Upcoming Matches - Tomorrow
  {
    id: "m-8",
    sport: "football",
    league: "Premier League",
    team1: "Liverpool",
    team2: "Manchester United",
    status: "upcoming",
    time: "Tomorrow, 19:30",
    odds1: 1.55,
    oddsX: 4.40,
    odds2: 5.25,
    marketsCount: 78,
  },
  {
    id: "m-9",
    sport: "football",
    league: "Azadegan League",
    team1: "Khaibar Khorramabad",
    team2: "Pars Jonoubi Jam",
    status: "upcoming",
    time: "Tomorrow, 17:00",
    odds1: 2.30,
    oddsX: 2.90,
    odds2: 3.10,
    marketsCount: 5,
  },
  {
    id: "m-10",
    sport: "football",
    league: "Mocambola",
    team1: "Ferroviario de Maputo",
    team2: "Costa do Sol",
    status: "upcoming",
    time: "Tomorrow, 15:30",
    odds1: 2.50,
    oddsX: 3.00,
    odds2: 2.70,
    marketsCount: 4,
  },
  {
    id: "m-11",
    sport: "football",
    league: "NM Cup Women",
    team1: "Valerenga (W)",
    team2: "Rosenborg (W)",
    status: "upcoming",
    time: "Tomorrow, 18:00",
    odds1: 1.80,
    oddsX: 3.60,
    odds2: 3.80,
    marketsCount: 15,
  },
  {
    id: "m-12",
    sport: "football",
    league: "National Premier Soccer League",
    team1: "El Farolito",
    team2: "Oakland SC",
    status: "upcoming",
    time: "Tomorrow, 20:00",
    odds1: 1.60,
    oddsX: 3.80,
    odds2: 4.75,
    marketsCount: 10,
  }
]
