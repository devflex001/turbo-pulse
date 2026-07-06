"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { MatchCard } from "@/components/match-card"
import { Betslip } from "@/components/betslip"
import { CustomEventCard } from "@/components/custom-event-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { PlayCircle } from "lucide-react"
import type { SportsMatch } from "@/components/markets-panel"
import { useMediaQuery } from "@/hooks/use-media-query"
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
import { CustomEventDetail } from "@/components/custom-event-detail"
import { Id } from "@/convex/_generated/dataModel"
import { useLockDocumentScroll } from "@/hooks/use-lock-document-scroll"

export default function LivePage() {
  useLockDocumentScroll()

  const [betslipOpen, setBetslipOpen] = React.useState(false)
  const [now, setNow] = React.useState(() => Date.now())
  const [selectedCustomEvent, setSelectedCustomEvent] =
    React.useState<any>(null)
  const [customEventDetailOpen, setCustomEventDetailOpen] =
    React.useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Update timer every second
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const matches = useQuery(api.sportsData.listMatches, {
    status: "live",
    limit: 100,
    includeFirstMarket: true,
  }) as
    | (SportsMatch & { firstMarket?: any })[]
    | { items: (SportsMatch & { firstMarket?: any })[] }
    | undefined

  const customEvents = useQuery(api.customEvents.listCustomEvents, {
    status: "published",
    limit: 50,
  }) as any[] | undefined

  const displayedMatches = React.useMemo(() => {
    if (Array.isArray(matches)) {
      return matches
    }

    if (
      matches &&
      typeof matches === "object" &&
      Array.isArray((matches as { items?: unknown }).items)
    ) {
      return (matches as { items: (SportsMatch & { firstMarket?: any })[] })
        .items
    }

    return []
  }, [matches])

  const liveCustomEvents = React.useMemo(() => {
    if (!Array.isArray(customEvents)) return []
    return customEvents.filter((event) => {
      return (
        event.eventStatus &&
        ["first_half", "halftime", "second_half"].includes(event.eventStatus)
      )
    })
  }, [customEvents])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Header />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar className="hidden w-60 shrink-0 border-r border-border lg:flex" />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4 pb-20 sm:p-6 lg:pb-0">
          {/* Page Title */}
          <div className="sticky top-0 z-10 -mx-4 flex items-center gap-2 bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
            <h1 className="text-lg font-bold text-foreground">Live Betting</h1>
          </div>

          {/* Live Custom Events Section */}
          {liveCustomEvents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                  Live Custom Events
                </h2>
                <Badge
                  variant="outline"
                  className="border-border bg-muted/20 text-[10px] font-semibold text-muted-foreground"
                >
                  Events {liveCustomEvents.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {liveCustomEvents.map((event) => (
                  <CustomEventCard
                    key={event._id}
                    eventId={event._id}
                    homeTeam={event.homeTeam}
                    awayTeam={event.awayTeam}
                    homeScore={event.homeScore ?? 0}
                    awayScore={event.awayScore ?? 0}
                    startTime={event.startTime}
                    competition={event.competition}
                    title={event.title}
                    totalMarkets={event.totalMarkets}
                    onClick={() => {
                      setSelectedCustomEvent(event)
                      setCustomEventDetailOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Live Sports Matches Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {displayedMatches.length > 0 && (
                <Badge
                  variant="outline"
                  className="border-border bg-muted/20 text-[10px] font-semibold text-muted-foreground"
                >
                  Matches {displayedMatches.length}
                </Badge>
              )}
            </div>

            {!matches ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
              </div>
            ) : displayedMatches.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayedMatches.map((match) => (
                  <MatchCard key={match.sourceMatchId} match={match} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
                {liveCustomEvents.length === 0 ? (
                  <div className="space-y-2">
                    <p>No live events at the moment.</p>
                    <p className="text-xs">
                      Check back soon for live sports and custom events.
                    </p>
                  </div>
                ) : (
                  <p>No live sports matches at the moment.</p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav
        liveCount={displayedMatches.length + liveCustomEvents.length}
      />

      {/* Custom Event Detail Modal/Drawer */}
      {isMobile ? (
        <Drawer
          open={customEventDetailOpen}
          onOpenChange={setCustomEventDetailOpen}
        >
          <DrawerContent className="flex h-[90vh] flex-col overflow-hidden bg-card p-0">
            {selectedCustomEvent && (
              <>
                <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
                  <DrawerTitle className="truncate text-sm font-semibold">
                    {selectedCustomEvent.homeTeam} vs{" "}
                    {selectedCustomEvent.awayTeam}
                  </DrawerTitle>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedCustomEvent.competition}
                  </p>
                </DrawerHeader>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <CustomEventDetail
                    eventId={selectedCustomEvent._id as Id<"customEvents">}
                    onBack={() => setCustomEventDetailOpen(false)}
                  />
                </div>
              </>
            )}
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet
          open={customEventDetailOpen}
          onOpenChange={setCustomEventDetailOpen}
        >
          <SheetContent
            side="right"
            className="flex h-dvh !w-[min(50vw,720px)] !max-w-none flex-col overflow-hidden bg-card p-0"
          >
            {selectedCustomEvent && (
              <>
                <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
                  <SheetTitle className="truncate text-sm font-semibold">
                    {selectedCustomEvent.homeTeam} vs{" "}
                    {selectedCustomEvent.awayTeam}
                  </SheetTitle>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedCustomEvent.competition}
                  </p>
                </SheetHeader>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <CustomEventDetail
                    eventId={selectedCustomEvent._id as Id<"customEvents">}
                    onBack={() => setCustomEventDetailOpen(false)}
                  />
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* Betslip Sheet */}
      <Sheet open={betslipOpen} onOpenChange={setBetslipOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-l border-border p-0 sm:w-96"
        >
          <SheetHeader className="flex-shrink-0 border-b border-border bg-muted/20 px-4 py-3">
            <SheetTitle className="text-sm font-bold">Your Betslip</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Betslip onClose={() => setBetslipOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
