"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useBetStore } from "@/hooks/use-bet-store"
import { useVisitorTracking } from "@/hooks/use-visitor-tracking"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MatchCard } from "@/components/match-card"
import { Betslip } from "@/components/betslip"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RegisterModal } from "@/components/modals"
import { ReferralSignupModal } from "@/components/referral-signup-modal"
import { useAuth } from "@/lib/auth/AuthContext"
import { openSupportChat } from "@/lib/support-chat"
import { cn } from "@/lib/utils"
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
    id: "banner1",
    image: "/images/banner-1.png",
    imageAlt: "Banner 1",
    title: "Live Matches",
    subtitle: "Catch all the action right now",
  },
  {
    id: "banner2",
    image: "/images/banner-2.png",
    imageAlt: "Banner 2",
    title: "Exclusive Odds",
    subtitle: "Maximize your returns today",
    showButton: true,
    buttonText: "Explore",
    buttonAction: "home",
  },
  {
    id: "banner3",
    image: "/images/banner-3.png",
    imageAlt: "Banner 3",
    title: "Weekend Specials",
    subtitle: "Premium markets for you",
  },
  {
    id: "banner4",
    image: "/images/banner-4.png",
    imageAlt: "Banner 4",
    title: "In-Play Betting",
    subtitle: "React to every moment",
    showButton: true,
    buttonText: "Bet Now",
    buttonAction: "live",
  },
  {
    id: "banner5",
    image: "/images/banner-5.png",
    imageAlt: "Banner 5",
    title: "Accumulator Bets",
    subtitle: "Build your ultimate slip",
  },
  {
    id: "banner6",
    image: "/images/banner-6.png",
    imageAlt: "Banner 6",
    title: "Early Payouts",
    subtitle: "Cash out before the final whistle",
  },
  {
    id: "banner7",
    image: "/images/banner-7.png",
    imageAlt: "Banner 7",
    title: "Boosted Odds",
    subtitle: "Daily super-boosted markets",
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
  const router = useRouter()
  const { user, isLoading: authLoading, isAdmin } = useAuth()
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    selectedSport,
    setSelectedSport,
    selectedLeague,
    setSelectedLeague,
  } = useBetStore()

  // Track visitor on page load
  useVisitorTracking()

  // Redirect admins to admin panel
  React.useEffect(() => {
    if (!authLoading && isAdmin) {
      router.push("/admin")
    }
  }, [authLoading, isAdmin, router])

  // State for signup modal triggered by referral link
  const [showSignupFromReferral, setShowSignupFromReferral] = React.useState(false)
  const [forceShowModal, setForceShowModal] = React.useState(false) // Debug: force show modal

  // Check for referral code on mount and open signup modal
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      const ref = searchParams.get("ref")

      console.log('[Referral] URL ref param:', ref)
      console.log('[Referral] User logged in:', !!user)
      console.log('[Referral] Auth loading:', authLoading)

      if (ref && !user && !authLoading) {
        console.log('[Referral] Opening signup modal with ref:', ref)
        setShowSignupFromReferral(true)
      }
    }
  }, [user, authLoading])

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

    if (matches && typeof matches === "object" && Array.isArray((matches as { items?: unknown }).items)) {
      return (matches as { items: (SportsMatch & { firstMarket?: any })[] }).items
    }

    return []
  }, [matches])

  const countedMatches = React.useMemo(() => {
    if (Array.isArray(allMatches)) {
      return allMatches
    }

    if (allMatches && typeof allMatches === "object" && Array.isArray((allMatches as { items?: unknown }).items)) {
      return (allMatches as { items: SportsMatch[] }).items
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

  const liveCount = displayedMatches.filter((match) => match.isLive).length

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar className="hidden lg:flex w-60 shrink-0 overflow-y-auto border-r border-border" />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 scrollbar-thin">
            {((activeTab === "home" || activeTab === "live" || activeTab === "featured" || activeTab === "how-it-works" || activeTab === "faqs" || activeTab === "contact" || activeTab === "custom" || activeTab === "mybets") || !activeTab) && (

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
                      "bg-card text-muted-foreground border-transparent hover:bg-accent hover:text-foreground"
                    )}
                    onClick={() => { router.push("/live") }}
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
                {matches !== undefined && (
                  <div className="relative overflow-hidden rounded-lg border border-border bg-card w-full h-24 sm:h-32 flex shrink-0">
                    {SLIDES[slideIndex] && (
                      <>
                        <img
                          key={SLIDES[slideIndex].id}
                          src={SLIDES[slideIndex].image}
                          alt={SLIDES[slideIndex].imageAlt}
                          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
                          loading="eager"
                          decoding="async"
                        />

                        {/* Dark gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" aria-hidden="true" />

                        {/* Text and Button at Bottom Left */}
                        <div className="absolute bottom-0 left-0 flex flex-col items-start gap-2 px-4 sm:px-6 py-2 sm:py-3 z-10">
                          {/* Button */}
                          {SLIDES[slideIndex].showButton && (
                            <Button
                              size="sm"
                              className="h-7 sm:h-8 text-[11px] sm:text-xs px-3 sm:px-4 font-semibold bg-[#4b9f71] text-white hover:bg-[#3e865f] shadow-md"
                              onClick={() => SLIDES[slideIndex].buttonAction === "live" ? router.push("/live") : setActiveTab("home")}
                            >
                              {SLIDES[slideIndex].buttonText}
                            </Button>
                          )}

                          {/* Text */}
                          <div className="space-y-0.5 text-left">
                            <h3 className="text-xs sm:text-sm font-bold text-white">
                              {SLIDES[slideIndex].title}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-white/95">
                              {SLIDES[slideIndex].subtitle}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <PublishedCustomEventsSection />

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-32 rounded-lg" />
                      <Skeleton className="h-32 rounded-lg" />
                    </div>
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

            {activeTab === "featured" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Flame className="size-4 text-primary fill-current" />
                  Featured Market Highlights
                </h2>
                {!matches ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-32 rounded-lg" />
                    <Skeleton className="h-32 rounded-lg" />
                  </div>
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

            {!activeTab && (
              <>
                {matches !== undefined && (
                  <div className="relative overflow-hidden rounded-lg border border-border bg-card w-full h-24 sm:h-32 flex shrink-0">
                    {SLIDES[slideIndex] && (
                      <>
                        <img
                          key={SLIDES[slideIndex].id}
                          src={SLIDES[slideIndex].image}
                          alt={SLIDES[slideIndex].imageAlt}
                          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
                          loading="eager"
                          decoding="async"
                        />

                        {/* Dark gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" aria-hidden="true" />

                        {/* Text and Button at Bottom Left */}
                        <div className="absolute bottom-0 left-0 flex flex-col items-start gap-2 px-4 sm:px-6 py-2 sm:py-3 z-10">
                          {/* Button */}
                          {SLIDES[slideIndex].showButton && (
                            <Button
                              size="sm"
                              className="h-7 sm:h-8 text-[11px] sm:text-xs px-3 sm:px-4 font-semibold bg-[#4b9f71] text-white hover:bg-[#3e865f] shadow-md"
                              onClick={() => SLIDES[slideIndex].buttonAction === "live" ? router.push("/live") : setActiveTab("home")}
                            >
                              {SLIDES[slideIndex].buttonText}
                            </Button>
                          )}

                          {/* Text */}
                          <div className="space-y-0.5 text-left">
                            <h3 className="text-xs sm:text-sm font-bold text-white">
                              {SLIDES[slideIndex].title}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-white/95">
                              {SLIDES[slideIndex].subtitle}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <PublishedCustomEventsSection />

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-32 rounded-lg" />
                      <Skeleton className="h-32 rounded-lg" />
                    </div>
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

            <footer className="mt-auto pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <span className="font-bold text-foreground text-sm">BetFlexx</span>
                <span>Smart betting tracker with full market ingestion. Play responsibly.</span>
              </div>
              <div className="flex gap-4">
                <span className="hover:text-foreground cursor-pointer" onClick={() => setActiveTab("how-it-works")}>How It Works</span>
                <span className="hover:text-foreground cursor-pointer" onClick={() => setActiveTab("faqs")}>FAQs</span>
                <span className="hover:text-foreground cursor-pointer" onClick={() => openSupportChat()}>Contact Support</span>
              </div>
            </footer>
          </main >

          <aside className="hidden lg:flex w-80 shrink-0 border-l border-border bg-card flex-col h-full min-h-0">
            <Betslip />
          </aside>
        </div >

        <BottomNav liveCount={liveCount} />
      </div>

      {/* Signup modal for referral links */}
      {(showSignupFromReferral || forceShowModal) && (
        <RegisterModal
          open={showSignupFromReferral || forceShowModal}
          onOpenChange={(open) => {
            console.log('[Referral Modal] onOpenChange called with:', open)
            if (!open) {
              setShowSignupFromReferral(false)
              setForceShowModal(false)
            }
          }}
        />
      )}

    </>
  )
}