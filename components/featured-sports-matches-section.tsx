"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
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
import { MarketsPanel } from "./markets-panel"
import { MatchShare } from "./match-share"

export function FeaturedSportsMatchesSection() {
  const { addToBetslip } = useBetStore()
  const { user } = useAuth()
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedMatch, setSelectedMatch] = React.useState<any>(null)
  const [now, setNow] = React.useState(() => Date.now())
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Update timer every second
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const featuredMatches = useQuery(api.sportsData.listFeaturedMatches, {})

  const matchItems = React.useMemo(() => {
    if (!featuredMatches) return []
    return Array.isArray(featuredMatches) ? featuredMatches : []
  }, [featuredMatches])

  if (featuredMatches === undefined) {
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

  if (matchItems.length === 0) {
    return null
  }

  const sortedByStartTime = [...matchItems].sort((a, b) => a.startTime - b.startTime)

  const handleOpenDetail = (match: any) => {
    setSelectedMatch(match)
    setDetailOpen(true)
  }

  const handleAddToSlip = (match: any, outcome: { label: string; odds: number }) => {
    const timer = calculateEventTimer(match.startTime, now)
    if (timer.isFinished) {
      toast.error("This match has finished. Betting is no longer available.")
      return
    }

    const outcomeMap: Record<string, string> = {
      "1": match.homeTeam,
      "X": "Draw",
      "2": match.awayTeam,
    }

    addToBetslip({
      id: `${match.sourceMatchId}-${outcome.label}`,
      matchId: match.sourceMatchId,
      matchName: `${match.homeTeam} vs ${match.awayTeam}`,
      team1: match.homeTeam,
      team2: match.awayTeam,
      market: "1X2",
      selection: outcome.label,
      selectionName: outcomeMap[outcome.label] || outcome.label,
      odds: outcome.odds,
      marketName: "1X2",
      outcomeName: outcomeMap[outcome.label] || outcome.label,
      matchStartTime: match.startTime,
    })
    toast.success(`Added ${outcomeMap[outcome.label]} @ ${outcome.odds.toFixed(2)} to betslip`)
  }

  const matchTitle = selectedMatch
    ? `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`
    : ""

  const content = selectedMatch && (
    <div className="flex-1 overflow-hidden flex flex-col">
      <MarketsPanel
        open={detailOpen}
        onOpenChange={setDetailOpen}
        match={selectedMatch}
        readOnly={false}
      />
    </div>
  )

  const renderMatchCard = (match: any) => {
    const timer = calculateEventTimer(match.startTime, now)
    const badgeConfig = getEventBadgeConfig(timer.lifecycle)
    const isMatchFinished = timer.isFinished

    return (
      <div
        key={match.sourceMatchId}
        className="group relative overflow-hidden rounded-xl border border-amber-500/20 bg-card hover:border-amber-300/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all duration-300 shadow-lg"
      >
        {/* Header: Sport | Competition | Markets & Status (top right) */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-amber-400/20 bg-slate-900/30">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="text-[8px] font-bold uppercase bg-amber-500/20 text-amber-300 border-amber-400/40 shrink-0">
              {match.sportSlug || "Sports"}
            </Badge>
            <span className="text-[9px] text-amber-200/80 font-semibold truncate">{match.competitionName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <MatchShare
              title={`${match.homeTeam} vs ${match.awayTeam}`}
              matchId={match.sourceMatchId}
              competitionName={match.competitionName}
              startTime={match.startTime}
              isCustomEvent={false}
            />
            <button
              onClick={() => handleOpenDetail(match)}
              className="text-[8px] font-semibold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
            >
              +{match.totalMarkets} markets
            </button>
            <Badge
              variant={badgeConfig.variant}
              className={cn(
                "text-[8px] font-bold whitespace-nowrap bg-amber-400/30 text-amber-100 border-amber-400/50",
                badgeConfig.animate && "animate-pulse"
              )}
            >
              {badgeConfig.label}
            </Badge>
          </div>
        </div>

        {/* Main content - TIGHT SPACING */}
        <div className="px-4 py-3 space-y-2 bg-slate-900/20">
          {/* Countdown / Score - CENTERED */}
          <div className="space-y-0.5 text-center">
            <p className="text-[8px] text-amber-300/70 font-bold uppercase tracking-wider">
              {timer.lifecycle === "not_started" ? "Starts In" : "Score"}
            </p>
            <p className="text-2xl font-black text-amber-100 tabular-nums leading-tight drop-shadow-lg">
              {timer.lifecycle === "not_started"
                ? formatCountdownToStart(timer.remainingMs)
                : `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`}
            </p>
          </div>

          {/* Teams - Compact with better spacing */}
          <div className="flex items-center justify-center gap-2">
            <p className="font-semibold text-sm text-amber-100 truncate text-center flex-1">{match.homeTeam}</p>
            <p className="text-xs font-medium text-amber-300/70 shrink-0">vs</p>
            <p className="font-semibold text-sm text-amber-100 truncate text-center flex-1">{match.awayTeam}</p>
          </div>

          {/* Odds Display - Top 3 outcomes - ADD TO BETSLIP */}
          <div className={cn(
            "grid grid-cols-3 gap-2 pt-1",
            isMatchFinished && "opacity-50 pointer-events-none"
          )}>
            {[
              { label: "1", odds: 2.35 },
              { label: "X", odds: 3.15 },
              { label: "2", odds: 3.90 },
            ].map((odd) => (
              <button
                key={odd.label}
                disabled={isMatchFinished}
                onClick={() => !isMatchFinished && handleAddToSlip(match, odd)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border bg-card border-amber-500/40 hover:from-amber-800/60 hover:to-amber-900/40 hover:border-amber-300/60 transition-all duration-200 group/odd",
                  isMatchFinished && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="text-[9px] font-semibold text-amber-300">{odd.label}</span>
                <span className="text-xs font-bold text-amber-200">{odd.odds.toFixed(2)}</span>
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
            <h2 className="text-base font-bold text-foreground">Featured Matches</h2>
            <Badge variant="outline" className="text-[10px] font-mono">
              {sortedByStartTime.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {sortedByStartTime.map(renderMatchCard)}
          </div>
        </div>

        {/* Mobile Drawer */}
        <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
          <DrawerContent className="h-[90vh] flex flex-col overflow-hidden p-0 bg-card">
            <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
              <DrawerTitle className="truncate text-sm font-semibold">{matchTitle}</DrawerTitle>
              <p className="truncate text-xs text-muted-foreground">{selectedMatch?.competitionName}</p>
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
            {sortedByStartTime.length}
          </Badge>
        </div>

        {/* Featured Match Cards (Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedByStartTime.map(renderMatchCard)}
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
            <p className="truncate text-xs text-muted-foreground">{selectedMatch?.competitionName}</p>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  )
}
