"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useMediaQuery } from "@/hooks/use-media-query"
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
import { CustomEventDetail } from "@/components/custom-event-detail"
import { Skeleton } from "@/components/ui/skeleton"
import {
  calculateEventTimer,
  formatTimerDisplay,
  formatCountdownToStart,
  getEventBadgeConfig,
} from "@/lib/event-timer"
import { cn } from "@/lib/utils"

export function PublishedCustomEventsSection() {
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
        className="group relative overflow-hidden rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
      >
        {/* Header: Sport | Competition | Status & Markets (top right) */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border/30 bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="text-[9px] font-semibold uppercase bg-muted/50 shrink-0">
              {event.sport}
            </Badge>
            <span className="text-[10px] text-muted-foreground font-medium truncate">{event.competition}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenDetail(event)}
              className="text-[9px] font-bold text-primary hover:text-primary/80 transition-colors"
            >
              {event.totalMarkets} markets
            </button>
            <Badge
              variant={badgeConfig.variant}
              className={cn(
                "text-[9px] font-bold whitespace-nowrap",
                badgeConfig.animate && "animate-pulse"
              )}
            >
              {badgeConfig.label}
            </Badge>
          </div>
        </div>

        {/* Main content */}
        <div className="p-4 space-y-3">
          {/* Countdown - CENTERED */}
          <div className="space-y-1 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
              Starts In
            </p>
            <p className="text-3xl font-black text-primary tabular-nums leading-tight">
              {timer.lifecycle === "not_started"
                ? formatCountdownToStart(timer.remainingMs)
                : formatTimerDisplay(timer.remainingMs)}
            </p>
          </div>

          {/* Teams - Compact */}
          <div className="flex items-center justify-center gap-4">
            <p className="font-bold text-sm text-foreground truncate max-w-[40%]">{event.homeTeam}</p>
            <p className="text-xs font-semibold text-muted-foreground shrink-0">vs</p>
            <p className="font-bold text-sm text-foreground truncate max-w-[40%]">{event.awayTeam}</p>
          </div>

          {/* Odds Display - Top 3 outcomes */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
            {[
              { label: "1", odds: 2.35 },
              { label: "X", odds: 3.15 },
              { label: "2", odds: 3.90 },
            ].map((odd) => (
              <button
                key={odd.label}
                onClick={() => handleOpenDetail(event)}
                className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-md border border-border/40 bg-muted/30 hover:bg-muted/60 hover:border-primary/40 transition-all group/odd"
              >
                <span className="text-[9px] font-semibold text-muted-foreground group-hover/odd:text-foreground">
                  {odd.label}
                </span>
                <span className="font-bold text-sm text-foreground group-hover/odd:text-primary">
                  {odd.odds.toFixed(2)}
                </span>
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Custom Events</h2>
            <Badge variant="outline" className="text-[10px] font-mono">
              {sortedByStartTime.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3">
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Custom Events</h2>
          <Badge variant="outline" className="text-[10px] font-mono">
            {sortedByStartTime.length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
