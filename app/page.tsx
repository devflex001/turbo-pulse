"use client"

import * as React from "react"
import { useBetStore, type PlacedBet } from "@/hooks/use-bet-store"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MatchCard } from "@/components/match-card"
import { Betslip } from "@/components/betslip"
import { MOCK_MATCHES, MOCK_SLIDES, type Match } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { 
  Flame, 
  PlusCircle, 
  PlayCircle,
  HelpCircle,
  Sparkles,
  DollarSign,
  TrendingUp,
  } from "lucide-react"

function getRandomOutcome(): boolean {
  return Math.random() > 0.4
}

export default function Page() {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    selectedSport,
    setSelectedSport,
    selectedLeague,
    setSelectedLeague,
    myBets,
    transactions,
    settleAllBets
  } = useBetStore()

  // Local list of matches (starts with MOCK_MATCHES and allows adding custom ones)
  const [matches, setMatches] = React.useState<Match[]>(() => {
    if (typeof window !== "undefined") {
      const savedMatches = localStorage.getItem("bet_custom_matches")
      if (savedMatches) return JSON.parse(savedMatches)
    }
    return MOCK_MATCHES
  })

  // Sync matches to localStorage when updated
  const updateMatches = (newMatches: Match[]) => {
    setMatches(newMatches)
    localStorage.setItem("bet_custom_matches", JSON.stringify(newMatches))
  }

  // Carousel slider index state
  const [slideIndex, setSlideIndex] = React.useState(0)
  React.useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % MOCK_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Create custom match states
  const [customHome, setCustomHome] = React.useState("")
  const [customAway, setCustomAway] = React.useState("")
  const [customSport, setCustomSport] = React.useState<"football" | "basketball" | "tennis">("football")
  const [customLeague, setCustomLeague] = React.useState("Custom League")
  const [customOdds1, setCustomOdds1] = React.useState("2.00")
  const [customOddsX, setCustomOddsX] = React.useState("3.10")
  const [customOdds2, setCustomOdds2] = React.useState("2.50")

  // Contact form states
  const [contactName, setContactName] = React.useState("")
  const [contactEmail, setContactEmail] = React.useState("")
  const [contactMsg, setContactMsg] = React.useState("")
  const [isSendingContact, setIsSendingContact] = React.useState(false)

  // Get list of unique leagues for quick tags
  const leagues = React.useMemo(() => {
    const allLeagues = matches
      .filter((m) => selectedSport === "all" || m.sport === selectedSport)
      .map((m) => m.league)
    return ["All Leagues", ...Array.from(new Set(allLeagues))]
  }, [matches, selectedSport])

  // Filtered matches based on search, sport, league, and activeTab
  const filteredMatches = React.useMemo(() => {
    return matches.filter((m) => {
      // 1. Search Query filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase()
        const matchName = `${m.team1} vs ${m.team2}`.toLowerCase()
        const league = m.league.toLowerCase()
        if (!matchName.includes(query) && !league.includes(query) && m.id !== query) {
          return false
        }
      }

      // 2. Sidebar tab section filters
      if (activeTab === "live" && m.status !== "live") return false
      if (activeTab === "featured" && !m.isBoosted) return false

      // 3. Horizontal header sport selectors
      if (selectedSport !== "all" && m.sport !== selectedSport) return false

      // 4. Horizontal header league selectors
      if (selectedLeague !== "All Leagues" && m.league !== selectedLeague) return false

      return true
    })
  }, [matches, searchQuery, activeTab, selectedSport, selectedLeague])

  // Split matches into Boosted vs Upcoming
  const boostedMatches = React.useMemo(() => {
    return filteredMatches.filter((m) => m.isBoosted)
  }, [filteredMatches])

  const upcomingMatches = React.useMemo(() => {
    return filteredMatches.filter((m) => !m.isBoosted)
  }, [filteredMatches])

  // Handle adding custom matches
  const handleAddCustomMatch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customHome.trim() || !customAway.trim()) {
      toast.error("Please enter home and away team names")
      return
    }

    const odds1 = parseFloat(customOdds1)
    const oddsX = parseFloat(customOddsX)
    const odds2 = parseFloat(customOdds2)

    if (isNaN(odds1) || odds1 <= 1 || isNaN(odds2) || odds2 <= 1) {
      toast.error("Odds must be numeric values greater than 1.00")
      return
    }

    const newMatch: Match = {
      id: "cm-" + Math.random().toString(36).substr(2, 9),
      sport: customSport,
      league: customLeague || "Custom League",
      team1: customHome,
      team2: customAway,
      status: "upcoming",
      time: "Today, 19:30",
      odds1,
      oddsX: customSport === "football" ? (isNaN(oddsX) ? 3.00 : oddsX) : undefined,
      odds2,
      marketsCount: 3,
    }

    const updated = [newMatch, ...matches]
    updateMatches(updated)
    toast.success(`Custom match ${customHome} vs ${customAway} added successfully!`)

    // Clear form
    setCustomHome("")
    setCustomAway("")
    setCustomOdds1("2.00")
    setCustomOddsX("3.10")
    setCustomOdds2("2.50")
  }

  // Handle settling a single placed bet
  const handleSettleBet = (betId: string) => {
    // In our state store, we can update the status of this bet
    const storedBets = localStorage.getItem("bet_my_bets")
    if (!storedBets) return

    const bets: PlacedBet[] = JSON.parse(storedBets)
    const betIndex = bets.findIndex((b) => b.id === betId)
    if (betIndex === -1 || bets[betIndex].status !== "active") return

    // Settle using utility defined outside component to remain pure during render
    const won = getRandomOutcome()
    const bet = bets[betIndex]
    bet.status = won ? "won" : "lost"

    // If won, credit wallet
    if (won) {
      const balance = localStorage.getItem("bet_wallet_balance")
      const currentBal = balance ? parseFloat(balance) : 1000
      const newBal = currentBal + bet.potentialReturn
      localStorage.setItem("bet_wallet_balance", newBal.toString())
      // Trigger a state reload for balance by reloading page or updating store
      // But let's trigger it directly. We can just settle all by refreshing window state
      toast.success(`Bet won! KES ${bet.potentialReturn.toLocaleString()} credited to your wallet!`, {
        duration: 5000
      })
    } else {
      toast.error(`Bet settled: lost. Better luck next time!`)
    }

    bets[betIndex] = bet
    localStorage.setItem("bet_my_bets", JSON.stringify(bets))
    // Trigger quick component update:
    window.dispatchEvent(new Event("storage"))
    // Just force state sync via reloading store or location
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  // Handle Contact Us submit
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) {
      toast.error("Please fill in all contact fields")
      return
    }

    setIsSendingContact(true)
    setTimeout(() => {
      toast.success("Thank you! Your message has been sent. We will get back to you shortly.")
      setIsSendingContact(false)
      setContactName("")
      setContactEmail("")
      setContactMsg("")
    }, 1200)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Dynamic Header */}
      <Header />

      {/* Main Grid: Sidebar (240px) | Main Area (flex-1) | Betslip (320px) on desktop */}
      <div className="flex-1 flex max-w-[1400px] w-full mx-auto overflow-hidden">
        
        {/* Left Sidebar */}
        <Sidebar className="hidden lg:flex w-60 shrink-0 h-full" />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto h-full flex flex-col gap-6 scrollbar-thin">
          
          {/* Sub Navigation Sports/Leagues bar */}
          {activeTab === "home" && (
            <div className="flex flex-col gap-3 pb-2 border-b border-border">
              {/* Sports Tab bar shortcut */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-none">
                <Button
                  variant={selectedSport === "all" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full h-8 text-xs font-semibold shrink-0"
                  onClick={() => { setSelectedSport("all"); setSelectedLeague("All Leagues"); }}
                >
                  All Sports
                </Button>
                <Button
                  variant={selectedSport === "football" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full h-8 text-xs font-semibold shrink-0"
                  onClick={() => { setSelectedSport("football"); setSelectedLeague("All Leagues"); }}
                >
                  Football
                </Button>
                <Button
                  variant={selectedSport === "basketball" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full h-8 text-xs font-semibold shrink-0"
                  onClick={() => { setSelectedSport("basketball"); setSelectedLeague("All Leagues"); }}
                >
                  Basketball
                </Button>
                <Button
                  variant={selectedSport === "tennis" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full h-8 text-xs font-semibold shrink-0"
                  onClick={() => { setSelectedSport("tennis"); setSelectedLeague("All Leagues"); }}
                >
                  Tennis
                </Button>
              </div>

              {/* Leagues filters scrollable tags */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {leagues.map((lg) => (
                  <Button
                    key={lg}
                    variant={selectedLeague === lg ? "secondary" : "ghost"}
                    size="sm"
                    className={`h-7 px-2.5 rounded text-[11px] shrink-0 font-medium ${
                      selectedLeague === lg ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setSelectedLeague(lg)}
                  >
                    {lg}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Layouts based on ActiveTab */}

          {/* 1. HOMEPAGE TAB */}
          {activeTab === "home" && (
            <>
              {/* Promotional carousel slider */}
              <div className="relative overflow-hidden rounded-lg border border-border bg-card h-44 sm:h-48 flex flex-col justify-center p-6 sm:p-8">
                <div className="max-w-[80%] space-y-2 select-none">
                  <Badge className="bg-primary/25 border-primary/40 text-primary font-bold hover:bg-primary/20 hover:text-primary tracking-wide text-[9px] uppercase px-1.5 py-0.5">
                    {MOCK_SLIDES[slideIndex].title}
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-card-foreground leading-tight tracking-tight">
                    {MOCK_SLIDES[slideIndex].subtitle}
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-md hidden sm:block leading-relaxed">
                    {MOCK_SLIDES[slideIndex].description}
                  </p>
                  <div className="pt-2">
                    <Button 
                      size="sm" 
                      className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
                      onClick={() => {
                        if (slideIndex === 0) setActiveTab("home");
                        else if (slideIndex === 1) setActiveTab("home"); 
                        else if (slideIndex === 2) setActiveTab("featured");
                      }}
                    >
                      {MOCK_SLIDES[slideIndex].cta}
                    </Button>
                  </div>
                </div>

                {/* Bottom carousel controls */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1">
                  {MOCK_SLIDES.map((_, idx) => (
                    <span
                      key={idx}
                      onClick={() => setSlideIndex(idx)}
                      className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                        idx === slideIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Boosted Odds Section */}
              {boostedMatches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <Flame className="size-4 text-primary fill-current" />
                    <span>Boosted Odds Highlights</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {boostedMatches.map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Matches Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <PlayCircle className="size-4 text-muted-foreground" />
                    <span>Upcoming Matches & Fixtures</span>
                  </h3>
                  <Badge variant="outline" className="font-semibold text-[10px] text-muted-foreground bg-muted/20 border-border">
                    Fixtures {upcomingMatches.length}
                  </Badge>
                </div>

                {upcomingMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingMatches.map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed border-border rounded-lg text-muted-foreground text-xs py-12">
                    No matching upcoming fixtures found.
                  </div>
                )}
              </div>
            </>
          )}

          {/* 2. LIVE MATCHES TAB */}
          {activeTab === "live" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                Live Sports Betting
              </h2>
              {filteredMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches.map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground text-xs">
                  No live games active at the moment. Check upcoming matches tab.
                </div>
              )}
            </div>
          )}

          {/* 3. FEATURED EVENTS TAB */}
          {activeTab === "featured" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Flame className="size-4 text-primary fill-current" />
                Featured Odds Boosts
              </h2>
              {filteredMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMatches.map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground text-xs">
                  No featured boosted events match your filters right now.
                </div>
              )}
            </div>
          )}

          {/* 4. CUSTOM EVENTS TAB */}
          {activeTab === "custom" && (
            <div className="space-y-6 max-w-4xl">
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <PlusCircle className="size-4 text-primary" />
                    <span>Custom Fixtures Lab</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Create your own custom matches, set mock odds, and add them to the selection pool to test slip returns.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCustomMatch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-home">Home Team Name</label>
                      <Input id="c-home" placeholder="e.g. Real Madrid" value={customHome} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomHome(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-away">Away Team Name</label>
                      <Input id="c-away" placeholder="e.g. Barcelona" value={customAway} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomAway(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-sport">Sport Type</label>
                      <Select value={customSport} onValueChange={(v: "football" | "basketball" | "tennis") => setCustomSport(v)}>
                        <SelectTrigger id="c-sport" className="w-full">
                          <SelectValue placeholder="Football" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="football">Football</SelectItem>
                          <SelectItem value="basketball">Basketball</SelectItem>
                          <SelectItem value="tennis">Tennis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-league">League Name</label>
                      <Input id="c-league" placeholder="e.g. Custom League" value={customLeague} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomLeague(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-odds1">Home Win Odds (1)</label>
                      <Input id="c-odds1" type="number" step="0.01" min="1.01" value={customOdds1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomOdds1(e.target.value)} required />
                    </div>
                    {customSport === "football" && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-oddsX">Draw Odds (X)</label>
                        <Input id="c-oddsX" type="number" step="0.01" min="1.01" value={customOddsX} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomOddsX(e.target.value)} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-odds2">Away Win Odds (2)</label>
                      <Input id="c-odds2" type="number" step="0.01" min="1.01" value={customOdds2} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomOdds2(e.target.value)} required />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 pt-2">
                      <Button type="submit" className="w-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-1.5">
                        <PlusCircle className="size-4" /> Add Match to Board
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 5. MY BETS TAB */}
          {activeTab === "mybets" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">My Betting Hub</h2>
                  <p className="text-xs text-muted-foreground">
                    Track the progress of your placed accumulator and single slips.
                  </p>
                </div>
                {myBets.some((b) => b.status === "active") && (
                  <Button
                    onClick={settleAllBets}
                    size="sm"
                    className="bg-primary text-primary-foreground font-bold flex items-center gap-1"
                  >
                    <Sparkles className="size-3 text-primary-foreground animate-pulse" /> Settle All Bets
                  </Button>
                )}
              </div>

              <Tabs defaultValue="slips" className="w-full">
                <TabsList className="bg-muted border border-border p-0.5">
                  <TabsTrigger value="slips" className="text-xs font-semibold">Active & Settled Slips</TabsTrigger>
                  <TabsTrigger value="transactions" className="text-xs font-semibold">Transaction History</TabsTrigger>
                </TabsList>

                {/* Slips Content */}
                <TabsContent value="slips" className="space-y-4 mt-4">
                  {myBets.length > 0 ? (
                    <div className="space-y-4">
                      {myBets.map((bet) => (
                        <div key={bet.id} className="border border-border rounded-lg bg-card text-card-foreground p-4 space-y-3 text-xs">
                          {/* Row 1: ID, Time, Status */}
                          <div className="flex items-center justify-between border-b border-border pb-2 flex-wrap gap-2">
                            <span className="font-mono text-muted-foreground font-semibold">{bet.id}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">{bet.time}</span>
                              <Badge
                                variant={
                                  bet.status === "won"
                                    ? "default"
                                    : bet.status === "lost"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className={`font-bold text-[9px] px-2 py-0.5 uppercase tracking-wider ${
                                  bet.status === "won" ? "bg-emerald-600 text-white hover:bg-emerald-600" : ""
                                }`}
                              >
                                {bet.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Selections List */}
                          <div className="space-y-2">
                            {bet.selections.map((sel, sIdx) => (
                              <div key={sIdx} className="flex justify-between items-center bg-muted/40 p-2 rounded text-[11px]">
                                <div className="space-y-0.5 max-w-[80%]">
                                  <p className="font-semibold text-foreground truncate">{sel.matchName}</p>
                                  <p className="text-[10px] text-muted-foreground">Your pick: <span className="font-bold text-foreground">{sel.selectionName} ({sel.selection})</span></p>
                                </div>
                                <span className="font-bold font-mono text-primary">@{sel.odds.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Details & Settlement Action */}
                          <div className="flex justify-between items-center pt-2 border-t border-border flex-wrap gap-2 text-xs">
                            <div className="flex gap-4 text-muted-foreground">
                              <span>Stake: <strong className="text-foreground font-mono">KES {bet.stake}</strong></span>
                              <span>Total Odds: <strong className="text-foreground font-mono">@{bet.totalOdds.toFixed(2)}</strong></span>
                              <span>Return: <strong className="text-foreground font-mono text-primary font-bold">KES {bet.potentialReturn.toLocaleString()}</strong></span>
                            </div>

                            {bet.status === "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] font-semibold border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                onClick={() => handleSettleBet(bet.id)}
                              >
                                Mock Settle Bet
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground text-xs">
                      You haven&apos;t placed any bets yet. Select odds and stake to place a bet!
                    </div>
                  )}
                </TabsContent>

                {/* Transactions Content */}
                <TabsContent value="transactions" className="space-y-4 mt-4">
                  {transactions.length > 0 ? (
                    <div className="border border-border rounded-lg bg-card text-card-foreground overflow-hidden">
                      <div className="divide-y divide-border">
                        {transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-3.5 text-xs">
                            <div className="flex items-center gap-3">
                              <span className={`p-1.5 rounded ${
                                tx.type === "deposit" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                              }`}>
                                {tx.type === "deposit" ? <TrendingUp className="size-4" /> : <DollarSign className="size-4" />}
                              </span>
                              <div>
                                <p className="font-semibold text-foreground capitalize">{tx.type} via M-Pesa</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{tx.id} • {tx.time}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold font-mono ${
                                tx.type === "deposit" ? "text-emerald-600" : "text-rose-600"
                              }`}>
                                {tx.type === "deposit" ? "+" : "-"} KES {tx.amount.toLocaleString()}
                              </p>
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-none text-[8px] uppercase tracking-wider font-bold">
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground text-xs">
                      No transaction records found. Make a deposit/withdrawal to begin.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* 6. HOW IT WORKS TAB */}
          {activeTab === "how-it-works" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-foreground">How BetFlow Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-4 space-y-2 bg-card text-card-foreground">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs">1</span>
                  <h3 className="font-bold text-sm">Register / Log In</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Set up your BetFlow profile with a username and your M-Pesa number. Your account details and wallet balance sync locally.
                  </p>
                </div>
                <div className="border border-border rounded-lg p-4 space-y-2 bg-card text-card-foreground">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs">2</span>
                  <h3 className="font-bold text-sm">Top-Up Wallet</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter the amount and trigger a mock STK push deposit. Simulated funds will immediately increase your local wallet.
                  </p>
                </div>
                <div className="border border-border rounded-lg p-4 space-y-2 bg-card text-card-foreground">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs">3</span>
                  <h3 className="font-bold text-sm">Build & Place Bets</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Choose odds from Football, Basketball, or Tennis fixtures. Place Single stakes or combine multiple odds into a multiplied Accumulator slip.
                  </p>
                </div>
                <div className="border border-border rounded-lg p-4 space-y-2 bg-card text-card-foreground">
                  <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs">4</span>
                  <h3 className="font-bold text-sm">Settle & Cashout</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Review your slips in the My Bets tab. Manually trigger settlements to resolve bet outcomes instantly and watch your wallet balance update.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 7. FAQS TAB */}
          {activeTab === "faqs" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-foreground">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div className="border border-border p-4 rounded-lg bg-card text-card-foreground space-y-1">
                  <h4 className="font-bold text-sm text-foreground flex gap-1.5 items-start">
                    <HelpCircle className="size-4 shrink-0 text-primary mt-0.5" /> Is this real-money betting?
                  </h4>
                  <p className="text-xs text-muted-foreground pl-5.5 leading-relaxed">
                    No. BetFlow is a mock sports betting dashboard built for visual testing, odds compilation simulations, and client demonstrations. No real currency is loaded or transacted.
                  </p>
                </div>
                <div className="border border-border p-4 rounded-lg bg-card text-card-foreground space-y-1">
                  <h4 className="font-bold text-sm text-foreground flex gap-1.5 items-start">
                    <HelpCircle className="size-4 shrink-0 text-primary mt-0.5" /> How do I simulate M-Pesa payments?
                  </h4>
                  <p className="text-xs text-muted-foreground pl-5.5 leading-relaxed">
                    Click the Deposit button in the top navigation, select M-Pesa, enter your mockup telephone number, and deposit. The app simulates a transaction delay before crediting the funds to your profile.
                  </p>
                </div>
                <div className="border border-border p-4 rounded-lg bg-card text-card-foreground space-y-1">
                  <h4 className="font-bold text-sm text-foreground flex gap-1.5 items-start">
                    <HelpCircle className="size-4 shrink-0 text-primary mt-0.5" /> How do accumulator (multi) odds multiply?
                  </h4>
                  <p className="text-xs text-muted-foreground pl-5.5 leading-relaxed">
                    When you select outcomes across multiple matches, the individual selection odds (e.g. 1.50, 2.00) multiply together to form the total odds (e.g. 3.00). The potential payout equals your stake multiplied by this total.
                  </p>
                </div>
                <div className="border border-border p-4 rounded-lg bg-card text-card-foreground space-y-1">
                  <h4 className="font-bold text-sm text-foreground flex gap-1.5 items-start">
                    <HelpCircle className="size-4 shrink-0 text-primary mt-0.5" /> How are bets settled?
                  </h4>
                  <p className="text-xs text-muted-foreground pl-5.5 leading-relaxed">
                    Navigate to &quot;My Bets&quot; and click the &quot;Mock Settle Bet&quot; button. The app will simulate outcomes randomly, resolve the slip, and credit any winnings to your wallet balance instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 8. CONTACT US TAB */}
          {activeTab === "contact" && (
            <div className="space-y-6 max-w-xl">
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Contact Support</CardTitle>
                  <CardDescription className="text-xs">
                    Have inquiries or need help testing features? Send us a message and our support team will reply within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-name">Full Name <span className="text-destructive">*</span></label>
                      <Input id="c-name" placeholder="John Doe" value={contactName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-email">Email Address <span className="text-destructive">*</span></label>
                      <Input id="c-email" type="email" placeholder="john@example.com" value={contactEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-msg">Message / Description <span className="text-destructive">*</span></label>
                      <textarea
                        id="c-msg"
                        rows={4}
                        placeholder="Describe your inquiry..."
                        value={contactMsg}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContactMsg(e.target.value)}
                        required
                        className="w-full text-sm p-3 rounded-md bg-transparent border border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground"
                      />
                    </div>
                    <Button type="submit" disabled={isSendingContact} className="w-full bg-primary text-primary-foreground font-semibold">
                      {isSendingContact ? "Sending..." : "Submit Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Footer banner */}
          <footer className="mt-auto pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <span className="font-bold text-foreground text-sm">BetFlow</span>
              <span>Smart betting tracker with fast M-Pesa simulations. Play responsibly.</span>
            </div>
            <div className="flex gap-4">
              <span className="hover:text-foreground cursor-pointer" onClick={() => setActiveTab("how-it-works")}>How It Works</span>
              <span className="hover:text-foreground cursor-pointer" onClick={() => setActiveTab("faqs")}>FAQs</span>
              <span className="hover:text-foreground cursor-pointer" onClick={() => setActiveTab("contact")}>Contact Support</span>
            </div>
          </footer>

        </main>

        {/* Right Sidebar (Desktop Betslip) */}
        <aside className="hidden xl:flex w-80 shrink-0 border-l border-border bg-card">
          <Betslip />
        </aside>

      </div>
    </div>
  )
}
