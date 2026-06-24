"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useBetStore } from "@/hooks/use-bet-store"
import {
  compareFormattedOdds,
  formatOddOutcome,
  shouldShowOddSpecifier,
  formatMarketName,
} from "@/lib/odds-format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useMediaQuery } from "@/hooks/use-media-query"

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

// Base match type without odds (for optimized loading)
export type SportsMatch = {
  source?: string
  sportSlug?: string
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
}

// Extended match type with odds (for backwards compatibility)
export type SportsMatchWithOdds = SportsMatch & {
  mainOdds: SportsOdd[]
}

interface MarketsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: SportsMatchWithOdds
  readOnly?: boolean
}

interface MarketsBrowserProps {
  match: SportsMatchWithOdds
  readOnly?: boolean
  queryEnabled?: boolean
  mode?: "sheet" | "page"
  className?: string
}

function marketCategory(market: SportsMarket) {
  return market.marketTypes[0] || market.marketType || "Other"
}

function sortOdds(a: SportsOdd, b: SportsOdd) {
  return a.priority - b.priority || a.outcomeName.localeCompare(b.outcomeName)
}

export function MarketsBrowser({
  match,
  readOnly = false,
  queryEnabled = true,
  mode = "sheet",
  className,
}: MarketsBrowserProps) {
  const { betslip, addToBetslip } = useBetStore()
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState("All")
  const [selectedMarketKey, setSelectedMarketKey] = React.useState<string | null>(null)

  const markets = useQuery(
    api.sportsData.listMarkets,
    queryEnabled ? { sourceMatchId: match.sourceMatchId } : "skip"
  ) as SportsMarket[] | undefined
  const allOdds = useQuery(
    api.sportsData.listOddsByMatch,
    queryEnabled && mode === "page" ? { sourceMatchId: match.sourceMatchId } : "skip"
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
        return `${market.name} ${market.marketType} ${market.marketTypes.join(" ")}`.toLowerCase().includes(query)
      })
      .sort((a, b) => a.marketPriority - b.marketPriority || a.name.localeCompare(b.name))
  }, [activeCategory, markets, search])

  const effectiveMarketKey = filteredMarkets.some(
    (market) => market.marketKey === selectedMarketKey
  )
    ? selectedMarketKey
    : filteredMarkets[0]?.marketKey ?? null

  const selectedMarket = markets?.find((market) => market.marketKey === effectiveMarketKey)
  const odds = useQuery(
    api.sportsData.listOdds,
    queryEnabled && selectedMarket
      ? { sourceMatchId: match.sourceMatchId, marketKey: selectedMarket.marketKey }
      : "skip"
  ) as SportsOdd[] | undefined
  const groupedOdds = React.useMemo(() => {
    const groups = new Map<string, SportsOdd[]>()
    for (const odd of allOdds ?? []) {
      const list = groups.get(odd.marketKey) ?? []
      list.push(odd)
      groups.set(odd.marketKey, list)
    }
    for (const list of groups.values()) {
      list.sort(sortOdds)
    }
    return groups
  }, [allOdds])

  const matchName = `${match.homeTeam} vs ${match.awayTeam}`

  const handleOdd = (odd: SportsOdd) => {
    if (readOnly) return

    const outcome = formatOddOutcome(odd, match)

    addToBetslip({
      id: odd.sourceOddId,
      matchId: match.sourceMatchId,
      matchName,
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
  }

  const renderOddButton = (odd: SportsOdd) => {
    const selected = betslip.some((item) => item.id === odd.sourceOddId)
    const outcome = formatOddOutcome(odd, match)
    const showSpecifier =
      !outcome.isCode && shouldShowOddSpecifier(odd.specifiers, outcome.code)

    return (
      <Button
        key={odd.sourceOddId}
        variant="outline"
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 h-10 py-1 px-1.5 border-border transition-all hover:bg-accent/40 text-center min-w-0 w-full",
          readOnly && "cursor-default hover:bg-background",
          selected
            ? "bg-primary text-primary-foreground border-primary hover:bg-primary/95 hover:border-primary"
            : "bg-card hover:border-muted-foreground/30 text-foreground"
        )}
        onClick={() => handleOdd(odd)}
      >
        <span className={cn(
          "min-w-0 w-full truncate text-[9px] font-semibold leading-none",
          selected ? "text-primary-foreground/90" : "text-muted-foreground"
        )}>
          {outcome.code}
        </span>
        {showSpecifier && (
          <span
            className={cn(
              "block w-full truncate text-[8px] font-medium leading-none",
              selected ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {odd.specifiers}
          </span>
        )}
        <span className={cn(
          "font-mono text-[11px] font-bold leading-none",
          selected ? "text-primary-foreground" : "text-foreground"
        )}>
          {odd.oddValue.toFixed(2)}
        </span>
      </Button>
    )
  }

  const marketList = (
    <div className="space-y-1 p-3">
      {!markets && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {filteredMarkets.map((market) => (
        <Button
          key={market.marketKey}
          variant={effectiveMarketKey === market.marketKey ? "secondary" : "ghost"}
          className="h-auto min-h-9 w-full justify-between gap-3 px-3 py-1.5 text-left"
          onClick={() => setSelectedMarketKey(market.marketKey)}
        >
          <span className="min-w-0 flex-1">
            <span className="block whitespace-normal break-words text-xs font-semibold leading-tight">
              {formatMarketName(market, match)}
            </span>
            <span className="block whitespace-normal break-words text-[10px] leading-tight text-muted-foreground">
              {market.marketTypes.length > 0 ? market.marketTypes.join(", ") : market.marketType || "Other"}
            </span>
          </span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {market.oddsCount}
          </span>
        </Button>
      ))}
    </div>
  )

  const oddsContent = (
    <div className="space-y-4 p-4">
      {selectedMarket && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold leading-tight">{formatMarketName(selectedMarket, match)}</h3>
          <p className="text-xs text-muted-foreground">
            {selectedMarket.marketTypes.length > 0
              ? selectedMarket.marketTypes.join(", ")
              : selectedMarket.marketType || "Other"}
            {" "}- {selectedMarket.oddsCount} odds
          </p>
        </div>
      )}

      {selectedMarket && !odds && (
        <div className="space-y-2 p-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {odds && odds.length > 0 && (
        <div className={cn(
          "grid gap-2",
          odds.length === 2 || odds.length === 4 ? "grid-cols-2" : "grid-cols-3"
        )}>
          {[...odds]
            .sort((a, b) => compareFormattedOdds(a, b, match) || sortOdds(a, b))
            .map(renderOddButton)}
        </div>
      )}

      {markets && filteredMarkets.length === 0 && (
        <div className="py-10 text-center text-xs text-muted-foreground">
          No markets match your search.
        </div>
      )}

      {selectedMarket && odds && odds.length === 0 && (
        <div className="py-10 text-center text-xs text-muted-foreground">
          No odds found for this market.
        </div>
      )}
    </div>
  )

  const pageContent = (
    <div className="space-y-3 p-3 sm:p-4 pb-24">
      {(!markets || !allOdds) && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {markets && allOdds && filteredMarkets.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
          No markets match your search.
        </div>
      )}

      {markets && allOdds && filteredMarkets.map((market) => {
        const marketOdds = groupedOdds.get(market.marketKey) ?? []
        if (!marketOdds.length) return null

        return (
          <section key={market.marketKey} className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
              <div className="min-w-0">
                <h3 className="truncate text-[11px] font-semibold leading-tight text-foreground/90">
                  {formatMarketName(market, match)}
                </h3>
                <p className="truncate text-[9px] font-medium text-muted-foreground">
                  {market.marketTypes.length > 0
                    ? market.marketTypes.join(", ")
                    : market.marketType || "Other"}
                </p>
              </div>
            </div>

            <div className={cn(
              "grid gap-2 p-3",
              marketOdds.length === 2 || marketOdds.length === 4 ? "grid-cols-2" : "grid-cols-3"
            )}>
              {marketOdds.map(renderOddButton)}
            </div>
          </section>
        )
      })}
    </div>
  )

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {mode !== "page" && (
        <div className="shrink-0 space-y-3 border-b border-border p-4">
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
                  <TabsTrigger key={category} value={category} className="px-3 text-xs">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </ScrollArea>
        </div>
      )}

      {mode === "sheet" ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
          <ScrollArea className="min-h-0 border-b border-border lg:h-full lg:border-b-0 lg:border-r">
            {marketList}
          </ScrollArea>
          <ScrollArea className="min-h-0 lg:h-full">{oddsContent}</ScrollArea>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">{pageContent}</div>
      )}
    </div>
  )
}

export function MarketsPanel({ open, onOpenChange, match, readOnly = false }: MarketsPanelProps) {
  const matchName = `${match.homeTeam} vs ${match.awayTeam}`
  const isMobile = useMediaQuery("(max-width: 768px)")

  const content = (
    <MarketsBrowser
      match={match}
      readOnly={readOnly}
      queryEnabled={open}
      mode="sheet"
    />
  )

  const header = (
    <>
      <div className="truncate text-sm font-semibold">{matchName}</div>
      <p className="truncate text-xs text-muted-foreground">{match.competitionName}</p>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] flex flex-col overflow-hidden p-0 bg-card">
          <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <DrawerTitle className="truncate text-sm font-semibold">{matchName}</DrawerTitle>
            <p className="truncate text-xs text-muted-foreground">{match.competitionName}</p>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-[min(50vw,720px)] !max-w-none flex h-dvh flex-col overflow-hidden p-0 bg-card"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
          <SheetTitle className="truncate text-sm font-semibold">{matchName}</SheetTitle>
          <p className="truncate text-xs text-muted-foreground">{match.competitionName}</p>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  )
}
