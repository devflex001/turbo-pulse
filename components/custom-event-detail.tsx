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
import { ArrowLeft, Edit2, Trash2, Share2, Clock, MapPin, TrendingUp } from "lucide-react"

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
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="space-y-3 border-b border-border pb-4 px-4 pt-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1.5"
            onClick={onBack}
          >
            <ArrowLeft className="size-3" />
            Back
          </Button>
          <div className="flex gap-1.5">
            {event.status === "draft" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs gap-1.5"
                  onClick={onEdit}
                >
                  <Edit2 className="size-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs"
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
                className="h-8 px-2 text-xs gap-1.5"
              >
                <Share2 className="size-3" />
                Share
              </Button>
            )}
            {event.status === "draft" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Event Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold">{event.title}</h1>
              <p className="text-sm font-semibold text-foreground">
                {event.homeTeam} vs {event.awayTeam}
              </p>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
              )}
            </div>
            <Badge
              className={cn(
                "text-[10px] font-semibold",
                event.status === "draft"
                  ? "bg-yellow-500/15 text-yellow-600 border border-yellow-500/30"
                  : "bg-green-500/15 text-green-600 border border-green-500/30"
              )}
            >
              {event.status}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{formatTime(event.startTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{event.competition}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{event.totalMarkets} markets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Markets Browser */}
      {markets ? (
        <div className="flex-1 min-h-0 flex flex-col gap-3 px-4 pb-4">
          {/* Category Tabs */}
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="w-full"
          >
            <ScrollArea>
              <TabsList className="h-8 w-max gap-1 bg-transparent p-0 border-b border-border">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="h-7 px-3 text-xs rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </Tabs>

          <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
            {/* Markets List */}
            <div className="w-32 flex flex-col gap-2 border-r border-border pr-3 overflow-hidden">
              <Input
                placeholder="Search markets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-xs bg-muted/50 shrink-0"
              />

              <ScrollArea className="flex-1">
                <div className="space-y-1 pr-3">
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
                          "h-auto min-h-9 w-full justify-between gap-2 px-2 py-1.5 text-left text-xs",
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
                        {!market.isActive && (
                          <Badge variant="outline" className="text-[9px] shrink-0">
                            Inactive
                          </Badge>
                        )}
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Odds Grid */}
            <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-hidden">
              {selectedMarket ? (
                <>
                  <div>
                    <h3 className="text-sm font-semibold truncate">{selectedMarket.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedMarket.marketTypes.join(", ")}
                    </p>
                  </div>

                  {odds ? (
                    odds.length > 0 ? (
                      <ScrollArea className="flex-1 border border-border rounded-lg overflow-hidden">
                        <div className="p-3 space-y-1.5">
                          {odds
                            .filter((o) => o.isActive)
                            .sort((a, b) => a.priority - b.priority)
                            .map((odd) => (
                              <div
                                key={odd._id}
                                className="flex items-center justify-between p-2 rounded border border-border bg-card hover:bg-muted/50 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold truncate">{odd.outcomeName}</div>
                                  {odd.oddValue && (
                                    <div className="text-xs text-muted-foreground">
                                      Odds: {odd.oddValue.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <div className="text-right">
                                    <div className="font-mono font-bold text-sm">
                                      {odd.oddValue.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
                        No odds configured
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
        </div>
      ) : (
        <SmallLoader />
      )}
    </div>
  )
}
