"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useBetStore } from "@/hooks/use-bet-store"
import { useAuth } from "@/lib/auth/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  calculateEventTimer,
  formatTimerDisplay,
  formatCountdownToStart,
  getEventBadgeConfig,
} from "@/lib/event-timer"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CustomEventDetail } from "./custom-event-detail"

export function PublishedCustomEventsSection() {
  const { addToBetslip } = useBetStore()
  const { user } = useAuth()
  const notifyCustomEventStarted = useMutation(api.notifications.notifyCustomEventStarted)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null)
  const [now, setNow] = React.useState(() => Date.now())
  const notifiedEventIdsRef = React.useRef(new Set<string>())
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Update timer every second
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const publishedEvents = useQuery(api.customEvents.listCustomEvents, {
    status: "published",
    limit: 6,
  })

  const publishedEventItems = React.useMemo(() => {
    if (Array.isArray(publishedEvents)) {
      return publishedEvents
    }

    if (
      publishedEvents &&
      typeof publishedEvents === "object" &&
      "items" in publishedEvents &&
      Array.isArray(publishedEvents.items)
    ) {
      return publishedEvents.items
    }

    return []
  }, [publishedEvents])

  React.useEffect(() => {
    if (!user) {
      return
    }

    for (const event of publishedEventItems) {
      const eventId = String(event._id)
      if (now < event.startTime || notifiedEventIdsRef.current.has(eventId)) {
        continue
      }

      notifiedEventIdsRef.current.add(eventId)
      notifyCustomEventStarted({
        userId: user._id,
        eventId: event._id as Id<"customEvents">,
      }).catch((error) => {
        notifiedEventIdsRef.current.delete(eventId)
        console.error("Failed to create match-start notification", error)
      })
    }
  }, [notifyCustomEventStarted, now, publishedEventItems, user])

  if (publishedEventItems.length === 0) {
    return null
  }

  const sortedByStartTime = [...publishedEventItems].sort((a, b) => a.startTime - b.startTime)

  const handleOpenDetail = (event: any) => {
    setSelectedEvent(event)
    setDetailOpen(true)
  }

  const handleAddToSlip = (event: any, outcome: { label: string; odds: number }) => {
    const timer = calculateEventTimer(event.startTime, now)
    if (timer.isFinished) {
      toast.error("This event has finished. Betting is no longer available.")
      return
    }

    const outcomeMap: Record<string, string> = {
      "1": event.homeTeam,
      "X": "Draw",
      "2": event.awayTeam,
    }

    addToBetslip({
      id: `${event._id}-${outcome.label}`,
      matchId: event._id,
      matchName: `${event.homeTeam} vs ${event.awayTeam}`,
      team1: event.homeTeam,
      team2: event.awayTeam,
      market: "1X2",
      selection: outcome.label,
      selectionName: outcomeMap[outcome.label] || outcome.label,
      odds: outcome.odds,
      marketName: "1X2",
      outcomeName: outcomeMap[outcome.label] || outcome.label,
      matchStartTime: event.startTime,
    })
    toast.success(`Added ${outcomeMap[outcome.label]} @ ${outcome.odds.toFixed(2)} to betslip`)
  }

  const eventTitle = selectedEvent
    ? `${selectedEvent.homeTeam} vs ${selectedEvent.awayTeam}`
    : ""

  const content = selectedEvent && (
    <div className="flex-1 overflow-hidden flex flex-col">
      <CustomEventDetail
        eventId={selectedEvent._id}
        onBack={() => setDetailOpen(false)}
        hideHeader={true}
      />
    </div>
  )

  const renderEventCard = (event: any) => {
    const timer = calculateEventTimer(event.startTime, now)
    const badgeConfig = getEventBadgeConfig(timer.lifecycle)
    const isEventFinished = timer.isFinished

    return (
      <div
        key={event._id}
        className="group relative overflow-hidden rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all"
      >
        {/* Header: Sport | Competition | Markets & Status (top right) */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/30 bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="text-[8px] font-bold uppercase bg-muted/50 shrink-0">
              {event.sport}
            </Badge>
            <span className="text-[9px] text-muted-foreground font-medium truncate">{event.competition}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenDetail(event)}
              className="text-[8px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              +{event.totalMarkets} markets
            </button>
            <Badge
              variant={badgeConfig.variant}
              className={cn(
                "text-[8px] font-bold whitespace-nowrap",
                badgeConfig.animate && "animate-pulse"
              )}
            >
              {badgeConfig.label}
            </Badge>
          </div>
        </div>

        {/* Main content - TIGHT SPACING */}
        <div className="px-3 py-2.5 space-y-1.5">
          {/* Countdown / Score - CENTERED */}
          <div className="space-y-0.5 text-center">
            <p className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">
              {timer.lifecycle === "not_started" ? "Starts In" : "Score"}
            </p>
            <p className="text-2xl font-black text-primary tabular-nums leading-tight">
              {timer.lifecycle === "not_started"
                ? formatCountdownToStart(timer.remainingMs)
                : `${event.homeScore ?? 0} - ${event.awayScore ?? 0}`}
            </p>
          </div>

          {/* Teams - Compact with better spacing */}
          <div className="flex items-center justify-center gap-2">
            <p className="font-bold text-sm text-foreground truncate text-center flex-1">{event.homeTeam}</p>
            <p className="text-xs font-semibold text-muted-foreground shrink-0">vs</p>
            <p className="font-bold text-sm text-foreground truncate text-center flex-1">{event.awayTeam}</p>
          </div>

          {/* Odds Display - Top 3 outcomes - ADD TO BETSLIP */}
          <div className={cn(
            "grid grid-cols-3 gap-1.5 pt-0.5",
            isEventFinished && "opacity-50 pointer-events-none"
          )}>
            {[
              { label: "1", odds: 2.35 },
              { label: "X", odds: 3.15 },
              { label: "2", odds: 3.90 },
            ].map((odd) => (
              <button
                key={odd.label}
                disabled={isEventFinished}
                onClick={() => !isEventFinished && handleAddToSlip(event, odd)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 p-1.5 rounded border border-border/40 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 transition-all group/odd",
                  isEventFinished && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="text-[9px] font-bold text-foreground">{odd.label}</span>
                <span className="text-xs font-semibold text-primary">{odd.odds.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Featured Events</h2>
            <Badge variant="outline" className="text-[10px] font-mono">
              {sortedByStartTime.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {sortedByStartTime.map(renderEventCard)}
          </div>
        </div>

        {/* Mobile Drawer */}
        <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
          <DrawerContent className="h-[90vh] flex flex-col overflow-hidden p-0 bg-card">
            <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
              <DrawerTitle className="truncate text-sm font-semibold">{eventTitle}</DrawerTitle>
              <p className="truncate text-xs text-muted-foreground">{selectedEvent?.competition}</p>
            </DrawerHeader>
            {content}
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Featured Events</h2>
          <Badge variant="outline" className="text-[10px] font-mono">
            {sortedByStartTime.length}
          </Badge>
        </div>

        {/* Signature Green Styled Event Cards (Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedByStartTime.map(renderEventCard)}
        </div>
      </div>

      {/* Desktop Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side="right"
          className="!w-[min(50vw,720px)] !max-w-none flex h-dvh flex-col overflow-hidden p-0 bg-card"
        >
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <SheetTitle className="truncate text-sm font-semibold">{eventTitle}</SheetTitle>
            <p className="truncate text-xs text-muted-foreground">{selectedEvent?.competition}</p>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  )
}