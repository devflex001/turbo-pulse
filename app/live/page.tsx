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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function LivePage() {
  const [betslipOpen, setBetslipOpen] = React.useState(false)
  const [now, setNow] = React.useState(() => Date.now())

  // Update timer every second
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const matches = useQuery(api.sportsData.listMatches, {
    status: "live",
    limit: 100,
    includeFirstMarket: true,
  }) as (SportsMatch & { firstMarket?: any })[] | { items: (SportsMatch & { firstMarket?: any })[] } | undefined

  const customEvents = useQuery(api.customEvents.listCustomEvents, {
    status: "published",
    limit: 50,
  }) as any[] | undefined

  const displayedMatches = React.useMemo(() => {
    if (Array.isArray(matches)) {
      return matches
    }

    if (matches && typeof matches === "object" && Array.isArray((matches as { items?: unknown }).items)) {
      return (matches as { items: (SportsMatch & { firstMarket?: any })[] }).items
    }

    return []
  }, [matches])

  const liveCustomEvents = React.useMemo(() => {
    if (!Array.isArray(customEvents)) return []
    return customEvents.filter((event) => {
      return event.eventStatus && ["first_half", "halftime", "second_half"].includes(event.eventStatus)
    })
  }, [customEvents])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar className="hidden lg:flex w-60 shrink-0 overflow-y-auto border-r border-border" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 scrollbar-thin">
          {/* Page Title */}
          <div className="flex items-center gap-2 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
            <h1 className="text-lg font-bold text-foreground">Live Betting</h1>
          </div>

          {/* Live Custom Events Section */}
          {liveCustomEvents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  Live Custom Events
                </h2>
                <Badge variant="outline" className="font-semibold text-[10px] text-muted-foreground bg-muted/20 border-border">
                  Events {liveCustomEvents.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  />
                ))}
              </div>
            </div>
          )}

          {/* Live Sports Matches Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
            
              {displayedMatches.length > 0 && (
                <Badge variant="outline" className="font-semibold text-[10px] text-muted-foreground bg-muted/20 border-border">
                  Matches {displayedMatches.length}
                </Badge>
              )}
            </div>

            {!matches ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
              </div>
            ) : displayedMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedMatches.map((match) => (
                  <MatchCard key={match.sourceMatchId} match={match} />
                ))}
              </div>
            ) : (
              <div className="text-center bg-card py-12 border border-dashed border-border rounded-lg text-muted-foreground text-sm">
                {liveCustomEvents.length === 0 ? (
                  <div className="space-y-2">
                    <p>No live events at the moment.</p>
                    <p className="text-xs">Check back soon for live sports and custom events.</p>
                  </div>
                ) : (
                  <p>No live sports matches at the moment.</p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav liveCount={displayedMatches.length + liveCustomEvents.length} />

      {/* Betslip Sheet */}
      <Sheet open={betslipOpen} onOpenChange={setBetslipOpen}>
        <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col border-l border-border">
          <SheetHeader className="px-4 py-3 border-b border-border bg-muted/20 flex-shrink-0">
            <SheetTitle className="text-sm font-bold">Your Betslip</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden flex flex-col">
            <Betslip onClose={() => setBetslipOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
