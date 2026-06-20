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
import { ArrowLeft, Edit2, Trash2, Share2, Search, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export function CustomEventDetail({
  eventId,
  onBack,
  onEdit,
}: CustomEventDetailProps) {
  const [selectedMarketId, setSelectedMarketId] = React.useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = React.useState("All")
  const [searchTerm, setSearchTerm] = React.useState("")

  const event = useQuery(api.customEvents.getCustomEvent, { eventId })
  const markets = useQuery(api.customEvents.listCustomMarkets, { eventId }) as
    | CustomMarketRow[]
    | undefined

  const publishEvent = useMutation(api.customEvents.publishCustomEvent)
  const deleteEvent = useMutation(api.customEvents.deleteCustomEvent)

  const selectedMarket = markets?.find((m) => m._id === selectedMarketId)
  const odds = useQuery(
    api.customEvents.listCustomOdds,
    selectedMarket ? { marketId: selectedMarket._id } : "skip"
  ) as CustomOddRow[] | undefined

  const categories = React.useMemo(() => {
    if (!markets) return ["All"]
    const types = markets.map((m) => m.marketTypes[0] || m.marketType || "Other")
    return ["All", ...Array.from(new Set(types)).sort()]
  }, [markets])

  const filteredMarkets = React.useMemo(() => {
    if (!markets) return []
    const query = searchTerm.toLowerCase()
    return markets
      .filter((m) => selectedCategory === "All" || m.marketTypes[0] === selectedCategory)
      .filter((m) => {
        if (!query) return true
        return `${m.name} ${m.marketType}`.toLowerCase().includes(query)
      })
      .sort((a, b) => a.priority - b.priority)
  }, [markets, selectedCategory, searchTerm])

  // Auto-select first market
  React.useEffect(() => {
    if (selectedMarketId === null && filteredMarkets.length > 0) {
      setSelectedMarketId(filteredMarkets[0]._id)
    }
  }, [selectedCategory, filteredMarkets, selectedMarketId])

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

  const formatTime = (ms: number) => {
    const date = new Date(ms)
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header with Event Title and Controls */}
      <div className="shrink-0 border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">{event.title}</h1>
            <p className="text-xs text-muted-foreground">{event.competition}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {event.status === "draft" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1.5"
                  onClick={onEdit}
                >
                  <Edit2 className="size-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs bg-orange-600 hover:bg-orange-700 text-white border-0"
                  onClick={handlePublish}
                >
                  Publish
                </Button>
              </>
            )}
            {event.status === "published" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5"
              >
                <Share2 className="size-3" />
                Share
              </Button>
            )}
            {event.status === "draft" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Event Meta Info */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>{formatTime(event.startTime)}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{event.totalMarkets} markets</span>
          </div>
          <Badge
            className={cn(
              "text-[10px] font-semibold shrink-0",
              event.status === "draft"
                ? "bg-yellow-500/15 text-yellow-600 border border-yellow-500/30"
                : "bg-green-500/15 text-green-600 border border-green-500/30"
            )}
          >
            {event.status}
          </Badge>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="shrink-0 border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search markets"
              className="h-8 pl-8 text-xs focus-visible:ring-primary bg-muted/50"
            />
          </div>

          {/* Category Filter - Only show if more than one category */}
          {categories.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 border-border"
                >
                  {selectedCategory}
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={selectedCategory === cat ? "bg-accent" : ""}
                  >
                    {cat}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Markets Content */}
      {markets ? (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Markets List Panel */}
          <div className="w-40 flex flex-col border-r border-border overflow-hidden shrink-0">
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {filteredMarkets.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-xs">
                    No markets found
                  </div>
                ) : (
                  filteredMarkets.map((market) => (
                    <Button
                      key={market._id}
                      variant={selectedMarketId === market._id ? "secondary" : "ghost"}
                      className={cn(
                        "h-auto w-full justify-start gap-2 px-2.5 py-2 text-left text-xs font-medium rounded-sm",
                        !market.isActive && "opacity-50"
                      )}
                      onClick={() => setSelectedMarketId(market._id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{market.name}</div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1">
                          {market.marketTypes.join(", ")}
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Odds Display Panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {selectedMarket ? (
              <>
                {/* Market Header */}
                <div className="shrink-0 px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-bold truncate">{selectedMarket.name}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {selectedMarket.marketTypes.join(" • ")}
                  </p>
                </div>

                {/* Odds Grid */}
                {odds ? (
                  odds.length > 0 ? (
                    <ScrollArea className="flex-1 overflow-hidden">
                      <div className="p-4 space-y-2">
                        {odds
                          .filter((o) => o.isActive)
                          .sort((a, b) => a.priority - b.priority)
                          .map((odd) => (
                            <div
                              key={odd._id}
                              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-foreground">
                                  {odd.outcomeName}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-mono font-bold text-lg text-primary">
                                  {odd.oddValue.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                      No odds configured for this market
                    </div>
                  )
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <SmallLoader />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a market to view odds
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <SmallLoader />
        </div>
      )}
    </div>
  )
}
