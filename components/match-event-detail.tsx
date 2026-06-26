"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useBetStore } from "@/hooks/use-bet-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Search } from "lucide-react"
import { formatOddOutcome } from "@/lib/odds-format"
import { calculateEventTimer } from "@/lib/event-timer"
import type { SportsMatchWithOdds, SportsMatch } from "@/components/markets-panel"

interface MatchEventDetailProps {
  match: SportsMatchWithOdds
  onBack?: () => void
}

type SportsMarket = {
  marketKey: string
  name: string
  marketType: string
  marketTypes: string[]
  marketPriority: number
  oddsCount: number
  hasActiveOdds: boolean
}

type SportsOdd = {
  sourceOddId: string
  sourceMatchId: string
  marketKey: string
  outcomeId: string
  specifiers: string
  outcomeName: string
  outcomeAlias: string
  marketName: string
  oddValue: number
  priority: number
}

function sortOdds(a: SportsOdd, b: SportsOdd) {
  return a.priority - b.priority || a.outcomeName.localeCompare(b.outcomeName)
}

export function MatchEventDetail({
  match,
  onBack,
}: MatchEventDetailProps) {
  const [search, setSearch] = React.useState("")
  const [now, setNow] = React.useState(() => Date.now())

  // Update timer every second
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // All context/store hooks
  const { betslip, addToBetslip } = useBetStore()

  // All query hooks
  const markets = useQuery(
    api.sportsData.listMarkets,
    { sourceMatchId: match.sourceMatchId }
  ) as SportsMarket[] | undefined

  const allOdds = useQuery(
    api.sportsData.listOddsByMatch,
    { sourceMatchId: match.sourceMatchId }
  ) as SportsOdd[] | undefined

  // Memos
  const groupedOdds = React.useMemo(() => {
    if (!allOdds || !markets) return new Map<string, SportsOdd[]>()
    const groups = new Map<string, SportsOdd[]>()
    for (const odd of allOdds) {
      const list = groups.get(odd.marketKey) ?? []
      list.push(odd)
      groups.set(odd.marketKey, list)
    }
    for (const list of groups.values()) {
      list.sort(sortOdds)
    }
    return groups
  }, [allOdds, markets])

  const filteredMarkets = React.useMemo(() => {
    if (!markets) return []
    if (!search.trim()) return markets
    const q = search.toLowerCase()
    return markets.filter((m) => `${m.name} ${m.marketType}`.toLowerCase().includes(q))
  }, [markets, search])

  // Handler functions
  const handleAddOdd = (odd: SportsOdd, market: SportsMarket) => {
    if (isEventFinished) {
      toast.error("This match has finished. Betting is no longer available.")
      return
    }

    const outcome = formatOddOutcome(odd, match)

    addToBetslip({
      id: odd.sourceOddId,
      matchId: match.sourceMatchId,
      matchName: `${match.homeTeam} vs ${match.awayTeam}`,
      team1: match.homeTeam,
      team2: match.awayTeam,
      market: odd.marketName,
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
    toast.success(`Added ${outcome.code} @ ${odd.oddValue.toFixed(2)} to betslip`)
  }

  if (!markets || !allOdds) {
    return <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
  }

  const timer = calculateEventTimer(match.startTime, now)
  const isEventFinished = timer.isFinished

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Search */}
      <div className="shrink-0 border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search markets..."
            className="h-8 text-xs pl-9"
          />
        </div>
      </div>

      {/* Closed Markets Banner */}
      {isEventFinished && (
        <div className="shrink-0 bg-muted/60 border-b border-muted-foreground/30 px-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground">
            This match has finished. Betting is no longer available.
          </p>
        </div>
      )}

      {/* Markets List */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
        <div className="p-3 space-y-4">
          {filteredMarkets.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">No markets found</div>
          ) : (
            filteredMarkets.map((market) => {
              const odds = groupedOdds.get(market.marketKey) || []
              if (odds.length === 0) return null

              return (
                <div key={market.marketKey} className="space-y-2 border-b border-border/20 pb-4 last:border-0 last:pb-0">
                  {/* Market Title */}
                  <div className="flex items-center justify-between px-2">
                    <p className="text-xs font-bold text-foreground">{market.name}</p>
                    <p className="text-[9px] text-muted-foreground">{odds.length} options</p>
                  </div>

                  {/* Odds Grid */}
                  <div
                    className={cn(
                      "grid gap-2 px-2",
                      odds.length === 2 || odds.length === 4 ? "grid-cols-2" : "grid-cols-3",
                      isEventFinished && "opacity-50 pointer-events-none"
                    )}
                  >
                    {odds.map((odd) => {
                      const isSelected = betslip.some((item) => item.id === odd.sourceOddId)
                      const outcome = formatOddOutcome(odd, match)

                      return (
                        <button
                          key={odd.sourceOddId}
                          disabled={isEventFinished}
                          onClick={() => !isEventFinished && handleAddOdd(odd, market)}
                          className={cn(
                            "group flex flex-col items-center justify-center gap-0.5 h-10 py-1 px-1.5 rounded border transition-all w-full text-center min-w-0",
                            isEventFinished && "opacity-50 cursor-not-allowed",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                              : "border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 text-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "text-[9px] font-semibold truncate min-w-0 w-full",
                              isSelected ? "text-primary-foreground/90" : "text-muted-foreground group-hover:text-foreground"
                            )}
                          >
                            {outcome.code}
                          </span>
                          <span
                            className={cn(
                              "font-bold text-[11px] font-mono",
                              isSelected ? "text-primary-foreground" : "text-foreground group-hover:text-primary"
                            )}
                          >
                            {odd.oddValue.toFixed(2)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
