"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SmallLoader } from "@/components/small-loader"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Edit2, Trash2, Share2 } from "lucide-react"

interface CustomEventDetailProps {
  eventId: Id<"customEvents">
  onBack?: () => void
  onEdit?: () => void
}

interface CustomOddRow {
  _id: Id<"customOdds">
  marketId: Id<"customMarkets">
  outcomeId: string
  outcomeName: string
  oddValue: number
  priority: number
  isActive: boolean
}

interface CustomMarketRow {
  _id: Id<"customMarkets">
  name: string
  marketType: string
  marketTypes: string[]
  priority: number
  isActive: boolean
}

function marketCategory(market: CustomMarketRow) {
  return market.marketTypes[0] || market.marketType || "Other"
}

function sortOdds(a: CustomOddRow, b: CustomOddRow) {
  return a.priority - b.priority || a.outcomeName.localeCompare(b.outcomeName)
}

export function CustomEventDetail({
  eventId,
  onBack,
  onEdit,
}: CustomEventDetailProps) {
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState("All")
  const [selectedMarketId, setSelectedMarketId] = React.useState<string | null>(null)

  const event = useQuery(api.customEvents.getCustomEvent, { eventId })
  const markets = useQuery(api.customEvents.listCustomMarkets, { eventId }) as
    | CustomMarketRow[]
    | undefined
  const allOdds = useQuery(api.customEvents.listCustomOddsByEvent, { eventId }) as
    | CustomOddRow[]
    | undefined

  const publishEvent = useMutation(api.customEvents.publishCustomEvent)
  const deleteEvent = useMutation(api.customEvents.deleteCustomEvent)

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
      .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
  }, [activeCategory, markets, search])

  const effectiveMarketId = filteredMarkets.some(
    (market) => market._id === selectedMarketId
  )
    ? selectedMarketId
    : filteredMarkets[0]?._id ?? null

  const selectedMarket = markets?.find((market) => market._id === effectiveMarketId)
  const odds = useQuery(
    api.customEvents.listCustomOdds,
    selectedMarket ? { marketId: selectedMarket._id } : "skip"
  ) as CustomOddRow[] | undefined

  const groupedOdds = React.useMemo(() => {
    const groups = new Map<string, CustomOddRow[]>()
    for (const odd of allOdds ?? []) {
      const market = markets?.find((m) => m._id === odd.marketId)
      if (!market) continue
      const list = groups.get(market._id) ?? []
      list.push(odd)
      groups.set(market._id, list)
    }
    for (const list of groups.values()) {
      list.sort(sortOdds)
    }
    return groups
  }, [allOdds, markets])

  const handlePublish = async () => {
    if (!confirm("Publish this event? It will be visible to users.")) return

    try {
      await publishEvent({ eventId })
      toast.success("Event published successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this event? This cannot be undone.")) return

    try {
      await deleteEvent({ eventId })
      toast.success("Event deleted")
      onBack?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    }
  }

  if (!event) {
    return <SmallLoader />
  }

  const renderOddButton = (odd: CustomOddRow) => {
    return (
      <Button
        key={odd._id}
        variant="outline"
        className={cn(
          "flex flex-col items-center justify-center gap-1 h-12 py-1 px-1.5 border-border transition-all hover:bg-accent/40 text-center min-w-0 w-full bg-card hover:border-muted-foreground/30 text-foreground"
        )}
      >
        <span className="min-w-0 w-full truncate text-[9px] font-semibold leading-none text-muted-foreground">
          {odd.outcomeName}
        </span>
        <span className="font-mono text-[11px] font-bold leading-none text-foreground">
          {odd.oddValue.toFixed(2)}
        </span>
      </Button>
    )
  }

  const marketList = (
    <div className="space-y-1 p-3">
      {!markets && <SmallLoader />}

      {filteredMarkets.map((market) => (
        <Button
          key={market._id}
          variant={effectiveMarketId === market._id ? "secondary" : "ghost"}
          className="h-auto min-h-9 w-full justify-between gap-3 px-3 py-1.5 text-left"
          onClick={() => setSelectedMarketId(market._id)}
        >
          <span className="min-w-0 flex-1">
            <span className="block whitespace-normal break-words text-xs font-semibold leading-tight">
              {market.name}
            </span>
            <span className="block whitespace-normal break-words text-[10px] leading-tight text-muted-foreground">
              {market.marketTypes.length > 0 ? market.marketTypes.join(", ") : market.marketType || "Other"}
            </span>
          </span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {groupedOdds.get(market._id)?.length ?? 0}
          </span>
        </Button>
      ))}
    </div>
  )

  const oddsContent = (
    <div className="space-y-4 p-4">
      {selectedMarket && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold leading-tight">{selectedMarket.name}</h3>
          <p className="text-xs text-muted-foreground">
            {selectedMarket.marketTypes.length > 0
              ? selectedMarket.marketTypes.join(", ")
              : selectedMarket.marketType || "Other"}
            {" "}- {odds?.length ?? 0} odds
          </p>
        </div>
      )}

      {selectedMarket && !odds && <SmallLoader />}

      {odds && odds.length > 0 && (
        <div className={cn(
          "grid gap-2",
          odds.length === 2 || odds.length === 4 ? "grid-cols-2" : "grid-cols-3"
        )}>
          {[...odds]
            .sort((a, b) => sortOdds(a, b))
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Search and category tabs */}
      <div className="shrink-0 space-y-2 border-b border-border p-3 sm:p-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search markets"
          className="h-9 text-xs focus-visible:ring-primary"
        />

        <ScrollArea className="w-full">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="w-max h-auto gap-1 bg-transparent p-0">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="px-2.5 py-1 text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </ScrollArea>
      </div>

      {/* Markets and Odds */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ScrollArea className="min-h-0 border-b border-border lg:h-full lg:border-b-0 lg:border-r">
          {marketList}
        </ScrollArea>
        <ScrollArea className="min-h-0 lg:h-full">{oddsContent}</ScrollArea>
      </div>
    </div>
  )
}
