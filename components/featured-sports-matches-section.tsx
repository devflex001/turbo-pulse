"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useBetStore } from "@/hooks/use-bet-store"
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

// Track selected (added) bet outcomes per match
type SelectedOdds = Record<string, string | null>

export function FeaturedSportsMatchesSection() {
  const { addToBetslip } = useBetStore()
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedMatch, setSelectedMatch] = React.useState<any>(null)
  const [now, setNow] = React.useState(() => Date.now())
  const [selectedOdds, setSelectedOdds] = React.useState<SelectedOdds>({})
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

    // Update selected odds for this match
    setSelectedOdds((prev) => ({ ...prev, [matchId]: outcome.label }))

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
    const activeOdd = selectedOdds[matchId] ?? null

    return (
      <div
        key={matchId}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl transition-all duration-300",
          // Premium dark background with amber/gold shimmer border
          "bg-[#0d1117] shadow-lg",
          isLive
            ? "border border-emerald-500/60 shadow-emerald-500/10 shadow-lg"
            : "border border-amber-500/40 shadow-amber-500/5 shadow-lg",
          "hover:border-amber-400/70 hover:shadow-amber-400/15 hover:shadow-xl"
        )}
      >
        {/* Shiny top highlight line */}
        <div className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[2px]",
          isLive
            ? "bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            : "bg-gradient-to-r from-transparent via-amber-400 to-transparent"
        )} />

        {/* Subtle radial glow in background */}
        <div className={cn(
          "pointer-events-none absolute inset-0 opacity-[0.04]",
          isLive
            ? "bg-[radial-gradient(ellipse_at_top,_#10b981,_transparent_70%)]"
            : "bg-[radial-gradient(ellipse_at_top,_#f59e0b,_transparent_70%)]"
        )} />

        {/* Header */}
        <div className="relative flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5 min-w-0">
            {isLive ? (
              <span className="flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 shrink-0 uppercase tracking-wide">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            ) : isItemFinished ? (
              <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/40 shrink-0 uppercase tracking-wide">
                FT
              </span>
            ) : (
              <span className="rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-400/90 shrink-0 uppercase tracking-wide">
                Featured
              </span>
            )}
            <span className="text-[11px] font-medium text-white/40 truncate capitalize">
              {competitionName}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <MatchShare
              title={`${item.homeTeam} vs ${item.awayTeam}`}
              matchId={matchId}
              competitionName={competitionName}
              startTime={item.startTime}
              isCustomEvent={isCustom}
            />
            <button
              onClick={() => handleOpenDetail(item)}
              className="text-[11px] font-semibold text-amber-400/70 hover:text-amber-300 transition-colors"
            >
              +{item.totalMarkets} mkts
            </button>
          </div>
        </div>

        {/* Score / countdown */}
        <div className="relative px-4 pt-3 pb-2 text-center">
          <p className="text-[10px] font-semibold tracking-widest text-white/30 uppercase mb-0.5">
            {timer.lifecycle === "not_started" ? "Starts In" : "Score"}
          </p>
          <p className={cn(
            "text-2xl font-extrabold tabular-nums leading-none tracking-tight",
            isLive ? "text-emerald-300" : "text-amber-300"
          )}>
            {timer.lifecycle === "not_started"
              ? formatCountdownToStart(timer.remainingMs)
              : `${item.homeScore ?? 0} – ${item.awayScore ?? 0}`}
          </p>
        </div>

        {/* Teams */}
        <div className="relative flex items-center justify-center gap-2 px-4 pb-3">
          <p className="font-bold text-[13px] text-white/90 truncate text-right flex-1">{item.homeTeam}</p>
          <p className="text-[10px] font-semibold text-white/25 shrink-0 uppercase tracking-widest">vs</p>
          <p className="font-bold text-[13px] text-white/90 truncate flex-1">{item.awayTeam}</p>
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-white/[0.06]" />

        {/* Odds */}
        <div className={cn(
          "relative grid grid-cols-3 gap-2 p-3",
          isItemFinished && "opacity-40 pointer-events-none"
        )}>
          {[
            { label: "1", odds: 2.35 },
            { label: "X", odds: 3.15 },
            { label: "2", odds: 3.90 },
          ].map((odd) => {
            const isSelected = activeOdd === odd.label
            return (
              <button
                key={odd.label}
                disabled={isItemFinished}
                onClick={() => !isItemFinished && handleAddToSlip(item, odd)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 h-12 rounded-lg border transition-all duration-200 overflow-hidden",
                  isSelected
                    ? cn(
                      "border-amber-400/80 bg-amber-500/20 shadow-md shadow-amber-500/20",
                      "after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-amber-300/80 after:to-transparent"
                    )
                    : "border-white/[0.08] bg-white/[0.03] hover:bg-amber-500/10 hover:border-amber-400/40",
                  isItemFinished && "cursor-not-allowed"
                )}
              >
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wide",
                  isSelected ? "text-amber-300" : "text-white/35"
                )}>
                  {odd.label}
                </span>
                <span className={cn(
                  "text-sm font-extrabold font-mono",
                  isSelected ? "text-amber-200" : "text-white/80"
                )}>
                  {odd.odds.toFixed(2)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white/90 tracking-wide uppercase">Featured Matches</h2>
            <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-bold text-amber-400">
              {allItems.length}
            </span>
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white/90 tracking-wide uppercase">Featured Matches</h2>
          <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-xs font-bold text-amber-400">
            {allItems.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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