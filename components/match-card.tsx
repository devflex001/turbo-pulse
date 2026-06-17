"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useBetStore } from "@/hooks/use-bet-store"
import { useMediaQuery } from "@/hooks/use-media-query"
import { compareFormattedOdds, formatOddOutcome } from "@/lib/odds-format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Share2, ListPlus, Radio } from "lucide-react"
import { ShareModal } from "./modals"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MarketsPanel, type SportsMatchWithOdds } from "./markets-panel"

interface MatchCardProps {
  match: SportsMatchWithOdds
}

function formatStartTime(startTime: number) {
  if (!startTime) return "TBA"
  return new Date(startTime).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function scoreParts(result: string) {
  const parts = result.split(":")
  if (parts.length !== 2) return null
  return parts
}

export function MatchCard({ match }: MatchCardProps) {
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 767px)")
  const { betslip, addToBetslip } = useBetStore()
  const [shareOpen, setShareOpen] = React.useState(false)
  const [marketsOpen, setMarketsOpen] = React.useState(false)

  const matchTitle = `${match.homeTeam} vs ${match.awayTeam}`
  const scores = scoreParts(match.result)
  const mainOdds = [...match.mainOdds].sort(
    (a, b) => compareFormattedOdds(a, b, match) || a.priority - b.priority
  )

  const handleSelection = (odd: SportsMatchWithOdds["mainOdds"][number]) => {
    const outcome = formatOddOutcome(odd, match)

    addToBetslip({
      id: odd.sourceOddId,
      matchId: match.sourceMatchId,
      matchName: matchTitle,
      team1: match.homeTeam,
      team2: match.awayTeam,
      market: odd.marketName || "Main Market",
      selection: outcome.code,
      selectionName: outcome.code,
      odds: odd.oddValue,
      sourceOddId: odd.sourceOddId,
      marketKey: odd.marketKey,
      marketName: odd.marketName,
      outcomeName: odd.outcomeName,
      specifiers: odd.specifiers,
      matchStartTime: match.startTime,
    })
  }

  const openMarkets = () => {
    if (isMobile) {
      router.push(`/markets/${match.sourceMatchId}`)
      return
    }

    setMarketsOpen(true)
  }

  return (
    <>
      <div className="flex flex-col rounded-lg bg-card border border-border text-card-foreground hover:border-muted-foreground/30 transition-all shadow-sm">
        <div className="flex items-center justify-between text-[11px] bg-muted/40 px-4 py-2.5 rounded-t-lg border-b border-border/60 gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-muted-foreground min-w-0">
            <span className="truncate">{match.competitionName}</span>
            <span className="shrink-0">•</span>
            <span className="text-[10px] font-medium text-muted-foreground/80 shrink-0">
              {match.totalMarkets} markets
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {match.isLive ? (
              <Badge variant="destructive" className="flex gap-1 items-center font-bold text-[9px] h-4.5 px-1 py-0 rounded-sm bg-destructive text-destructive-foreground">
                <Radio className="size-2.5" />
                LIVE
              </Badge>
            ) : (
              <span className="font-semibold text-muted-foreground/85">
                {formatStartTime(match.startTime)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3.5 p-4 flex-1 justify-between">
          <div className="flex justify-between items-center gap-4 py-0.5">
            <div className="flex flex-col gap-2 font-semibold text-sm flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <span className="truncate">{match.homeTeam}</span>
                {match.isLive && scores && (
                  <span className="text-primary font-extrabold font-mono text-sm">{scores[0]}</span>
                )}
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="truncate">{match.awayTeam}</span>
                {match.isLive && scores && (
                  <span className="text-primary font-extrabold font-mono text-sm">{scores[1]}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground shrink-0 border border-transparent hover:border-border"
                    onClick={openMarkets}
                    aria-label="Open markets"
                  >
                    <ListPlus className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[10px]">Open Markets</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground shrink-0 border border-transparent hover:border-border"
                    onClick={() => setShareOpen(true)}
                    aria-label="Share match odds"
                  >
                    <Share2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-[10px]">Share Match Odds</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {mainOdds.length > 0 ? (
              mainOdds.map((odd) => {
                const selected = betslip.find((item) => item.id === odd.sourceOddId)
                const outcome = formatOddOutcome(odd, match)
                return (
                  <Button
                    key={odd.sourceOddId}
                    variant="outline"
                    className={`flex flex-col gap-0.5 h-11 py-1 px-2 border-border font-medium transition-colors hover:border-primary/50 hover:bg-accent/40 ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/95 hover:border-primary"
                        : "text-foreground"
                    }`}
                    onClick={() => handleSelection(odd)}
                  >
                    <span className={`text-[9px] ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {outcome.code}
                    </span>
                    <span className="text-xs font-bold font-mono">{odd.oddValue.toFixed(2)}</span>
                  </Button>
                )
              })
            ) : (
              <Button
                variant="outline"
                className="col-span-3 h-11 text-xs font-semibold"
                onClick={openMarkets}
              >
                View available markets
              </Button>
            )}
          </div>
        </div>
      </div>

      <ShareModal open={shareOpen} onOpenChange={setShareOpen} matchName={matchTitle} />
      <MarketsPanel open={marketsOpen} onOpenChange={setMarketsOpen} match={match} />
    </>
  )
}
