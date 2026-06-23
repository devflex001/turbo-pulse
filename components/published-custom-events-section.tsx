"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useBetStore } from "@/hooks/use-bet-store"
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
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null)
  const [now, setNow] = React.useState(() => Date.now())
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

  if (publishedEventItems.length === 0) {
    return null
  }

  const sortedByStartTime = [...publishedEventItems].sort((a, b) => a.startTime - b.startTime)

  const handleOpenDetail = (event: any) => {
    setSelectedEvent(event)
    setDetailOpen(true)
  }

  const handleAddToSlip = (event: any, outcome: { label: string; odds: number }) => {
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
      marketName: "Match Winner",
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
      />
    </div>
  )

  const renderEventCard = (event: any) => {
    const timer = calculateEventTimer(event.startTime, now)
    const badgeConfig = getEventBadgeConfig(timer.lifecycle)

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
          {/* Countdown - CENTERED */}
          <div className="space-y-0.5 text-center">
            <p className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">
              Starts In
            </p>
            <p className="text-2xl font-black text-primary tabular-nums leading-tight">
              {timer.lifecycle === "not_started"
                ? formatCountdownToStart(timer.remainingMs)
                : formatTimerDisplay(timer.remainingMs)}
            </p>
          </div>

          {/* Teams - Compact with better spacing */}
          <div className="flex items-center justify-center gap-2">
            <p className="font-bold text-sm text-foreground truncate text-center flex-1">{event.homeTeam}</p>
            <p className="text-xs font-semibold text-muted-foreground shrink-0">vs</p>
            <p className="font-bold text-sm text-foreground truncate text-center flex-1">{event.awayTeam}</p>
          </div>

          {/* Signature Green Styled Event Cards (Mobile) */}
          <div className="grid grid-cols-1 gap-3">
            {sortedByStartTime.map((event) => (
              <div
                key={event._id}
                className="group relative overflow-hidden rounded-lg border-2 border-[#4b9f71]/40 bg-[#4b9f71]/5 hover:bg-[#4b9f71]/10 transition-all p-4"
              >
                {/* Signature Green accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[#4b9f71]" />

                <div className="space-y-2">
                  {/* Event Title and Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-foreground group-hover:text-[#4b9f71] transition-colors">
                        {event.homeTeam} vs {event.awayTeam}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{event.title}</p>
                    </div>
                    <Badge className="bg-[#4b9f71]/15 text-[#4b9f71] hover:bg-[#4b9f71]/25 border border-[#4b9f71]/40 text-[9px] font-bold shrink-0 uppercase">
                      FEATURED
                    </Badge>
                  </div>

                  {/* Event Meta */}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-[#4b9f71]/20">
                    <span>{event.competition}</span>
                    <span>•</span>
                    <span>{event.totalMarkets} markets</span>
                  </div>

                  {/* View Button */}
                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-[#4b9f71] text-white hover:bg-[#3e865f] font-semibold border-none"
                      onClick={() => handleOpenDetail(event)}
                    >
                      View Markets
                    </Button>
                  </div>
                </div>
              </div>
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
          {sortedByStartTime.map((event) => (
            <div
              key={event._id}
              className="group relative overflow-hidden rounded-lg border-2 border-[#4b9f71]/40 bg-[#4b9f71]/5 hover:bg-[#4b9f71]/10 transition-all p-4"
            >
              {/* Signature Green accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#4b9f71]" />

              <div className="space-y-2">
                {/* Event Title and Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-[#4b9f71] transition-colors">
                      {event.homeTeam} vs {event.awayTeam}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{event.title}</p>
                  </div>
                  <Badge className="bg-[#4b9f71]/15 text-[#4b9f71] hover:bg-[#4b9f71]/25 border border-[#4b9f71]/40 text-[9px] font-bold shrink-0 uppercase">
                    FEATURED
                  </Badge>
                </div>

                {/* Event Meta */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-2 border-t border-[#4b9f71]/20">
                  <span>{event.competition}</span>
                  <span>•</span>
                  <span>{event.totalMarkets} markets</span>
                </div>

                {/* View Button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-[#4b9f71] text-white hover:bg-[#3e865f] font-semibold border-none shadow-sm"
                    onClick={() => handleOpenDetail(event)}
                  >
                    View Markets
                  </Button>
                </div>
              </div>
            </div>
          ))}
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