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
  formatCountdownToStart,
  getEventBadgeConfig,
} from "@/lib/event-timer"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CustomEventDetail } from "./custom-event-detail"
import { MatchShare } from "./match-share"

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

  // Fetch published custom events - getFeaturedCustomEvents returns ALL published events with featured ones first
  const customEvents = useQuery(api.customEvents.getFeaturedCustomEvents, {})

  if (customEvents === undefined) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Custom Events</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (customEvents.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Custom Events</h2>
        </div>
        <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
          No published custom events yet.
        </div>
      </div>
    )
  }

  // Notify user when custom events start
  React.useEffect(() => {
    if (!user) {
      return
    }

    for (const event of customEvents) {
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
  }, [notifyCustomEventStarted, now, customEvents, user])

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
        className="group relative overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-amber-900/40 hover:border-amber-300/80 hover:shadow-2xl transition-all duration-300 shadow-xl backdrop-blur-sm"
      >
        {/* Premium background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-600/5 via-transparent to-amber-500/5 pointer-events-none" />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />

        {/* Header: Sport | Competition | Markets & Status */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-5 py-4 border-b border-amber-400/30 bg-gradient-to-r from-slate-900/40 via-slate-900/20 to-amber-900/30">
          <div className="flex items-center gap-3 min-w-0">
            <Badge variant="outline" className="text-[8px] font-bold uppercase bg-gradient-to-r from-amber-600/40 to-amber-500/30 text-amber-200 border-amber-400/60 shrink-0 shadow-lg">
              {event.sport || "Event"}
            </Badge>
            <span className="text-[9px] text-amber-100/90 font-semibold truncate">{event.competition}</span>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <MatchShare
              title={`${event.homeTeam} vs ${event.awayTeam}`}
              matchId={event._id}
              competitionName={event.competition}
              startTime={event.startTime}
              isCustomEvent={true}
            />
            <button
              onClick={() => handleOpenDetail(event)}
              className="text-[8px] font-bold text-amber-200 hover:text-amber-100 transition-all duration-200 hover:scale-110 cursor-pointer px-2 py-1 rounded-lg hover:bg-amber-600/20"
            >
              +{event.totalMarkets} markets
            </button>
            <Badge
              variant={badgeConfig.variant}
              className={cn(
                "text-[8px] font-bold whitespace-nowrap bg-gradient-to-r from-amber-500/50 to-amber-600/40 text-amber-50 border-amber-300/60 shadow-lg",
                badgeConfig.animate && "animate-pulse"
              )}
            >
              {badgeConfig.label}
            </Badge>
          </div>
        </div>

        {/* Main content - Premium spacing */}
        <div className="relative z-10 px-5 py-5 space-y-3 bg-gradient-to-b from-slate-900/30 via-slate-900/20 to-slate-900/40">
          {/* Countdown / Score - CENTERED */}
          <div className="space-y-1.5 text-center">
            <p className="text-[8px] text-amber-300/80 font-bold uppercase tracking-widest">
              {timer.lifecycle === "not_started" ? "Starts In" : "Score"}
            </p>
            <p className="text-3xl font-black text-amber-100 tabular-nums leading-tight drop-shadow-xl bg-gradient-to-b from-amber-200 to-amber-100 bg-clip-text text-transparent">
              {timer.lifecycle === "not_started"
                ? formatCountdownToStart(timer.remainingMs)
                : `${event.homeScore ?? 0} - ${event.awayScore ?? 0}`}
            </p>
          </div>

          {/* Teams */}
          <div className="flex items-center justify-center gap-3 py-2">
            <p className="font-bold text-sm text-amber-50 truncate text-center flex-1 drop-shadow-md">{event.homeTeam}</p>
            <p className="text-xs font-bold text-amber-300/70 shrink-0">vs</p>
            <p className="font-bold text-sm text-amber-50 truncate text-center flex-1 drop-shadow-md">{event.awayTeam}</p>
          </div>

          {/* Odds Display - Premium buttons */}
          <div className={cn(
            "grid grid-cols-3 gap-3 pt-2",
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
                  "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-amber-400/50 bg-gradient-to-b from-amber-600/30 via-amber-700/20 to-amber-800/30 hover:from-amber-500/50 hover:via-amber-600/30 hover:to-amber-700/40 hover:border-amber-300/80 transition-all duration-200 group/odd shadow-lg hover:shadow-amber-900/50 hover:shadow-xl",
                  isEventFinished && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="text-[9px] font-bold text-amber-100 uppercase">{odd.label}</span>
                <span className="text-sm font-black text-amber-100 drop-shadow-md">{odd.odds.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Custom Events</h2>
            <Badge variant="outline" className="text-[10px] font-mono">
              {customEvents.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {customEvents.map(renderEventCard)}
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
          <h2 className="text-base font-bold text-foreground">Custom Events</h2>
          <Badge variant="outline" className="text-[10px] font-mono">
            {customEvents.length}
          </Badge>
        </div>

        {/* Custom Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customEvents.map(renderEventCard)}
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
