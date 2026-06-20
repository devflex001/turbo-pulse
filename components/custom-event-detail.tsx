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
import { EyeOff, Send, Save, Trash2 } from "lucide-react"

interface CustomEventDetailProps {
  eventId: Id<"customEvents">
  onBack?: () => void
  onEdit?: () => void
  adminControls?: boolean
}

interface CustomEventRow {
  _id: Id<"customEvents">
  title: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  startTime: number
  competition: string
  status: "draft" | "published"
  totalMarkets: number
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

function formatCountdown(startTime: number, now: number) {
  const diff = startTime - now
  if (diff <= 0) return "Started"

  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  return `${hours}h ${minutes}m ${seconds}s`
}

function CustomEventScoreControls({
  eventId,
  initialHomeScore,
  initialAwayScore,
}: {
  eventId: Id<"customEvents">
  initialHomeScore: number
  initialAwayScore: number
}) {
  const updateScore = useMutation(api.customEvents.updateCustomEventScore)
  const [homeScore, setHomeScore] = React.useState(String(initialHomeScore))
  const [awayScore, setAwayScore] = React.useState(String(initialAwayScore))
  const [savingScore, setSavingScore] = React.useState(false)

  const handleScoreSave = async () => {
    const parsedHomeScore = Number(homeScore)
    const parsedAwayScore = Number(awayScore)

    if (
      !Number.isInteger(parsedHomeScore) ||
      !Number.isInteger(parsedAwayScore) ||
      parsedHomeScore < 0 ||
      parsedAwayScore < 0
    ) {
      toast.error("Scores must be whole numbers")
      return
    }

    setSavingScore(true)
    try {
      await updateScore({
        eventId,
        homeScore: parsedHomeScore,
        awayScore: parsedAwayScore,
      })
      toast.success("Score updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update score"
      )
    } finally {
      setSavingScore(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-[72px_72px] gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground">
            Home
          </label>
          <Input
            type="number"
            min={0}
            step={1}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground">
            Away
          </label>
          <Input
            type="number"
            min={0}
            step={1}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 text-xs"
        onClick={handleScoreSave}
        disabled={savingScore}
      >
        <Save className="size-3" />
        {savingScore ? "Saving" : "Save Score"}
      </Button>
    </>
  )
}

export function CustomEventDetail({
  eventId,
  onBack,
  adminControls = false,
}: CustomEventDetailProps) {
  const [search, setSearch] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState("All")
  const [selectedMarketId, setSelectedMarketId] = React.useState<string | null>(
    null
  )
  const [now, setNow] = React.useState(() => Date.now())

  const event = useQuery(api.customEvents.getCustomEvent, { eventId }) as
    | CustomEventRow
    | null
    | undefined
  const markets = useQuery(api.customEvents.listCustomMarkets, { eventId }) as
    | CustomMarketRow[]
    | undefined
  const allOdds = useQuery(api.customEvents.listCustomOddsByEvent, {
    eventId,
  }) as CustomOddRow[] | undefined

  const publishEvent = useMutation(api.customEvents.publishCustomEvent)
  const unpublishEvent = useMutation(api.customEvents.unpublishCustomEvent)
  const deleteEvent = useMutation(api.customEvents.deleteCustomEvent)

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const categories = React.useMemo(() => {
    const names = (markets ?? []).map(marketCategory)
    return ["All", ...Array.from(new Set(names)).sort()]
  }, [markets])

  const filteredMarkets = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return (markets ?? [])
      .filter(
        (market) =>
          activeCategory === "All" || marketCategory(market) === activeCategory
      )
      .filter((market) => {
        if (!query) return true
        return `${market.name} ${market.marketType} ${market.marketTypes.join(" ")}`
          .toLowerCase()
          .includes(query)
      })
      .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
  }, [activeCategory, markets, search])

  const effectiveMarketId = filteredMarkets.some(
    (market) => market._id === selectedMarketId
  )
    ? selectedMarketId
    : (filteredMarkets[0]?._id ?? null)

  const selectedMarket = markets?.find(
    (market) => market._id === effectiveMarketId
  )
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

  const handleUnpublish = async () => {
    if (
      !confirm("Unpublish this event? It will no longer be visible to users.")
    )
      return

    try {
      await unpublishEvent({ eventId })
      toast.success("Event unpublished")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unpublish"
      )
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

  const currentHomeScore = event.homeScore ?? 0
  const currentAwayScore = event.awayScore ?? 0
  const countdown = formatCountdown(event.startTime, now)
  const hasStarted = event.startTime <= now

  const renderOddButton = (odd: CustomOddRow) => {
    return (
      <Button
        key={odd._id}
        variant="outline"
        className={cn(
          "flex h-12 w-full min-w-0 flex-col items-center justify-center gap-1 border-border bg-card px-1.5 py-1 text-center text-foreground transition-all hover:border-muted-foreground/30 hover:bg-accent/40"
        )}
      >
        <span className="w-full min-w-0 truncate text-[9px] leading-none font-semibold text-muted-foreground">
          {odd.outcomeName}
        </span>
        <span className="font-mono text-[11px] leading-none font-bold text-foreground">
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
            <span className="block text-xs leading-tight font-semibold break-words whitespace-normal">
              {market.name}
            </span>
            <span className="block text-[10px] leading-tight break-words whitespace-normal text-muted-foreground">
              {market.marketTypes.length > 0
                ? market.marketTypes.join(", ")
                : market.marketType || "Other"}
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
          <h3 className="text-sm leading-tight font-semibold">
            {selectedMarket.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {selectedMarket.marketTypes.length > 0
              ? selectedMarket.marketTypes.join(", ")
              : selectedMarket.marketType || "Other"}{" "}
            - {odds?.length ?? 0} odds
          </p>
        </div>
      )}

      {selectedMarket && !odds && <SmallLoader />}

      {odds && odds.length > 0 && (
        <div
          className={cn(
            "grid gap-2",
            odds.length === 2 || odds.length === 4
              ? "grid-cols-2"
              : "grid-cols-3"
          )}
        >
          {[...odds].sort((a, b) => sortOdds(a, b)).map(renderOddButton)}
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
      <div className="shrink-0 border-b border-border p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold">
                {event.homeTeam} vs {event.awayTeam}
              </h2>
              <Badge variant="outline" className="text-[10px] capitalize">
                {event.status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{event.competition}</span>
              <span className="font-mono text-foreground">
                {currentHomeScore} - {currentAwayScore}
              </span>
              <span>
                {hasStarted ? "Started" : "Starts in:"}{" "}
                {!hasStarted && (
                  <span className="font-mono text-foreground">{countdown}</span>
                )}
              </span>
            </div>
          </div>

          {adminControls && (
            <div className="flex flex-wrap items-end gap-2">
              <CustomEventScoreControls
                key={`${event._id}:${currentHomeScore}:${currentAwayScore}`}
                eventId={eventId}
                initialHomeScore={currentHomeScore}
                initialAwayScore={currentAwayScore}
              />
              {event.status === "published" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handleUnpublish}
                >
                  <EyeOff className="size-3" />
                  Unpublish
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={handlePublish}
                >
                  <Send className="size-3" />
                  Publish
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="size-3" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

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
            <TabsList className="h-auto w-max gap-1 bg-transparent p-0">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="rounded-none border-b-2 border-b-transparent px-2.5 py-1 text-xs data-[state=active]:border-b-primary"
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
        <ScrollArea className="min-h-0 border-b border-border lg:h-full lg:border-r lg:border-b-0">
          {marketList}
        </ScrollArea>
        <ScrollArea className="min-h-0 lg:h-full">{oddsContent}</ScrollArea>
      </div>
    </div>
  )
}
