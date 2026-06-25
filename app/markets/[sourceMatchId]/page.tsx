"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { ArrowLeft, Share2 } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MarketsBrowser,
  type SportsMatchWithOdds,
  type SportsMatch,
} from "@/components/markets-panel"

function CountdownTimer({ startTime, isLive }: { startTime: number; isLive: boolean }) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    if (isLive) {
      setTimeLeft("LIVE")
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const diff = startTime - now

      if (diff <= 0) {
        setTimeLeft("LIVE")
        return
      }

      const hours = Math.floor(diff / (3600 * 1000))
      const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000))
      const seconds = Math.floor((diff % (60 * 1000)) / 1000)

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [startTime, isLive])

  if (timeLeft === "LIVE") {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] font-bold tracking-widest text-muted-foreground/80 uppercase">
          STATUS
        </span>
        <span className="text-sm font-extrabold text-destructive tracking-wide animate-pulse">
          LIVE
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] font-bold tracking-widest text-muted-foreground/85 uppercase">
        STARTS IN
      </span>
      <span className="text-xl font-black text-emerald-500 tracking-wide">
        {timeLeft}
      </span>
    </div>
  )
}

function formatStartTime(startTime: number) {
  if (!startTime) return ""
  return new Date(startTime).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function MatchMarketsPage() {
  const params = useParams<{ sourceMatchId: string }>()
  const router = useRouter()
  const sourceMatchId = params.sourceMatchId

  const match = useQuery(
    api.sportsData.getMatchWithMainOdds,
    sourceMatchId ? { sourceMatchId } : "skip"
  ) as SportsMatchWithOdds | null | undefined

  const liveMatches = useQuery(api.sportsData.listMatches, {
    status: "live",
    limit: 80,
  }) as SportsMatch[] | { items: SportsMatch[] } | undefined

  const liveCount = useMemo(() => {
    if (!liveMatches) return 0
    if (Array.isArray(liveMatches)) return liveMatches.filter((m) => m.isLive).length
    if (liveMatches && typeof liveMatches === "object" && Array.isArray((liveMatches as { items?: unknown }).items)) {
      return (liveMatches as { items: SportsMatch[] }).items.filter((m) => m.isLive).length
    }
    return 0
  }, [liveMatches])

  useEffect(() => {
    if (match) {
      document.title = `${match.homeTeam} vs ${match.awayTeam} - Markets | BetixPro`
    } else {
      document.title = "Match Markets | BetixPro"
    }
  }, [match])

  const handleShare = () => {
    if (match && navigator.share) {
      navigator.share({
        title: `${match.homeTeam} vs ${match.awayTeam} Odds`,
        url: window.location.href,
      }).catch(() => { })
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <main className="flex-1 min-w-0 flex flex-col">
        {!match && match !== null && (
          <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}

        {match === null && (
          <div className="p-6 text-center text-sm text-muted-foreground flex-1">
            Match not found.
          </div>
        )}

        {match && (
          <>
            {/* Custom Header Layout matching reference screenshot */}
            <div className="flex flex-col bg-card border-b border-border pb-4">
              {/* Top row with category back and share buttons */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 hover:bg-muted"
                    onClick={() => router.back()}
                    aria-label="Back"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <span className="truncate text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {match.competitionName}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 border-border bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                  onClick={handleShare}
                  aria-label="Share match odds"
                >
                  <Share2 className="size-4" />
                </Button>
              </div>

              {/* Countdown block */}
              <div className="py-2">
                <CountdownTimer startTime={match.startTime} isLive={match.isLive} />
              </div>

              {/* Centered Team Names with VS Badge */}
              <div className="flex flex-col items-center gap-1.5 px-4 text-center">
                <div className="flex items-center justify-center flex-wrap gap-2.5 max-w-full">
                  <span className="text-base font-extrabold text-foreground truncate max-w-[160px] sm:max-w-xs">
                    {match.homeTeam}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground/80 px-2 py-0.5 rounded border border-border/80 bg-muted/20 uppercase">
                    vs
                  </span>
                  <span className="text-base font-extrabold text-foreground truncate max-w-[160px] sm:max-w-xs">
                    {match.awayTeam}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground/80">
                  Start: {formatStartTime(match.startTime)}
                </span>
              </div>
            </div>

            <MarketsBrowser
              match={match}
              queryEnabled
              mode="page"
              className="flex-1"
            />
          </>
        )}
      </main>
      <BottomNav liveCount={liveCount} />
    </div>
  )
}
