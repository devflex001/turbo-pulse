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
import { useLockDocumentScroll } from "@/hooks/use-lock-document-scroll"
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
  Trophy,
} from "lucide-react"
import type { SportsMatch } from "@/components/markets-panel"
import { CustomEventCard } from "@/components/custom-event-card"
import { PublishedCustomEventsSection } from "@/components/published-custom-events-section"
import { FeaturedSportsMatchesSection } from "@/components/featured-sports-matches-section"
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
import {
  MarketsPanel,
  type SportsMatchWithOdds,
} from "@/components/markets-panel"
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
    case "football":
      return Circle
    case "basketball":
      return CircleDashed
    case "tennis":
      return CircleDot
    case "rugby":
    case "mma":
    case "boxing":
      return Swords
    case "cricket":
      return Trophy
    case "all":
      return LayoutGrid
    default:
      return Activity
  }
}

export default function Page() {
  useLockDocumentScroll()

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
  const [showSignupFromReferral, setShowSignupFromReferral] =
    React.useState(false)
  const [forceShowModal, setForceShowModal] = React.useState(false) // Debug: force show modal

  // State for opening match/custom event modal from share link
  const [matchIdFromUrl, setMatchIdFromUrl] = React.useState<string | null>(
    null
  )
  const [customEventIdFromUrl, setCustomEventIdFromUrl] = React.useState<
    string | null
  >(null)
  const [matchModalOpen, setMatchModalOpen] = React.useState(false)
  const [customEventModalOpen, setCustomEventModalOpen] = React.useState(false)

  // Check URL params on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search)
      const ref = searchParams.get("ref")
      const matchId = searchParams.get("match")
      const customEventId = searchParams.get("customEvent")

      if (ref && !user && !authLoading) {
        setShowSignupFromReferral(true)
      }

      if (matchId) {
        setMatchIdFromUrl(matchId)
        setMatchModalOpen(true)
      }

      if (customEventId) {
        setCustomEventIdFromUrl(customEventId)
        setCustomEventModalOpen(true)
      }
    }
  }, [])

  // Pagination state for infinite scroll
  const [offset, setOffset] = React.useState(0)
  const pageSize = 20

  const matchStatus =
    activeTab === "live"
      ? "live"
      : activeTab === "home" || activeTab === "featured"
        ? "upcoming"
        : undefined

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
  const { items: currentPageMatches = [], totalCount = 0 } =
    React.useMemo(() => {
      if (!matchesResponse) return { items: [], totalCount: 0 }
      if (Array.isArray(matchesResponse))
        return { items: matchesResponse, totalCount: matchesResponse.length }
      if (matchesResponse?.items)
        return {
          items: matchesResponse.items,
          totalCount: matchesResponse.totalCount || 0,
        }
      return { items: [], totalCount: 0 }
    }, [matchesResponse])

  // Accumulate matches as user scrolls
  const [allMatches, setAllMatches] = React.useState<
    (SportsMatch & { firstMarket?: any })[]
  >([])

  React.useEffect(() => {
    if (offset === 0) {
      setAllMatches(currentPageMatches)
    } else {
      setAllMatches((prev) => [...prev, ...currentPageMatches])
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

  const featuredEvents = useQuery(api.sportsData.listFeaturedMatches, {}) as
    | (SportsMatch & { firstMarket?: any })[]
    | undefined

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
    setOffset((prev) => prev + pageSize)
  }

  React.useEffect(() => {
    setIsLoadingMore(false)
  }, [allMatches])

  const displayedMatches = matches

  const countedMatches = React.useMemo(() => {
    return []
  }, [])

  const sportOptions = React.useMemo(() => {
    // Use optimized sport counts from query
    if (!sportCounts || !sportCounts.bySport) {
      return [{ id: "all", label: "All Sports", count: 0 }]
    }

    const counts = sportCounts.bySport
    return [
      { id: "all", label: "All Sports", count: sportCounts.total },
      ...Object.entries(counts)
        .filter(([key]) => key !== "all")
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(([id, count]) => ({
          id,
          label: titleCase(id as string),
          count: count as number,
        })),
    ]
  }, [sportCounts])

  const liveCount = displayedMatches.filter((match) => match.isLive).length

  return (
    <>
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <Header />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar className="hidden w-60 shrink-0 border-r border-border lg:flex" />

          <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-4 pb-20 sm:p-6 lg:pb-0">
            {(activeTab === "home" ||
              activeTab === "live" ||
              activeTab === "featured" ||
              activeTab === "how-it-works" ||
              activeTab === "faqs" ||
              activeTab === "contact" ||
              activeTab === "custom" ||
              activeTab === "mybets" ||
              !activeTab) && (
              <div className="mb-0 flex shrink-0 scrollbar-none items-center gap-1 overflow-x-auto border-b border-border pb-2">
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-9 shrink-0 gap-1.5 rounded-md border px-3 text-sm font-semibold transition-all",
                      activeTab === "home"
                        ? "border-[#4b9f71]/50 bg-[#4b9f71]/10 text-[#4b9f71]"
                        : "border-transparent bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    onClick={() => {
                      setActiveTab("home")
                      setSelectedSport("all")
                      setSelectedLeague("All Leagues")
                    }}
                  >
                    <Home className="size-4" />
                    Home
                  </Button>

                  <Button
                    variant="ghost"
                    className={cn(
                      "h-9 shrink-0 gap-1.5 rounded-md border px-3 text-sm font-semibold transition-all",
                      "border-transparent bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    onClick={() => {
                      router.push("/live")
                    }}
                  >
                    <PlayCircle className="size-4" />
                    Live
                    <span className="ml-0.5 size-1.5 animate-pulse rounded-full bg-red-500" />
                  </Button>

                  <Button
                    variant="ghost"
                    className={cn(
                      "h-9 shrink-0 gap-1.5 rounded-md border px-3 text-sm font-semibold transition-all",
                      activeTab === "featured"
                        ? "border-[#4b9f71]/50 bg-[#4b9f71]/10 text-[#4b9f71]"
                        : "border-transparent bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    onClick={() => {
                      setActiveTab("featured")
                      setSelectedSport("all")
                      setSelectedLeague("All Leagues")
                    }}
                  >
                    <Flame className="size-4" />
                    Featured
                  </Button>

                  <Button
                    variant="ghost"
                    className={cn(
                      "h-9 shrink-0 gap-1.5 rounded-md border px-3 text-sm font-semibold transition-all",
                      activeTab === "custom"
                        ? "border-[#4b9f71]/50 bg-[#4b9f71]/10 text-[#4b9f71]"
                        : "border-transparent bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    onClick={() => {
                      setActiveTab("custom")
                      setSelectedSport("all")
                      setSelectedLeague("All Leagues")
                    }}
                  >
                    <LayoutGrid className="size-4" />
                    Custom Events
                  </Button>
                </div>

                <div className="mx-0.5 h-6 w-px shrink-0 bg-border" />

                <div className="flex shrink-0 items-center gap-2">
                  {!sportCounts ? (
                    <>
                      <div className="h-9 w-24 shrink-0 animate-pulse rounded-md bg-muted" />
                      <div className="h-9 w-24 shrink-0 animate-pulse rounded-md bg-muted" />
                    </>
                  ) : (
                    sportOptions.map((sport) => {
                      const SportIcon = getSportIcon(sport.id)
                      const isActive =
                        selectedSport === sport.id &&
                        activeTab !== "live" &&
                        activeTab !== "featured"
                      return (
                        <Button
                          key={sport.id}
                          variant="ghost"
                          className={cn(
                            "h-9 shrink-0 gap-1.5 rounded-md border px-3 text-sm font-semibold transition-all",
                            isActive
                              ? "border-[#4b9f71]/50 bg-[#4b9f71]/10 text-[#4b9f71]"
                              : "border-transparent bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                          onClick={() => {
                            setSelectedSport(sport.id)
                            setSelectedLeague("All Leagues")
                            setActiveTab("home")
                          }}
                        >
                          <SportIcon className="size-4" />
                          <span>{sport.label}</span>
                          <span
                            className={cn(
                              "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors",
                              isActive
                                ? "bg-[#4b9f71]/20 text-[#4b9f71]"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {sport.count}
                          </span>
                        </Button>
                      )
                    })
                  )}
                </div>

                <div className="mx-0.5 h-6 w-px shrink-0 bg-border" />

                <div className="flex shrink-0 items-center gap-2">
                  {!leagues ? (
                    <>
                      <div className="h-9 w-24 shrink-0 animate-pulse rounded-md bg-muted" />
                      <div className="h-9 w-24 shrink-0 animate-pulse rounded-md bg-muted" />
                    </>
                  ) : (
                    (leagues ?? ["All Leagues"]).map((league) => {
                      const isActive = selectedLeague === league
                      return (
                        <Button
                          key={league}
                          variant="ghost"
                          className={cn(
                            "h-9 shrink-0 rounded-md border px-3 text-sm font-medium transition-all",
                            isActive
                              ? "border-[#4b9f71]/50 bg-[#4b9f71]/10 text-[#4b9f71]"
                              : "border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
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
                  <div className="relative flex h-24 w-full shrink-0 overflow-hidden rounded-lg border border-border bg-card sm:h-32">
                    {SLIDES[slideIndex] && (
                      <>
                        <img
                          key={SLIDES[slideIndex].id}
                          src={SLIDES[slideIndex].image}
                          alt={SLIDES[slideIndex].imageAlt}
                          className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500"
                          loading="eager"
                          decoding="async"
                        />

                        {/* Dark gradient overlay for text readability */}
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                          aria-hidden="true"
                        />

                        {/* Text and Button at Bottom Left */}
                        <div className="absolute bottom-0 left-0 z-10 flex flex-col items-start gap-2 px-4 py-2 sm:px-6 sm:py-3">
                          {/* Button */}
                          {SLIDES[slideIndex].showButton && (
                            <Button
                              size="sm"
                              className="h-7 bg-[#4b9f71] px-3 text-[11px] font-semibold text-white shadow-md hover:bg-[#3e865f] sm:h-8 sm:px-4 sm:text-xs"
                              onClick={() =>
                                SLIDES[slideIndex].buttonAction === "live"
                                  ? router.push("/live")
                                  : setActiveTab("home")
                              }
                            >
                              {SLIDES[slideIndex].buttonText}
                            </Button>
                          )}

                          {/* Text */}
                          <div className="space-y-0.5 text-left">
                            <h3 className="text-xs font-bold text-white sm:text-sm">
                              {SLIDES[slideIndex].title}
                            </h3>
                            <p className="text-[10px] text-white/95 sm:text-xs">
                              {SLIDES[slideIndex].subtitle}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Featured Sports Matches */}
                <FeaturedSportsMatchesSection />

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                      <PlayCircle className="size-4 text-muted-foreground" />
                      <span>Upcoming Matches & Fixtures</span>
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-border bg-muted/20 text-[10px] font-semibold text-muted-foreground"
                    >
                      Fixtures {displayedMatches.length} of {totalCount}
                    </Badge>
                  </div>

                  {!matchesResponse ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Skeleton className="h-32 rounded-lg" />
                      <Skeleton className="h-32 rounded-lg" />
                    </div>
                  ) : displayedMatches.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {displayedMatches.map((match) => (
                          <MatchCard key={match.sourceMatchId} match={match} />
                        ))}
                      </div>

                      {/* Load more button */}
                      <div className="col-span-1 flex justify-center py-4 md:col-span-2">
                        {hasMore ? (
                          <Button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="gap-2 bg-[#4b9f71] font-semibold text-white hover:bg-[#3e865f]"
                          >
                            {isLoadingMore ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
                                Loading...
                              </>
                            ) : (
                              `Load More Fixtures`
                            )}
                          </Button>
                        ) : (
                          displayedMatches.length > 0 && (
                            <span className="text-sm font-medium text-muted-foreground">
                              All fixtures loaded ✓
                            </span>
                          )
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-8 py-12 text-center text-xs text-muted-foreground">
                      No synced fixtures found.
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "featured" && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Flame className="size-4 fill-current text-primary" />
                  Featured Events
                </h2>

                {/* Featured Custom Events ON TOP */}
                <PublishedCustomEventsSection />

                {/* Featured Sports Matches */}
                <FeaturedSportsMatchesSection />
              </div>
            )}

            {activeTab === "custom" && (
              <div className="space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Flame className="size-4 fill-current text-primary" />
                  Featured Events
                </h2>
                <PublishedCustomEventsSection />
              </div>
            )}

            {activeTab === "how-it-works" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-foreground">
                  How BetFlexx Works
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    [
                      "1",
                      "Sync Markets",
                      "Admins run the scraper or let the schedule refresh upcoming KwikBet fixtures.",
                    ],
                    [
                      "2",
                      "Browse Odds",
                      "Open any fixture to inspect full market groups and outcomes.",
                    ],
                    [
                      "3",
                      "Build Slips",
                      "Pick outcomes across markets and combine them into accumulator or single slips.",
                    ],
                    [
                      "4",
                      "Settle",
                      "Use the mock settlement flow to test wallet and slip outcomes.",
                    ],
                  ].map(([step, title, body]) => (
                    <div
                      key={step}
                      className="space-y-2 rounded-lg border border-border bg-card p-4 text-card-foreground"
                    >
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {step}
                      </span>
                      <h3 className="text-sm font-bold">{title}</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "faqs" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-foreground">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {[
                    [
                      "Is this real-money betting?",
                      "No. BetFlexx is a mock sports betting dashboard for market ingestion and slip simulations.",
                    ],
                    [
                      "Where do fixtures come from?",
                      "Fixtures and odds are scraped from the configured KwikBet sports API and stored in Convex.",
                    ],
                    [
                      "How do I view all markets?",
                      "Click the markets button on a fixture card to open the full market browser.",
                    ],
                  ].map(([question, answer]) => (
                    <div
                      key={question}
                      className="space-y-1 rounded-lg border border-border bg-card p-4 text-card-foreground"
                    >
                      <h4 className="flex items-start gap-1.5 text-sm font-bold text-foreground">
                        <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />{" "}
                        {question}
                      </h4>
                      <p className="pl-5.5 text-xs leading-relaxed text-muted-foreground">
                        {answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!activeTab && (
              <>
                {matches !== undefined && (
                  <div className="relative flex h-24 w-full shrink-0 overflow-hidden rounded-lg border border-border bg-card sm:h-32">
                    {SLIDES[slideIndex] && (
                      <>
                        <img
                          key={SLIDES[slideIndex].id}
                          src={SLIDES[slideIndex].image}
                          alt={SLIDES[slideIndex].imageAlt}
                          className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500"
                          loading="eager"
                          decoding="async"
                        />

                        {/* Dark gradient overlay for text readability */}
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                          aria-hidden="true"
                        />

                        {/* Text and Button at Bottom Left */}
                        <div className="absolute bottom-0 left-0 z-10 flex flex-col items-start gap-2 px-4 py-2 sm:px-6 sm:py-3">
                          {/* Button */}
                          {SLIDES[slideIndex].showButton && (
                            <Button
                              size="sm"
                              className="h-7 bg-[#4b9f71] px-3 text-[11px] font-semibold text-white shadow-md hover:bg-[#3e865f] sm:h-8 sm:px-4 sm:text-xs"
                              onClick={() =>
                                SLIDES[slideIndex].buttonAction === "live"
                                  ? router.push("/live")
                                  : setActiveTab("home")
                              }
                            >
                              {SLIDES[slideIndex].buttonText}
                            </Button>
                          )}

                          {/* Text */}
                          <div className="space-y-0.5 text-left">
                            <h3 className="text-xs font-bold text-white sm:text-sm">
                              {SLIDES[slideIndex].title}
                            </h3>
                            <p className="text-[10px] text-white/95 sm:text-xs">
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
                    <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                      <PlayCircle className="size-4 text-muted-foreground" />
                      <span>Upcoming Matches & Fixtures</span>
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-border bg-muted/20 text-[10px] font-semibold text-muted-foreground"
                    >
                      Fixtures {displayedMatches.length} of {totalCount}
                    </Badge>
                  </div>

                  {!matchesResponse ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Skeleton className="h-32 rounded-lg" />
                      <Skeleton className="h-32 rounded-lg" />
                    </div>
                  ) : displayedMatches.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {displayedMatches.map((match) => (
                          <MatchCard key={match.sourceMatchId} match={match} />
                        ))}
                      </div>

                      {/* Load more button */}
                      <div className="col-span-1 flex justify-center py-4 md:col-span-2">
                        {hasMore ? (
                          <Button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="gap-2 bg-[#4b9f71] font-semibold text-white hover:bg-[#3e865f]"
                          >
                            {isLoadingMore ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
                                Loading...
                              </>
                            ) : (
                              `Load More Fixtures`
                            )}
                          </Button>
                        ) : (
                          displayedMatches.length > 0 && (
                            <span className="text-sm font-medium text-muted-foreground">
                              All fixtures loaded ✓
                            </span>
                          )
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-8 py-12 text-center text-xs text-muted-foreground">
                      No synced fixtures found. .
                    </div>
                  )}
                </div>
              </>
            )}

            <footer className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <span className="text-sm font-bold text-foreground">
                  BetFlexx
                </span>
                <span>
                  Smart betting tracker with full market ingestion. Play
                  responsibly.
                </span>
              </div>
              <div className="flex gap-4">
                <span
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => setActiveTab("how-it-works")}
                >
                  How It Works
                </span>
                <span
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => setActiveTab("faqs")}
                >
                  FAQs
                </span>
                <span
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => openSupportChat()}
                >
                  Contact Support
                </span>
              </div>
            </footer>
          </main>

          <aside className="hidden h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden border-l border-border bg-card lg:flex">
            <Betslip />
          </aside>
        </div>

        <BottomNav liveCount={liveCount} />
      </div>

      {/* Signup modal for referral links */}
      {(showSignupFromReferral || forceShowModal) && (
        <RegisterModal
          open={showSignupFromReferral || forceShowModal}
          onOpenChange={(open) => {
            console.log("[Referral Modal] onOpenChange called with:", open)
            if (!open) {
              setShowSignupFromReferral(false)
              setForceShowModal(false)
            }
          }}
        />
      )}

      {/* Match Modal from Share Link */}
      {matchModalOpen &&
        matchIdFromUrl &&
        (isMobile ? (
          <Drawer open={matchModalOpen} onOpenChange={setMatchModalOpen}>
            <DrawerContent className="flex h-[90vh] flex-col overflow-hidden bg-card p-0">
              <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
                <DrawerTitle>Match Markets</DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-hidden">
                <MarketsPanel
                  open={true}
                  onOpenChange={setMatchModalOpen}
                  match={
                    {
                      sourceMatchId: matchIdFromUrl,
                      homeTeam: "",
                      awayTeam: "",
                      startTime: 0,
                      competitionName: "",
                      result: "",
                      status: 0,
                      statusDesc: "",
                      isLive: false,
                      totalMarkets: 0,
                      mainOdds: [],
                    } as SportsMatchWithOdds
                  }
                />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Sheet open={matchModalOpen} onOpenChange={setMatchModalOpen}>
            <SheetContent
              side="right"
              className="flex h-dvh !w-[min(50vw,720px)] !max-w-none flex-col overflow-hidden bg-card p-0"
            >
              <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
                <SheetTitle>Match Markets</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                <MarketsPanel
                  open={true}
                  onOpenChange={setMatchModalOpen}
                  match={
                    {
                      sourceMatchId: matchIdFromUrl,
                      homeTeam: "",
                      awayTeam: "",
                      startTime: 0,
                      competitionName: "",
                      result: "",
                      status: 0,
                      statusDesc: "",
                      isLive: false,
                      totalMarkets: 0,
                      mainOdds: [],
                    } as SportsMatchWithOdds
                  }
                />
              </div>
            </SheetContent>
          </Sheet>
        ))}

      {/* Custom Event Modal from Share Link */}
      {customEventModalOpen &&
        customEventIdFromUrl &&
        (isMobile ? (
          <Drawer
            open={customEventModalOpen}
            onOpenChange={setCustomEventModalOpen}
          >
            <DrawerContent className="flex h-[90vh] flex-col overflow-hidden bg-card p-0">
              <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
                <DrawerTitle>Event Markets</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-1 flex-col overflow-hidden">
                <CustomEventDetail
                  eventId={customEventIdFromUrl as Id<"customEvents">}
                  onBack={() => setCustomEventModalOpen(false)}
                />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Sheet
            open={customEventModalOpen}
            onOpenChange={setCustomEventModalOpen}
          >
            <SheetContent
              side="right"
              className="flex h-dvh !w-[min(50vw,720px)] !max-w-none flex-col overflow-hidden bg-card p-0"
            >
              <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
                <SheetTitle>Event Markets</SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col overflow-hidden">
                <CustomEventDetail
                  eventId={customEventIdFromUrl as Id<"customEvents">}
                  onBack={() => setCustomEventModalOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        ))}
    </>
  )
}
