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

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

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
          <Skeleton className="h-48 rounded-xl bg-muted/50" />
          <Skeleton className="h-48 rounded-xl bg-muted/50" />
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
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-background shadow-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500"
      >
        {/* Subtle inner top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/5" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2 min-w-0">
            {isLive ? (
              <span className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary shrink-0">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            ) : isItemFinished ? (
              <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
                FT
              </span>
            ) : null}
            <span className="text-xs font-medium text-muted-foreground truncate capitalize tracking-wide">
              {competitionName}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <MatchShare
              title={`${item.homeTeam} vs ${item.awayTeam}`}
              matchId={matchId}
              competitionName={competitionName}
              startTime={item.startTime}
              isCustomEvent={isCustom}
            />
            <button
              onClick={() => handleOpenDetail(item)}
              className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors"
            >
              +{item.totalMarkets} mkts
            </button>
          </div>
        </div>

        {/* Score / countdown — centered hero */}
        <div className="px-4 pt-6 pb-4 text-center space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground capitalize">
            {timer.lifecycle === "not_started" ? "Starts in" : "Score"}
          </p>
          <p className="text-3xl font-bold tabular-nums text-foreground leading-none tracking-tight">
            {timer.lifecycle === "not_started"
              ? formatCountdownToStart(timer.remainingMs)
              : `${item.homeScore ?? 0} – ${item.awayScore ?? 0}`}
          </p>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-center gap-3 px-4 pb-5">
          <p className="font-semibold text-sm text-foreground/90 truncate text-right flex-1">{item.homeTeam}</p>
          <p className="text-xs font-medium text-muted-foreground shrink-0">vs</p>
          <p className="font-semibold text-sm text-foreground/90 truncate flex-1">{item.awayTeam}</p>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-border/40" />

        {/* Odds */}
        <div className={cn(
          "grid grid-cols-3 gap-2.5 p-4",
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
                "flex flex-col items-center justify-center gap-1 h-14 rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300",
                isItemFinished && "cursor-not-allowed"
              )}
            >
              <span className="text-xs font-medium text-muted-foreground">{odd.label}</span>
              <span className="text-sm font-semibold font-mono text-foreground">{odd.odds.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Featured Matches</h2>
            <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
              {allItems.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {allItems.map(renderMatchCard)}
          </div>
        </div>

        <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
          <DrawerContent className="h-[90vh] flex flex-col overflow-hidden p-0 bg-card">
            <DrawerHeader className="shrink-0 border-b border-border px-4 py-4 text-left">
              <DrawerTitle className="truncate text-base font-semibold">{matchTitle}</DrawerTitle>
              <p className="truncate text-sm text-muted-foreground mt-0.5 capitalize">{selectedMatch?.competition || selectedMatch?.competitionName}</p>
            </DrawerHeader>
            {content}
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Featured Matches</h2>
          <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5">
            {allItems.length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allItems.map(renderMatchCard)}
        </div>
      </div>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side="right"
          className="!w-[min(50vw,720px)] !max-w-none flex h-dvh flex-col overflow-hidden p-0 bg-card"
        >
          <SheetHeader className="shrink-0 border-b border-border px-6 py-5 text-left">
            <SheetTitle className="truncate text-lg font-semibold">{matchTitle}</SheetTitle>
            <p className="truncate text-sm text-muted-foreground mt-1 capitalize">{selectedMatch?.competition || selectedMatch?.competitionName}</p>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  )
}