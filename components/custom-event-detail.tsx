"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useBetStore } from "@/hooks/use-bet-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { EyeOff, Send, Save, Trash2, Search } from "lucide-react"
import { formatOddOutcome } from "@/lib/odds-format"
import { calculateEventTimer } from "@/lib/event-timer"

interface CustomEventDetailProps {
  eventId: Id<"customEvents">
  onBack?: () => void
  adminControls?: boolean
  hideHeader?: boolean
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

function sortOdds(a: CustomOddRow, b: CustomOddRow) {
  return a.priority - b.priority || a.outcomeName.localeCompare(b.outcomeName)
}

export function CustomEventDetail({
  eventId,
  onBack,
  adminControls = false,
  hideHeader = false,
}: CustomEventDetailProps) {
  // All state first
  const [search, setSearch] = React.useState("")
  const [homeScore, setHomeScore] = React.useState<string>("")
  const [awayScore, setAwayScore] = React.useState<string>("")
  const [savingScore, setSavingScore] = React.useState(false)
  const [now, setNow] = React.useState(() => Date.now())

  // Update timer every second
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // All context/store hooks
  const { betslip, addToBetslip } = useBetStore()

  // All query hooks
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

  // All mutation hooks
  const publishEvent = useMutation(api.customEvents.publishCustomEvent)
  const unpublishEvent = useMutation(api.customEvents.unpublishCustomEvent)
  const deleteEvent = useMutation(api.customEvents.deleteCustomEvent)
  const updateScore = useMutation(api.customEvents.updateCustomEventScore)

  // All effects
  React.useEffect(() => {
    if (event) {
      setHomeScore(String(event.homeScore ?? 0))
      setAwayScore(String(event.awayScore ?? 0))
    }
  }, [event])

  // All memos - MUST be after all hooks above
  const groupedOdds = React.useMemo(() => {
    if (!allOdds || !markets) return new Map<string, CustomOddRow[]>()
    const groups = new Map<string, CustomOddRow[]>()
    for (const odd of allOdds) {
      const list = groups.get(odd.marketId) ?? []
      list.push(odd)
      groups.set(odd.marketId, list)
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
  const handleAddOdd = (odd: CustomOddRow, market: CustomMarketRow) => {
    if (isEventFinished) {
      toast.error("This event has finished. Betting is no longer available.")
      return
    }

    const outcomeMap: Record<string, string> = {
      "1": event?.homeTeam || "Home",
      "X": "Draw",
      "2": event?.awayTeam || "Away",
    }

    addToBetslip({
      id: `${event?._id}-${odd._id}`,
      matchId: event?._id || "",
      matchName: `${event?.homeTeam} vs ${event?.awayTeam}`,
      team1: event?.homeTeam || "",
      team2: event?.awayTeam || "",
      market: market.name,
      selection: odd.outcomeId,
      selectionName: odd.outcomeName,
      odds: odd.oddValue,
      marketName: market.name,
      outcomeName: odd.outcomeName,
      matchStartTime: event?.startTime,
    })
    toast.success(`Added ${odd.outcomeName} @ ${odd.oddValue.toFixed(2)} to betslip`)
  }

  const handlePublish = async () => {
    if (!confirm("Publish this event?")) return
    try {
      await publishEvent({ eventId })
      toast.success("Event published")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish")
    }
  }

  const handleUnpublish = async () => {
    if (!confirm("Unpublish this event?")) return
    try {
      await unpublishEvent({ eventId })
      toast.success("Event unpublished")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unpublish")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this event?")) return
    try {
      await deleteEvent({ eventId })
      toast.success("Event deleted")
      onBack?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    }
  }

  const handleScoreSave = async () => {
    const h = Number(homeScore)
    const a = Number(awayScore)
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
      toast.error("Invalid scores")
      return
    }
    setSavingScore(true)
    try {
      await updateScore({ eventId, homeScore: h, awayScore: a })
      toast.success("Score updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    } finally {
      setSavingScore(false)
    }
  }

  if (!event || !markets || !allOdds) {
    return <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
  }

  const timer = calculateEventTimer(event.startTime, now)
  const isEventFinished = timer.isFinished

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      {!hideHeader && (
        <div className="shrink-0 border-b border-border p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold">
                {event.homeTeam} vs {event.awayTeam}
              </h2>
              <p className="text-xs text-muted-foreground truncate">{event.competition}</p>
            </div>
            {adminControls && (
              <div className="flex gap-1 shrink-0">
                {event.status === "published" ? (
                  <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={handleUnpublish}>
                    <EyeOff className="size-3" />
                    Unpublish
                  </Button>
                ) : (
                  <Button size="sm" className="h-7 gap-1 px-2 text-xs" onClick={handlePublish}>
                    <Send className="size-3" />
                    Publish
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive" onClick={handleDelete}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            )}
          </div>

          {adminControls && (
            <div className="flex gap-2 items-end text-xs">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block">Home</label>
                <Input type="number" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} className="h-7 w-16 text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block">Away</label>
                <Input type="number" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} className="h-7 w-16 text-xs" />
              </div>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2" onClick={handleScoreSave} disabled={savingScore}>
                <Save className="size-3" />
              </Button>
            </div>
          )}
        </div>
      )}

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
            This event has finished. Betting is no longer available.
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
              const odds = groupedOdds.get(market._id) || []
              if (odds.length === 0) return null

              return (
                <div key={market._id} className="space-y-2 border-b border-border/20 pb-4 last:border-0 last:pb-0">
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
                      const isSelected = betslip.some((item) => item.id === `${event._id}-${odd._id}`)
                      const outcome = formatOddOutcome(
                        {
                          marketName: market.name,
                          outcomeId: odd.outcomeId,
                          outcomeName: odd.outcomeName,
                        },
                        {
                          homeTeam: event.homeTeam,
                          awayTeam: event.awayTeam,
                        }
                      )

                      return (
                        <button
                          key={odd._id}
                          disabled={isEventFinished}
                          onClick={() => !isEventFinished && handleAddOdd(odd, market)}
                          className={cn(
                            "group flex flex-col items-center justify-center gap-0.5 h-10 py-1 px-1.5 rounded border transition-all w-full text-center min-w-0",
                            isEventFinished && "opacity-50 cursor-not-allowed",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground hover:bg-primary/95"
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
