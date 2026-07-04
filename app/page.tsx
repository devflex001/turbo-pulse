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
  LayoutGrid,
  Trophy
} from "lucide-react"
import type { SportsMatch } from "@/components/markets-panel"
import { CustomEventCard } from "@/components/custom-event-card"
import { PublishedCustomEventsSection } from "@/components/published-custom-events-section"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { MarketsPanel, type SportsMatchWithOdds } from "@/components/markets-panel"
import { CustomEventDetail } from "@/components/custom-event-detail"
import { Id } from "@/convex/_generated/dataModel"
import { useMediaQuery } from "@/hooks/use-media-query"

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
    case "rugby":
    case "mma":
    case "boxing": return Swords;
    case "cricket": return Trophy;
    case "all": return LayoutGrid;
    default: return Activity;
  }
}

export default function Page() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAdmin } = useAuth()
  const isMobile = useMediaQuery("(max-width: 768px)")
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

  // State for opening match/custom event modal from share link
  const [selectedMatchForShare, setSelectedMatchForShare] = React.useState<any>(null)
  const [selectedCustomEventForShare, setSelectedCustomEventForShare] = React.useState<any>(null)
  const [matchModalOpen, setMatchModalOpen] = React.useState(false)
  const [customEventModalOpen, setCustomEventModalOpen] = React.useState(false)

  // Check for referral code and match/event query params on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      const ref = searchParams.get("ref")
      const matchId = searchParams.get("match")
      const customEventId = searchParams.get("customEvent")

      console.log('[Referral] URL ref param:', ref)
      console.log('[Referral] User logged in:', !!user)
      console.log('[Referral] Auth loading:', authLoading)

      if (ref && !user && !authLoading) {
        console.log('[Referral] Opening signup modal with ref:', ref)
        setShowSignupFromReferral(true)
      }

      if (matchId) {
        console.log('[Share] Opening match modal for:', matchId)
        setMatchModalOpen(true)
      }

      if (customEventId) {
        console.log('[Share] Opening custom event modal for:', customEventId)
        setCustomEventModalOpen(true)
      }
    }
  }, [user, authLoading])

  // Pagination state for infinite scroll
  const [offset, setOffset] = React.useState(0)
  const pageSize = 20

  const matchStatus =
    activeTab === "live" ? "live" : activeTab === "home" || activeTab === "featured" ? "upcoming" : undefined

  // Reset offset when filters change
  React.useEffect(() => {
    setOffset(0)
  }, [selectedSport, selectedLeague, searchQuery, matchStatus])

  const matchesResponse = useQuery(api.sportsData.listMatches, {
    sport: selectedSport,
    competition: selectedLeague,
    status: matchStatus,
    search: searchQuery,
    limit: pageSize,
    offset,
    includeFirstMarket: true,
  }) as any | undefined

  // Extract items and total count
  const { items: currentPageMatches = [], totalCount = 0 } = React.useMemo(() => {
    if (!matchesResponse) return { items: [], totalCount: 0 }
    if (Array.isArray(matchesResponse)) return { items: matchesResponse, totalCount: matchesResponse.length }
    if (matchesResponse?.items) return { items: matchesResponse.items, totalCount: matchesResponse.totalCount || 0 }
    return { items: [], totalCount: 0 }
  }, [matchesResponse])

  // Accumulate matches as user scrolls
  const [allMatches, setAllMatches] = React.useState<(SportsMatch & { firstMarket?: any })[]>([])

  React.useEffect(() => {
    if (offset === 0) {
      setAllMatches(currentPageMatches)
    } else {
      setAllMatches(prev => [...prev, ...currentPageMatches])
    }
  }, [currentPageMatches, offset])

  const hasMore = allMatches.length < totalCount

  const matches = allMatches

  // Use optimized query for sport counts instead of fetching 300 items
  const sportCounts = useQuery(api.sportsData.getSportCounts, {}) as any

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

  // Intersection observer removed - using manual button instead
  const observerTarget = React.useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)

  const handleLoadMore = () => {
    setIsLoadingMore(true)
    setOffset(prev => prev + pageSize)
  }

  React.useEffect(() => {
    setIsLoadingMore(false)
  }, [allMatches])

  const displayedMatches = matches

  // Find the match/custom event from share link when matches load
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      const matchId = searchParams.get("match")
      const customEventId = searchParams.get("customEvent")

      if (matchId && displayedMatches.length > 0 && !selectedMatchForShare) {
        const found = displayedMatches.find((m) => m.sourceMatchId === matchId)
        if (found) {
          setSelectedMatchForShare(found)
          setMatchModalOpen(true)
        }
      }

      if (customEventId && customEvents && customEvents.length > 0 && !selectedCustomEventForShare) {
        const found = customEvents.find((e) => e._id === customEventId)
        if (found) {
          setSelectedCustomEventForShare(found)
          setCustomEventModalOpen(true)
        }
      }
    }
  }, [displayedMatches, customEvents, selectedMatchForShare, selectedCustomEventForShare])

  const countedMatches = React.useMemo(() => {
    return []
  }, [])

  const sportOptions = React.useMemo(() => {
    // Use optimized sport counts from query
    if (!sportCounts || !sportCounts.bySport) {
      return [{ id: "all", label: "All Sports", count: 0 }];
    }

    const counts = sportCounts.bySport;
    return [
      { id: "all", label: "All Sports", count: sportCounts.total },
      ...Object.entries(counts)
        .filter(([key]) => key !== "all")
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(([id, count]) => ({ id, label: titleCase(id as string), count: count as number })),
    ];
  }, [sportCounts])

  const liveCount = displayedMatches.filter((match) => match.isLive).length

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar className="hidden lg:flex w-60 shrink-0 overflow-y-auto border-r border-border" />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-2 scrollbar-thin">
            {((activeTab === "home" || activeTab === "live" || activeTab === "featured" || activeTab === "how-it-works" || activeTab === "faqs" || activeTab === "contact" || activeTab === "custom" || activeTab === "mybets") || !activeTab) && (

              <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-0 border-b border-border scrollbar-none shrink-0">

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-9 px-3 rounded-md text-sm font-semibold shrink-0 gap-1.5 border transition-all",
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
                      "h-9 px-3 rounded-md text-sm font-semibold shrink-0 gap-1.5 border transition-all",
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
                      "h-9 px-3 rounded-md text-sm font-semibold shrink-0 gap-1.5 border transition-all",
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

                <div className="w-px h-6 bg-border mx-0.5 shrink-0" />

                <div className="flex items-center gap-2 shrink-0">
                  {!sportCounts ? (
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
                            "h-9 px-3 rounded-md text-sm font-semibold shrink-0 gap-1.5 border transition-all",
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
                            "rounded-full px-1.5 py-0.5 text-[10px] font-bold ml-0.5 transition-colors",
                            isActive ? "bg-[#4b9f71]/20 text-[#4b9f71]" : "bg-muted text-muted-foreground"
                          )}>
                            {sport.count}
                          </span>
                        </Button>
                      )
                    })
                  )}
                </div>

                <div className="w-px h-6 bg-border mx-0.5 shrink-0" />

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
                            "h-9 px-3 rounded-md text-sm font-medium shrink-0 transition-all border",
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
                      Fixtures {displayedMatches.length} of {totalCount}
                    </Badge>
                  </div>

                  {!matchesResponse ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-32 rounded-lg" />
                      <Skeleton className="h-32 rounded-lg" />
                    </div>
                  ) : displayedMatches.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayedMatches.map((match) => (
                          <MatchCard key={match.sourceMatchId} match={match} />
                        ))}
                      </div>

                      {/* Load more button */}
                      <div className="col-span-1 md:col-span-2 py-4 flex justify-center">
                        {hasMore ? (
                          <Button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="bg-[#4b9f71] hover:bg-[#3e865f] text-white font-semibold gap-2"
                          >
                            {isLoadingMore ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent" />
                                Loading...
                              </>
                            ) : (
                              `Load More Fixtures`
                            )}
                          </Button>
                        ) : displayedMatches.length > 0 && (
                          <span className="text-sm text-muted-foreground font-medium">All fixtures loaded ✓</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 border border-dashed border-border rounded-lg text-muted-foreground text-xs py-12">
                      No synced fixtures found.
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
                ) : displayedMatches.slice(0, 4).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedMatches.slice(0, 4).map((match) => (
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
                      Fixtures {displayedMatches.length} of {totalCount}
                    </Badge>
                  </div>

                  {!matchesResponse ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton className="h-32 rounded-lg" />
                      <Skeleton className="h-32 rounded-lg" />
                    </div>
                  ) : displayedMatches.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayedMatches.map((match) => (
                          <MatchCard key={match.sourceMatchId} match={match} />
                        ))}
                      </div>

                      {/* Load more button */}
                      <div className="col-span-1 md:col-span-2 py-4 flex justify-center">
                        {hasMore ? (
                          <Button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="bg-[#4b9f71] hover:bg-[#3e865f] text-white font-semibold gap-2"
                          >
                            {isLoadingMore ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent" />
                                Loading...
                              </>
                            ) : (
                              `Load More Fixtures`
                            )}
                          </Button>
                        ) : displayedMatches.length > 0 && (
                          <span className="text-sm text-muted-foreground font-medium">All fixtures loaded ✓</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 border border-dashed border-border rounded-lg text-muted-foreground text-xs py-12">
                      No synced fixtures found. .
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