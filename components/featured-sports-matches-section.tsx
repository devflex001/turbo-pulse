"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useBetStore } from "@/hooks/use-bet-store"
import { Badge } from "@/components/ui/badge"
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
} from "@/lib/event-timer"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { MarketsPanel } from "./markets-panel"
import { MatchShare } from "./match-share"
import { CustomEventDetail } from "./custom-event-detail"

export function FeaturedSportsMatchesSection() {
  const { addToBetslip } = useBetStore()
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedMatch, setSelectedMatch] = React.useState<any>(null)
  const [now, setNow] = React.useState(() => Date.now())
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Update timer every second
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch both featured sports matches and custom events
  const featuredMatches = useQuery(api.sportsData.listFeaturedMatches, {})
  const customEvents = useQuery(api.customEvents.getFeaturedCustomEvents, {})

  const matchItems = React.useMemo(() => {
    if (!featuredMatches) return []
    return Array.isArray(featuredMatches) ? featuredMatches : []
  }, [featuredMatches])

  const customEventItems = React.useMemo(() => {
    if (!customEvents) return []
    return Array.isArray(customEvents) ? customEvents : []
  }, [customEvents])

  // Combine: custom events FIRST, then sports matches
  const allItems = React.useMemo(() => {
    const combined = [
      ...customEventItems.map(e => ({ ...e, _type: 'custom' })),
      ...matchItems.map(m => ({ ...m, _type: 'sports' }))
    ]
    return combined
  }, [customEventItems, matchItems])

  if (featuredMatches === undefined || customEvents === undefined) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Featured Matches</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (allItems.length === 0) {
    return null
  }

  const handleOpenDetail = (item: any) => {
    setSelectedMatch(item)
    setDetailOpen(true)
  }

  const handleAddToSlip = (item: any, outcome: { label: string; odds: number }) => {
    const timer = calculateEventTimer(item.startTime, now)
    if (timer.isFinished) {
      toast.error("This event has finished. Betting is no longer available.")
      return
    }

    const outcomeMap: Record<string, string> = {
      "1": item.homeTeam,
      "X": "Draw",
      "2": item.awayTeam,
    }

    const matchId = item._type === 'custom' ? item._id : item.sourceMatchId
    const matchName = `${item.homeTeam} vs ${item.awayTeam}`

    addToBetslip({
      id: `${matchId}-${outcome.label}`,
      matchId,
      matchName,
      team1: item.homeTeam,
      team2: item.awayTeam,
      market: "1X2",
      selection: outcome.label,
      selectionName: outcomeMap[outcome.label] || outcome.label,
      odds: outcome.odds,
      marketName: "1X2",
      outcomeName: outcomeMap[outcome.label] || outcome.label,
      matchStartTime: item.startTime,
    })
    toast.success(`Added ${outcomeMap[outcome.label]} @ ${outcome.odds.toFixed(2)} to betslip`)
  }

  const matchTitle = selectedMatch
    ? `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`
    : ""

  const content = selectedMatch && (
    <div className="flex-1 overflow-hidden flex flex-col">
      {selectedMatch._type === 'custom' ? (
        <CustomEventDetail
          eventId={selectedMatch._id}
          adminControls={false}
          hideHeader={true}
        />
      ) : (
        <MarketsPanel
          open={detailOpen}
          onOpenChange={setDetailOpen}
          match={selectedMatch}
          readOnly={false}
        />
      )}
    </div>
  )

  const renderMatchCard = (item: any) => {
    const timer = calculateEventTimer(item.startTime, now)
    const isItemFinished = timer.isFinished
    const isLive = timer.isLive
    const isCustom = item._type === 'custom'
    const competitionName = isCustom ? item.competition : item.competitionName
    const matchId = isCustom ? item._id : item.sourceMatchId

    return (
      <div
        key={matchId}
        className="group relative flex flex-col rounded-xl border border-border bg-card shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        {/* Top accent bar */}
        <div className={cn(
          "h-[3px] w-full shrink-0 transition-colors duration-300",
          isLive ? "bg-primary" : isItemFinished ? "bg-muted-foreground/30" : "bg-primary/25"
        )} />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2.5 border-b border-border/60">
          <div className="flex items-center gap-2 min-w-0">
            {isLive && (
              <Badge variant="destructive" className="flex items-center gap-1 text-[9px] font-bold h-4 px-1.5 rounded-sm shrink-0">
                <span className="size-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </Badge>
            )}
            {isItemFinished && !isLive && (
              <Badge variant="outline" className="text-[9px] font-bold h-4 px-1.5 rounded-sm shrink-0 text-muted-foreground border-muted-foreground/40">
                FT
              </Badge>
            )}
            <span className="text-[10px] font-semibold text-muted-foreground truncate">{competitionName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isLive && !isItemFinished && (
              <span className="text-[10px] font-mono font-semibold text-muted-foreground/70">
                {formatCountdownToStart(timer.remainingMs)}
              </span>
            )}
            <MatchShare
              title={`${item.homeTeam} vs ${item.awayTeam}`}
              matchId={matchId}
              competitionName={competitionName}
              startTime={item.startTime}
              isCustomEvent={isCustom}
            />
            <button
              onClick={() => handleOpenDetail(item)}
              className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              +{item.totalMarkets} markets
            </button>
          </div>
        </div>

        {/* Teams + score */}
        <div className="px-4 py-3.5 flex items-center gap-3">
          <p className="font-semibold text-sm text-foreground truncate flex-1 text-right leading-tight">{item.homeTeam}</p>
          <div className="shrink-0 min-w-[54px] text-center">
            {isLive || isItemFinished ? (
              <p className="text-lg font-black font-mono text-primary tabular-nums leading-none">
                {item.homeScore ?? 0} – {item.awayScore ?? 0}
              </p>
            ) : (
              <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">vs</p>
            )}
          </div>
          <p className="font-semibold text-sm text-foreground truncate flex-1 leading-tight">{item.awayTeam}</p>
        </div>

        {/* Odds row */}
        <div className={cn(
          "grid grid-cols-3 gap-2 px-4 pb-4",
          isItemFinished && "opacity-40 pointer-events-none"
        )}>
          {[
            { label: "1", odds: 2.35 },
            { label: "X", odds: 3.15 },
            { label: "2", odds: 3.90 },
          ].map((odd) => (
            <button
              key={odd.label}
              disabled={isItemFinished}
              onClick={() => !isItemFinished && handleAddToSlip(item, odd)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 h-11 rounded-lg border border-border bg-muted/30 hover:bg-primary/8 hover:border-primary/50 hover:text-primary transition-all duration-150",
                isItemFinished && "cursor-not-allowed"
              )}
            >
              <span className="text-[9px] font-semibold text-muted-foreground group-hover:text-primary/70">{odd.label}</span>
              <span className="text-xs font-bold font-mono text-foreground">{odd.odds.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Featured Matches</h2>
            <Badge variant="outline" className="text-[10px] font-mono">
              {allItems.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {allItems.map(renderMatchCard)}
          </div>
        </div>

        {/* Mobile Drawer */}
        <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
          <DrawerContent className="h-[90vh] flex flex-col overflow-hidden p-0 bg-card">
            <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
              <DrawerTitle className="truncate text-sm font-semibold">{matchTitle}</DrawerTitle>
              <p className="truncate text-xs text-muted-foreground">{selectedMatch?.competition || selectedMatch?.competitionName}</p>
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
          <h2 className="text-base font-bold text-foreground">Featured Matches</h2>
          <Badge variant="outline" className="text-[10px] font-mono">
            {allItems.length}
          </Badge>
        </div>

        {/* Featured Match Cards (Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allItems.map(renderMatchCard)}
        </div>
      </div>

      {/* Desktop Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side="right"
          className="!w-[min(50vw,720px)] !max-w-none flex h-dvh flex-col overflow-hidden p-0 bg-card"
        >
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <SheetTitle className="truncate text-sm font-semibold">{matchTitle}</SheetTitle>
            <p className="truncate text-xs text-muted-foreground">{selectedMatch?.competition || selectedMatch?.competitionName}</p>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  )
}
