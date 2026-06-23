"use client"

import * as React from "react"
import Image from "next/image"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useBetStore } from "@/hooks/use-bet-store"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MatchCard } from "@/components/match-card"
import { Betslip } from "@/components/betslip"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SmallLoader } from "@/components/small-loader"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Flame,
  HelpCircle,
  PlayCircle,
  Home,
  Activity,
  CircleDashed,
  Circle,
  CircleDot,
  Swords,
  LayoutGrid
} from "lucide-react"
import type { SportsMatch } from "@/components/markets-panel"
import { CustomEventCard } from "@/components/custom-event-card"
import { PublishedCustomEventsSection } from "@/components/published-custom-events-section"

const SLIDES = [
  {
    id: "promo1",
    title: "Matchday Specials",
    subtitle: "Bet on today's top fixtures and win big!",
    cta: "Win Today",
    image: "/images/p1.jfif",
    imageAlt: "Sports betting action",
  },
  {
    id: "promo2",
    title: "Live Action",
    subtitle: "Catch the best live odds and boost your payouts.",
    cta: "Bet Live Now",
    image: "/images/p2.jfif",
    imageAlt: "Live sports betting",
  },
  {
    id: "promo3",
    title: "Premium Markets",
    subtitle: "Unlock exclusive odds and maximize your returns.",
    cta: "Explore Markets",
    image: "/images/p3.jfif",
    imageAlt: "Premium sports markets",
  },
  {
    id: "promo4",
    title: "Weekend Accumulators",
    subtitle: "Build your ultimate betslip for massive rewards.",
    cta: "Build a Slip",
    image: "/images/p4.jfif",
    imageAlt: "Accumulator betting",
  },
  {
    id: "promo5",
    title: "In-Play Betting",
    subtitle: "React to the action and bet minute-by-minute.",
    cta: "View In-Play",
    image: "/images/p5.jfif",
    imageAlt: "In-play betting action",
  },
  {
    id: "promo6",
    title: "Early Payouts",
    subtitle: "Cash out your winnings early before the final whistle.",
    cta: "Learn More",
    image: "/images/p6.jfif",
    imageAlt: "Early payout options",
  },
  {
    id: "promo7",
    title: "Boosted Odds",
    subtitle: "Get maximum value with daily super-boosted markets.",
    cta: "See Boosts",
    image: "/images/p7.jfif",
    imageAlt: "Boosted sports odds",
  },
  {
    id: "promo8",
    title: "Esports Arena",
    subtitle: "Back your favorite teams in top tier esports tournaments.",
    cta: "Bet Esports",
    image: "/images/p8.jfif",
    imageAlt: "Esports betting",
  },
  {
    id: "promo9",
    title: "Virtual Sports",
    subtitle: "24/7 action with our high-definition virtual leagues.",
    cta: "Play Virtuals",
    image: "/images/p9.jfif",
    imageAlt: "Virtual sports betting",
  },
  {
    id: "promo10",
    title: "VIP Rewards",
    subtitle: "Join the VIP club for exclusive bonuses and cashback.",
    cta: "Claim Bonus",
    image: "/images/p10.jfif",
    imageAlt: "VIP rewards and bonuses",
  },
]

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getSportIcon(slug: string) {
  switch (slug.toLowerCase()) {
    case "football": return Circle;
    case "basketball": return CircleDashed;
    case "tennis": return CircleDot;
    case "mma":
    case "boxing": return Swords;
    case "all": return LayoutGrid;
    default: return Activity;
  }
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

  const matchStatus =
    activeTab === "live" ? "live" : activeTab === "home" || activeTab === "featured" ? "upcoming" : undefined

  const matches = useQuery(api.sportsData.listMatches, {
    sport: selectedSport,
    competition: selectedLeague,
    status: matchStatus,
    search: searchQuery,
    limit: 80,
    includeFirstMarket: true,
  }) as (SportsMatch & { firstMarket?: any })[] | undefined

  const allMatches = useQuery(api.sportsData.listMatches, {
    limit: 300,
    includeFirstMarket: false,
  }) as SportsMatch[] | undefined

  const customEvents = useQuery(api.customEvents.listCustomEvents, {
    status: "published",
    limit: 10,
  }) as any[] | undefined

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

  const displayedMatches = React.useMemo(() => {
    if (Array.isArray(matches)) {
      return matches
    }

    if (matches && typeof matches === "object" && Array.isArray((matches as { page?: unknown }).page)) {
      return (matches as { page: (SportsMatch & { firstMarket?: any })[] }).page
    }

    return []
  }, [matches])

  const countedMatches = React.useMemo(() => {
    if (Array.isArray(allMatches)) {
      return allMatches
    }

    if (allMatches && typeof allMatches === "object" && Array.isArray((allMatches as { page?: unknown }).page)) {
      return (allMatches as { page: SportsMatch[] }).page
    }

    return []
  }, [allMatches])

  const featuredMatches = displayedMatches.slice(0, 4)
  const upcomingMatches = activeTab === "featured" ? featuredMatches : displayedMatches

  const sportOptions = React.useMemo(() => {
    const counts = new Map<string, number>()

    for (const match of countedMatches) {
      const key = match.sportSlug || "all"
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    return [
      { id: "all", label: "All Sports", count: countedMatches.length },
      ...Array.from(counts.entries())
        .filter(([key]) => key !== "all")
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([id, count]) => ({ id, label: titleCase(id), count })),
    ]
  }, [countedMatches])

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

  const liveCount = displayedMatches.filter((match) => match.isLive).length

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar className="hidden lg:flex w-60 shrink-0 overflow-y-auto border-r border-border" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 scrollbar-thin">
          {(activeTab === "home" || activeTab === "live" || activeTab === "featured") && (

            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 border-b border-border scrollbar-none shrink-0">

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 px-4 rounded-md text-sm font-semibold shrink-0 gap-2 border transition-all",
                    activeTab === "home"
                      ? "bg-[#4b9f71]/10 text-[#4b9f71] border-[#4b9f71]/50"
                      : "bg-card text-muted-foreground border-transparent hover:bg-accent hover:text-foreground"
                  )}
                  onClick={() => { setActiveTab("home"); setSelectedSport("all"); setSelectedLeague("All Leagues"); }}
                >
                  <Home className="size-4" />
                  Home
                </Button>

                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 px-4 rounded-md text-sm font-semibold shrink-0 gap-2 border transition-all",
                    activeTab === "live"
                      ? "bg-[#4b9f71]/10 text-[#4b9f71] border-[#4b9f71]/50"
                      : "bg-card text-muted-foreground border-transparent hover:bg-accent hover:text-foreground"
                  )}
                  onClick={() => { setActiveTab("live"); setSelectedLeague("All Leagues"); }}
                >
                  <PlayCircle className="size-4" />
                  Live
                  <span className="size-1.5 rounded-full bg-red-500 animate-pulse ml-0.5" />
                </Button>

                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 px-4 rounded-md text-sm font-semibold shrink-0 gap-2 border transition-all",
                    activeTab === "featured"
                      ? "bg-[#4b9f71]/10 text-[#4b9f71] border-[#4b9f71]/50"
                      : "bg-card text-muted-foreground border-transparent hover:bg-accent hover:text-foreground"
                  )}
                  onClick={() => { setActiveTab("featured"); setSelectedSport("all"); setSelectedLeague("All Leagues"); }}
                >
                  <Flame className="size-4" />
                  Featured
                </Button>
              </div>

              <div className="w-px h-6 bg-border mx-1 shrink-0" />

              <div className="flex items-center gap-2 shrink-0">
                {!allMatches ? (
                  <>
                    <div className="h-9 w-24 rounded-md bg-muted animate-pulse shrink-0" />
                    <div className="h-9 w-24 rounded-md bg-muted animate-pulse shrink-0" />
                  </>
                ) : (
                  sportOptions.map((sport) => {
                    const SportIcon = getSportIcon(sport.id)
                    const isActive = selectedSport === sport.id && activeTab !== "live" && activeTab !== "featured"
                    return (
                      <Button
                        key={sport.id}
                        variant="ghost"
                        className={cn(
                          "h-9 px-4 rounded-md text-sm font-semibold shrink-0 gap-2 border transition-all",
                          isActive
                            ? "bg-[#4b9f71]/10 text-[#4b9f71] border-[#4b9f71]/50"
                            : "bg-card text-muted-foreground border-transparent hover:bg-accent hover:text-foreground"
                        )}
                        onClick={() => {
                          setSelectedSport(sport.id)
                          setSelectedLeague("All Leagues")
                          setActiveTab("home")
                        }}
                      >
                        <SportIcon className="size-4" />
                        <span>{sport.label}</span>
                        <span className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold ml-1 transition-colors",
                          isActive ? "bg-[#4b9f71]/20 text-[#4b9f71]" : "bg-muted text-muted-foreground"
                        )}>
                          {sport.count}
                        </span>
                      </Button>
                    )
                  })
                )}
              </div>

              <div className="w-px h-6 bg-border mx-1 shrink-0" />

              <div className="flex items-center gap-2 shrink-0">
                {!leagues ? (
                  <>
                    <div className="h-9 w-24 rounded-md bg-muted animate-pulse shrink-0" />
                    <div className="h-9 w-24 rounded-md bg-muted animate-pulse shrink-0" />
                  </>
                ) : (
                  (leagues ?? ["All Leagues"]).map((league) => {
                    const isActive = selectedLeague === league
                    return (
                      <Button
                        key={league}
                        variant="ghost"
                        className={cn(
                          "h-9 px-4 rounded-md text-sm font-medium shrink-0 transition-all border",
                          isActive
                            ? "bg-[#4b9f71]/10 text-[#4b9f71] border-[#4b9f71]/50"
                            : "bg-transparent text-muted-foreground border-transparent hover:bg-accent hover:text-foreground"
                        )}
                        onClick={() => setSelectedLeague(league)}
                      >
                        {league}
                      </Button>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "home" && (
            <>
              <PublishedCustomEventsSection />

              {matches !== undefined && (
                <div className="relative overflow-hidden rounded-lg border border-border bg-card w-full min-h-[220px] sm:h-[280px] lg:h-[320px] flex">
                  <img
                    key={SLIDES[slideIndex].id}
                    src={SLIDES[slideIndex].image}
                    alt={SLIDES[slideIndex].imageAlt}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
                  />

                  {/* Dynamic gradient that darkens appropriately on mobile to protect the stacked text */}
                  <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 sm:via-background/60 to-transparent" aria-hidden="true" />

                  {/* Fully responsive flex container */}
                  <div className="relative z-10 flex w-full flex-col sm:flex-row justify-center sm:justify-between items-start sm:items-center p-5 sm:p-10 gap-3 sm:gap-6">

                    {/* Left Side: Text */}
                    <div className="w-full sm:max-w-[60%] lg:max-w-[50%] space-y-2 select-none">
                      <Badge className="bg-[#4b9f71]/15 border-[#4b9f71]/40 text-[#4b9f71] font-bold tracking-wider text-[10px] uppercase px-2 py-0.5">
                        {SLIDES[slideIndex].title}
                      </Badge>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-snug sm:leading-tight tracking-tight shadow-sm drop-shadow-md">
                        {SLIDES[slideIndex].subtitle}
                      </h2>
                    </div>

                    {/* Right Side (Tablet/Desktop) or Bottom Left (Mobile): Button */}
                    <div className="shrink-0 pt-2 sm:pt-0 sm:pr-8">
                      <Button
                        size="sm"
                        className="h-9 sm:h-10 text-xs sm:text-sm px-5 sm:px-6 font-bold bg-[#4b9f71] text-white hover:bg-[#3e865f] border-none shadow-md transition-transform hover:scale-105"
                        onClick={() => setActiveTab(slideIndex === 2 ? "featured" : "home")}
                      >
                        {SLIDES[slideIndex].cta}
                      </Button>
                    </div>
                  </div>

                  {/* Slider Navigation Dots - slimmed down for mobile so 10 fit neatly */}
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-6 z-10 flex justify-end items-center gap-1 sm:gap-1.5">
                    {SLIDES.map((slide, index) => (
                      <span
                        key={slide.id}
                        onClick={() => setSlideIndex(index)}
                        className={`h-1 sm:h-1.5 rounded-full cursor-pointer transition-all ${index === slideIndex ? "w-4 sm:w-5 bg-[#4b9f71]" : "w-1.5 sm:w-1.5 bg-white/50 hover:bg-white/80"
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
              <h2 className="text-lg font-bold text-foreground">How BetFlexx Works</h2>
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
                  ["Is this real-money betting?", "No. BetFlexx is a mock sports betting dashboard for market ingestion and slip simulations."],
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
                  <p className="text-xs text-muted-foreground">Send a message to the BetFlexx support team.</p>
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
              <span className="font-bold text-foreground text-sm">BetFlexx</span>
              <span>Smart betting tracker with full market ingestion. Play responsibly.</span>
            </div>
            <div className="flex gap-4">
              <span className="hover:text-foreground cursor-pointer" onClick={() => setActiveTab("how-it-works")}>How It Works</span>
              <span className="hover:text-foreground cursor-pointer" onClick={() => setActiveTab("faqs")}>FAQs</span>
              <span className="hover:text-foreground cursor-pointer" onClick={() => setActiveTab("contact")}>Contact Support</span>
            </div>
          </footer>
        </main>

        <aside className="hidden lg:flex w-80 shrink-0 border-l border-border bg-card flex-col h-full min-h-0">
          <Betslip />
        </aside>
      </div>

      <BottomNav liveCount={liveCount} />
    </div>
  )
}