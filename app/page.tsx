"use client"

import * as React from "react"
import Image from "next/image"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useBetStore } from "@/hooks/use-bet-store"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MatchCard } from "@/components/match-card"
import { Betslip } from "@/components/betslip"
import { BottomNav } from "@/components/bottom-nav"
import { BanScreen } from "@/components/ban-screen"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SmallLoader } from "@/components/small-loader"
import { toast } from "sonner"
import {
  Flame,
  HelpCircle,
  PlayCircle,
} from "lucide-react"
import type { SportsMatchWithOdds } from "@/components/markets-panel"

const SLIDES = [
  {
    id: "live",
    title: "BetFlow Markets",
    subtitle: "Live KwikBet fixtures with full market depth.",
    cta: "Browse Fixtures",
    image: "/images/football-hero-live.svg",
    imageAlt: "Live football match with ball on pitch",
  },
  {
    id: "markets",
    title: "Full Markets",
    subtitle: "Open any fixture to view all available outcomes.",
    cta: "Open Highlights",
    image: "/images/football-hero-markets.svg",
    imageAlt: "Football on stadium pitch with full market access",
  },
  {
    id: "admin",
    title: "Automated Sync",
    subtitle: "Scraper refresh is controlled from the admin console.",
    cta: "Featured",
    image: "/images/football-hero-sync.svg",
    imageAlt: "Automated football odds sync dashboard",
  },
]

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
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
  } = useBetStore()

  const { isAuthenticated } = useConvexAuth()
  const banStatus = useQuery(
    api.adminUsers.getMyBanStatus,
    isAuthenticated ? {} : "skip"
  )

  const matchStatus =
    activeTab === "live" ? "live" : activeTab === "home" || activeTab === "featured" ? "upcoming" : undefined

  const matches = useQuery(api.sportsData.listMatches, {
    sport: selectedSport,
    competition: selectedLeague,
    status: matchStatus,
    search: searchQuery,
    limit: 80,
  }) as SportsMatchWithOdds[] | undefined

  const allMatches = useQuery(api.sportsData.listMatches, {
    limit: 300,
  }) as SportsMatchWithOdds[] | undefined

  const leagues = useQuery(api.sportsData.listCompetitions, {
    sport: selectedSport,
  }) as string[] | undefined

  const [slideIndex, setSlideIndex] = React.useState(0)
  const [contactName, setContactName] = React.useState("")
  const [contactEmail, setContactEmail] = React.useState("")
  const [contactMsg, setContactMsg] = React.useState("")
  const [isSendingContact, setIsSendingContact] = React.useState(false)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const displayedMatches = matches ?? []
  const featuredMatches = displayedMatches.slice(0, 4)
  const upcomingMatches = activeTab === "featured" ? featuredMatches : displayedMatches
  const sportOptions = React.useMemo(() => {
    const counts = new Map<string, number>()

    for (const match of allMatches ?? []) {
      const key = match.sportSlug || "all"
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    return [
      { id: "all", label: "All Sports", count: allMatches?.length ?? 0 },
      ...Array.from(counts.entries())
        .filter(([key]) => key !== "all")
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([id, count]) => ({ id, label: titleCase(id), count })),
    ]
  }, [allMatches])

  const handleContactSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) {
      toast.error("Please fill in all contact fields")
      return
    }

    setIsSendingContact(true)
    setTimeout(() => {
      toast.success("Thank you. Your message has been sent.")
      setIsSendingContact(false)
      setContactName("")
      setContactEmail("")
      setContactMsg("")
    }, 900)
  }

  if (isAuthenticated && banStatus) {
    return <BanScreen />
  }

  const liveCount = displayedMatches.filter((match) => match.isLive).length

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <div className="flex-1 flex max-w-[1400px] w-full mx-auto overflow-hidden">
        <Sidebar className="hidden lg:flex w-60 shrink-0 h-full" />

        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto h-full flex flex-col gap-6 scrollbar-thin">
          {(activeTab === "home" || activeTab === "live" || activeTab === "featured") && (
            <div className="flex flex-col gap-3 pb-2 border-b border-border">
              <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-none min-h-12">
                {!allMatches ? (
                  <>
                    <div className="h-8 w-24 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="h-8 w-24 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="h-8 w-24 rounded-full bg-muted animate-pulse shrink-0" />
                  </>
                ) : (
                  sportOptions.map((sport) => (
                    <Button
                      key={sport.id}
                      variant={selectedSport === sport.id ? "default" : "outline"}
                      size="sm"
                      className="rounded-full h-8 text-xs font-semibold shrink-0 gap-2"
                      onClick={() => {
                        setSelectedSport(sport.id)
                        setSelectedLeague("All Leagues")
                      }}
                    >
                      <span>{sport.label}</span>
                      <span className="rounded-full bg-background/20 px-1.5 py-0.5 text-[10px] font-bold">
                        {sport.count}
                      </span>
                    </Button>
                  ))
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs min-h-9">
                {!leagues ? (
                  <>
                    <div className="h-7 w-20 rounded bg-muted animate-pulse shrink-0" />
                    <div className="h-7 w-20 rounded bg-muted animate-pulse shrink-0" />
                    <div className="h-7 w-20 rounded bg-muted animate-pulse shrink-0" />
                  </>
                ) : (
                  (leagues ?? ["All Leagues"]).map((league) => (
                    <Button
                      key={league}
                      variant={selectedLeague === league ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2.5 rounded text-[11px] shrink-0 font-medium"
                      onClick={() => setSelectedLeague(league)}
                    >
                      {league}
                    </Button>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "home" && (
            <>
              {matches !== undefined && (
                <div className="relative overflow-hidden rounded-lg border border-border bg-card h-44 sm:h-52">
                  <Image
                    key={SLIDES[slideIndex].id}
                    src={SLIDES[slideIndex].image}
                    alt={SLIDES[slideIndex].imageAlt}
                    fill
                    priority
                    className="object-cover object-center transition-opacity duration-500"
                    sizes="(max-width: 768px) 100vw, 900px"
                  />
                  <div className="absolute inset-0 bg-background/72" aria-hidden="true" />

                  <div className="relative z-10 flex h-full flex-col justify-center p-6 sm:p-8">
                    <div className="max-w-[80%] space-y-2 select-none">
                      <Badge className="bg-primary/10 border-primary/30 text-primary font-bold hover:bg-primary/10 tracking-wide text-[9px] uppercase px-1.5 py-0.5">
                        {SLIDES[slideIndex].title}
                      </Badge>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-card-foreground leading-tight tracking-tight">
                        {SLIDES[slideIndex].subtitle}
                      </h2>
                      <div className="pt-2">
                        <Button
                          size="sm"
                          className="h-8 text-xs font-semibold"
                          onClick={() => setActiveTab(slideIndex === 2 ? "featured" : "home")}
                        >
                          {SLIDES[slideIndex].cta}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1">
                    {SLIDES.map((slide, index) => (
                      <span
                        key={slide.id}
                        onClick={() => setSlideIndex(index)}
                        className={`h-1.5 rounded-full cursor-pointer transition-all ${
                          index === slideIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

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

                  {!matches ? (
                    <SmallLoader />
                  ) : upcomingMatches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcomingMatches.map((match) => (
                        <MatchCard key={match.sourceMatchId} match={match} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 border border-dashed border-border rounded-lg text-muted-foreground text-xs py-12">
                      No synced fixtures found. Ask an admin to run the scraper.
                    </div>
                  )}
                </div>
            </>
          )}

          {activeTab === "live" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                Live Sports Betting
              </h2>
              {!matches ? (
                <SmallLoader />
              ) : displayedMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedMatches.map((match) => (
                    <MatchCard key={match.sourceMatchId} match={match} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground text-xs">
                  No live games active at the moment.
                </div>
              )}
            </div>
          )}

          {activeTab === "featured" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Flame className="size-4 text-primary fill-current" />
                Featured Market Highlights
              </h2>
              {!matches ? (
                <SmallLoader />
              ) : featuredMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredMatches.map((match) => (
                    <MatchCard key={match.sourceMatchId} match={match} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground text-xs">
                  No featured fixtures available.
                </div>
              )}
            </div>
          )}

          {activeTab === "custom" && (
            <div className="text-center py-12 border border-dashed border-border rounded-lg text-muted-foreground text-xs">
              Custom mock events are disabled while live scraped markets are active.
            </div>
          )}


          {activeTab === "how-it-works" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-foreground">How BetFlow Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["1", "Sync Markets", "Admins run the scraper or let the schedule refresh upcoming KwikBet fixtures."],
                  ["2", "Browse Odds", "Open any fixture to inspect full market groups and outcomes."],
                  ["3", "Build Slips", "Pick outcomes across markets and combine them into accumulator or single slips."],
                  ["4", "Settle", "Use the mock settlement flow to test wallet and slip outcomes."],
                ].map(([step, title, body]) => (
                  <div key={step} className="border border-border rounded-lg p-4 space-y-2 bg-card text-card-foreground">
                    <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground font-bold text-xs">{step}</span>
                    <h3 className="font-bold text-sm">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "faqs" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-foreground">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {[
                  ["Is this real-money betting?", "No. BetFlow is a mock sports betting dashboard for market ingestion and slip simulations."],
                  ["Where do fixtures come from?", "Fixtures and odds are scraped from the configured KwikBet sports API and stored in Convex."],
                  ["How do I view all markets?", "Click the markets button on a fixture card to open the full market browser."],
                ].map(([question, answer]) => (
                  <div key={question} className="border border-border p-4 rounded-lg bg-card text-card-foreground space-y-1">
                    <h4 className="font-bold text-sm text-foreground flex gap-1.5 items-start">
                      <HelpCircle className="size-4 shrink-0 text-primary mt-0.5" /> {question}
                    </h4>
                    <p className="text-xs text-muted-foreground pl-5.5 leading-relaxed">{answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-6 max-w-xl">
              <div className="border border-border rounded-lg bg-card p-4 space-y-4">
                <div>
                  <h2 className="text-sm font-bold">Contact Support</h2>
                  <p className="text-xs text-muted-foreground">Send a message to the BetFlow support team.</p>
                </div>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-name">Full Name <span className="text-destructive">*</span></label>
                    <Input id="c-name" value={contactName} onChange={(event) => setContactName(event.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-email">Email Address <span className="text-destructive">*</span></label>
                    <Input id="c-email" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground block" htmlFor="c-msg">Message <span className="text-destructive">*</span></label>
                    <textarea
                      id="c-msg"
                      rows={4}
                      value={contactMsg}
                      onChange={(event) => setContactMsg(event.target.value)}
                      required
                      className="w-full text-sm p-3 rounded-md bg-transparent border border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>
                  <Button type="submit" disabled={isSendingContact} className="w-full font-semibold">
                    {isSendingContact ? "Sending..." : "Submit Message"}
                  </Button>
                </form>
              </div>
            </div>
          )}

          <footer className="mt-auto pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <span className="font-bold text-foreground text-sm">BetFlow</span>
              <span>Smart betting tracker with full market ingestion. Play responsibly.</span>
            </div>
            <div className="flex gap-4">
              <span className="hover:text-foreground cursor-pointer" onClick={() => setActiveTab("how-it-works")}>How It Works</span>
              <span className="hover:text-foreground cursor-pointer" onClick={() => setActiveTab("faqs")}>FAQs</span>
              <span className="hover:text-foreground cursor-pointer" onClick={() => setActiveTab("contact")}>Contact Support</span>
            </div>
          </footer>
        </main>

        <aside className="hidden xl:flex w-80 shrink-0 border-l border-border bg-card flex-col h-full min-h-0">
          <Betslip />
        </aside>
      </div>

      <BottomNav liveCount={liveCount} />
    </div>
  )
}
