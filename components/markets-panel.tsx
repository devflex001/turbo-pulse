"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useBetStore } from "@/hooks/use-bet-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

type SportsMarket = {
  marketKey: string
  name: string
  marketType: string
  marketTypes: string[]
  marketPriority: number
  oddsCount: number
  hasActiveOdds: boolean
}

export type SportsMatchWithOdds = {
  sourceMatchId: string
  homeTeam: string
  awayTeam: string
  startTime: number
  competitionName: string
  result: string
  status: number
  statusDesc: string
  isLive: boolean
  totalMarkets: number
  mainOdds: SportsOdd[]
}

interface MarketsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: SportsMatchWithOdds
}

function marketCategory(market: SportsMarket) {
  return market.marketTypes[0] || market.marketType || "Other"
}

export function MarketsPanel({ open, onOpenChange, match }: MarketsPanelProps) {
  const { betslip, addToBetslip } = useBetStore()
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState("All")
  const [selectedMarketKey, setSelectedMarketKey] = React.useState<string | null>(null)

  const markets = useQuery(
    api.sportsData.listMarkets,
    open ? { sourceMatchId: match.sourceMatchId } : "skip"
  ) as SportsMarket[] | undefined

  const selectedMarket = markets?.find((market) => market.marketKey === selectedMarketKey)
  const odds = useQuery(
    api.sportsData.listOdds,
    open && selectedMarket
      ? { sourceMatchId: match.sourceMatchId, marketKey: selectedMarket.marketKey }
      : "skip"
  ) as SportsOdd[] | undefined

  const categories = React.useMemo(() => {
    const names = (markets ?? []).map(marketCategory)
    return ["All", ...Array.from(new Set(names)).sort()]
  }, [markets])

  const filteredMarkets = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return (markets ?? [])
      .filter((market) => activeCategory === "All" || marketCategory(market) === activeCategory)
      .filter((market) => {
        if (!query) return true
        return `${market.name} ${market.marketType}`.toLowerCase().includes(query)
      })
      .sort((a, b) => a.marketPriority - b.marketPriority || a.name.localeCompare(b.name))
  }, [activeCategory, markets, search])

  React.useEffect(() => {
    if (!open) return
    if (!selectedMarketKey && filteredMarkets.length > 0) {
      setSelectedMarketKey(filteredMarkets[0].marketKey)
    }
    if (
      selectedMarketKey &&
      filteredMarkets.length > 0 &&
      !filteredMarkets.some((market) => market.marketKey === selectedMarketKey)
    ) {
      setSelectedMarketKey(filteredMarkets[0].marketKey)
    }
  }, [filteredMarkets, open, selectedMarketKey])

  const matchName = `${match.homeTeam} vs ${match.awayTeam}`

  const handleOdd = (odd: SportsOdd) => {
    addToBetslip({
      id: odd.sourceOddId,
      matchId: match.sourceMatchId,
      matchName,
      team1: match.homeTeam,
      team2: match.awayTeam,
      market: odd.marketName,
      selection: odd.outcomeName || odd.outcomeId,
      selectionName: odd.outcomeAlias || odd.outcomeName || odd.outcomeId,
      odds: odd.oddValue,
      sourceOddId: odd.sourceOddId,
      marketKey: odd.marketKey,
      marketName: odd.marketName,
      outcomeName: odd.outcomeName,
      specifiers: odd.specifiers,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border text-left">
          <SheetTitle className="text-sm font-bold truncate">{matchName}</SheetTitle>
          <p className="text-xs text-muted-foreground truncate">{match.competitionName}</p>
        </SheetHeader>

        <div className="p-4 space-y-3 border-b border-border">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search markets"
            className="h-9 text-xs focus-visible:ring-primary"
          />

          <ScrollArea className="w-full">
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="w-max">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs px-3">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </ScrollArea>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[210px_1fr] min-h-0 flex-1">
          <ScrollArea className="border-b sm:border-b-0 sm:border-r border-border">
            <div className="p-3 space-y-1">
              {!markets && (
                <>
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </>
              )}

              {filteredMarkets.map((market) => (
                <Button
                  key={market.marketKey}
                  variant={selectedMarketKey === market.marketKey ? "secondary" : "ghost"}
                  className="w-full h-auto justify-between gap-2 px-2 py-2 text-left"
                  onClick={() => setSelectedMarketKey(market.marketKey)}
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold truncate">{market.name}</span>
                    <span className="block text-[10px] text-muted-foreground truncate">
                      {market.marketType || "Other"}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {market.oddsCount}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>

          <ScrollArea>
            <div className="p-4 space-y-3">
              {selectedMarket && (
                <div className="space-y-1">
                  <h3 className="text-sm font-bold">{selectedMarket.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedMarket.marketType}</p>
                </div>
              )}

              {selectedMarket && !odds && (
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                </div>
              )}

              {odds && odds.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {[...odds]
                    .sort((a, b) => a.priority - b.priority || a.outcomeName.localeCompare(b.outcomeName))
                    .map((odd) => {
                      const selected = betslip.some((item) => item.id === odd.sourceOddId)
                      return (
                        <Button
                          key={odd.sourceOddId}
                          variant="outline"
                          className={`h-auto min-h-11 justify-between gap-2 px-3 py-2 hover:border-primary/60 ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary hover:bg-primary"
                              : ""
                          }`}
                          onClick={() => handleOdd(odd)}
                        >
                          <span className="min-w-0 text-left">
                            <span className="block text-xs font-semibold truncate">
                              {odd.outcomeAlias || odd.outcomeName}
                            </span>
                            {odd.specifiers && (
                              <span className={`block text-[10px] truncate ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                {odd.specifiers}
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-xs font-bold shrink-0">
                            {odd.oddValue.toFixed(2)}
                          </span>
                        </Button>
                      )
                    })}
                </div>
              )}

              {markets && filteredMarkets.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  No markets match your search.
                </div>
              )}

              {selectedMarket && odds && odds.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  No active odds found for this market.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
